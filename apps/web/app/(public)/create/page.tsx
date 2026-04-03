'use client'

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Extension } from '@tiptap/core'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Suggestion from '@tiptap/suggestion'
import { createDocument } from '@/app/(dashboard)/actions'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Download, ExternalLink, FileSpreadsheet, Plus, Save, Sparkles, Upload } from 'lucide-react'
import { TemplateGallery } from './_components/TemplateGallery'
import Papa from 'papaparse'
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { fetchJobStatus, pollForJob } from '@/lib/poll-for-job'

type TableColumn = {
	id: string
	label: string
}

type TableRow = Record<string, string>

type TableModel = {
	columns: TableColumn[]
	rows: TableRow[]
}

type SlashCommandItem = {
	title: string
	description: string
	action: () => void
}

function buildDefaultTable(): TableModel {
	const columns = ['A', 'B', 'C', 'D'].map((label, index) => ({
		id: `col-${index + 1}`,
		label,
	}))
	const rows = Array.from({ length: 3 }).map(() =>
		Object.fromEntries(columns.map((column) => [column.id, ''])),
	)
	return { columns, rows }
}

function normalizeHeader(value: string, index: number) {
	const trimmed = value.trim()
	if (trimmed) return trimmed
	return `Column ${index + 1}`
}

function buildTableFromMatrix(matrix: string[][]): TableModel {
	if (!matrix.length) return buildDefaultTable()
	const headerRow = matrix[0] ?? []
	const columns = headerRow.map((header, index) => ({
		id: `col-${index + 1}`,
		label: normalizeHeader(header, index),
	}))
	const dataRows = matrix
		.slice(1)
		.map((row) => Object.fromEntries(columns.map((column, index) => [column.id, row[index] ?? ''])))
	return {
		columns: columns.length ? columns : buildDefaultTable().columns,
		rows: dataRows.length ? dataRows : buildDefaultTable().rows,
	}
}

function parseCsvText(text: string): TableModel {
	const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true })
	const matrix = parsed.data ?? []
	return buildTableFromMatrix(matrix)
}

async function parseXlsxFile(file: File): Promise<TableModel> {
	const buffer = await file.arrayBuffer()
	const workbook = XLSX.read(buffer, { type: 'array' })
	const sheetName = workbook.SheetNames[0]
	if (!sheetName) return buildDefaultTable()
	const sheet = workbook.Sheets[sheetName]
	const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as string[][]
	return buildTableFromMatrix(matrix)
}

function createSlashCommandExtension(items: SlashCommandItem[]) {
	return Extension.create({
		name: 'slash-command',
		addProseMirrorPlugins() {
			return [
				Suggestion({
					editor: this.editor,
					char: '/',
					startOfLine: true,
					items: ({ query }) => {
						const loweredQuery = query.toLowerCase()
						return items.filter((item) => item.title.toLowerCase().includes(loweredQuery))
					},
					command: ({ editor, range, props }) => {
						editor.chain().focus().deleteRange(range).run()
						props.action()
					},
					render: () => {
						let popup: HTMLDivElement | null = null
						let selectedIndex = 0
						let latestItems: SlashCommandItem[] = []
						let latestCommand: ((item: SlashCommandItem) => void) | null = null

						function updateList(
							commandItems: SlashCommandItem[],
							commandHandler: (item: SlashCommandItem) => void,
						) {
							if (!popup) return
							latestItems = commandItems
							latestCommand = commandHandler
							popup.innerHTML = ''
							commandItems.forEach((item, index) => {
								const button = document.createElement('button')
								button.type = 'button'
								button.className = [
									'flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left text-sm',
									index === selectedIndex
										? 'bg-gray-100 text-gray-900'
										: 'text-gray-600 hover:bg-gray-50',
								].join(' ')
								button.innerHTML = `<span class="font-medium">${item.title}</span><span class="text-xs text-gray-500">${item.description}</span>`
								button.onclick = () => commandHandler(item)
								popup?.appendChild(button)
							})
						}

						return {
							onStart: (props) => {
								popup = document.createElement('div')
								popup.className =
									'z-50 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg'
								document.body.appendChild(popup)
								selectedIndex = 0
								updateList(props.items, props.command)
								const rect = props.clientRect?.()
								if (rect && popup) {
									popup.style.position = 'absolute'
									popup.style.left = `${rect.left}px`
									popup.style.top = `${rect.bottom + 8}px`
								}
							},
							onUpdate: (props) => {
								selectedIndex = 0
								updateList(props.items, props.command)
								const rect = props.clientRect?.()
								if (rect && popup) {
									popup.style.left = `${rect.left}px`
									popup.style.top = `${rect.bottom + 8}px`
								}
							},
							// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO reduce complexity
							onKeyDown: (props) => {
								if (!popup) return false
								if (props.event.key === 'ArrowDown') {
									if (!latestItems.length) return false
									selectedIndex = (selectedIndex + 1) % latestItems.length
									updateList(latestItems, latestCommand ?? (() => {}))
									return true
								}
								if (props.event.key === 'ArrowUp') {
									if (!latestItems.length) return false
									selectedIndex = (selectedIndex + latestItems.length - 1) % latestItems.length
									updateList(latestItems, latestCommand ?? (() => {}))
									return true
								}
								if (props.event.key === 'Enter') {
									if (!latestItems.length || !latestCommand) return false
									latestCommand(latestItems[selectedIndex])
									return true
								}
								return false
							},
							onExit: () => {
								popup?.remove()
								popup = null
							},
						}
					},
				}),
			]
		},
	})
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO reduce complexity
export default function CreatePage() {
	const [, createAction] = useActionState(createDocument, { error: '', success: '' })
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const titleInputRef = useRef<HTMLInputElement | null>(null)
	const ignoreNextSheetEnterRef = useRef(false)
	const [table, setTable] = useState<TableModel>(buildDefaultTable())
	const [isDragging, setIsDragging] = useState(false)
	const [refineInput, setRefineInput] = useState('')
	const [refineLog, setRefineLog] = useState<string[]>([])
	const [title, setTitle] = useState('')
	const [hasEnteredEditor, setHasEnteredEditor] = useState(false)
	const [isSheetVisible, setIsSheetVisible] = useState(false)
	const [isSheetSelected, setIsSheetSelected] = useState(false)
	const [isChatOpen, setIsChatOpen] = useState(false)
	const [sitemapInput, setSitemapInput] = useState('')
	const [isSitemapPromptOpen, setIsSitemapPromptOpen] = useState(false)
	const [isSitemapLoading, setIsSitemapLoading] = useState(false)
	const [sitemapError, setSitemapError] = useState('')
	const [isGenerating, setIsGenerating] = useState(false)
	const [generationError, setGenerationError] = useState('')
	const [isGoogleSheetsLoading, setIsGoogleSheetsLoading] = useState(false)

	const updateCell = useCallback((rowIndex: number, columnId: string, value: string) => {
		setTable((current) => {
			const nextRows = [...current.rows]
			const nextRow = { ...nextRows[rowIndex], [columnId]: value }
			nextRows[rowIndex] = nextRow
			return { ...current, rows: nextRows }
		})
	}, [])

	function addRow() {
		setTable((current) => ({
			...current,
			rows: [...current.rows, Object.fromEntries(current.columns.map((column) => [column.id, '']))],
		}))
	}

	function addColumn() {
		setTable((current) => {
			const nextColumnId = `col-${current.columns.length + 1}`
			const nextColumn = {
				id: nextColumnId,
				label: `Column ${current.columns.length + 1}`,
			}
			const nextRows = current.rows.map((row) => ({
				...row,
				[nextColumnId]: '',
			}))
			return { columns: [...current.columns, nextColumn], rows: nextRows }
		})
	}

	const handleCreateSheet = useCallback(() => {
		setTable(buildDefaultTable())
		setIsSheetVisible(true)
		setIsSheetSelected(true)
		ignoreNextSheetEnterRef.current = true
	}, [])

	const handleOpenSitemapPrompt = useCallback(() => {
		setSitemapInput('')
		setSitemapError('')
		setIsSitemapPromptOpen(true)
	}, [])

	async function handleGenerate(prompt: string, sourceUrl?: string) {
		const trimmed = prompt.trim()
		if (!trimmed) return
		setIsGenerating(true)
		setGenerationError('')
		try {
			const enqueueRes = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: trimmed, sourceUrl }),
			})
			const enqueueData = await enqueueRes.json()
			if (!enqueueRes.ok || !enqueueData.jobId) {
				setGenerationError(enqueueData.error ?? 'Failed to start generation')
				return
			}
			const result = await pollForJob(enqueueData.jobId, fetchJobStatus, {
				maxPolls: 60,
				delayMs: 1500,
			})
			if ('error' in result) {
				setGenerationError(result.error)
			} else {
				setTable(result.sheet)
				setIsSheetVisible(true)
				setIsSheetSelected(true)
			}
		} catch {
			setGenerationError('Something went wrong. Please try again.')
		} finally {
			setIsGenerating(false)
		}
	}

	async function handleImportSitemap() {
		const url = sitemapInput.trim()
		if (!url) return
		setIsSitemapLoading(true)
		setSitemapError('')
		try {
			const res = await fetch(`/api/sitemap?url=${encodeURIComponent(url)}`)
			const data = await res.json()
			if (!res.ok || data.error) {
				setSitemapError(data.error ?? 'Failed to import sitemap')
				return
			}
			const urls: string[] = data.urls
			const columns = [
				{ id: 'col-1', label: 'URL' },
				{ id: 'col-2', label: 'Status' },
				{ id: 'col-3', label: 'Notes' },
			]
			const rows = urls.map((u) => ({ 'col-1': u, 'col-2': '', 'col-3': '' }))
			setTable({ columns, rows })
			setIsSheetVisible(true)
			setIsSheetSelected(true)
			setIsSitemapPromptOpen(false)
		} catch {
			setSitemapError('Something went wrong. Please try again.')
		} finally {
			setIsSitemapLoading(false)
		}
	}

	async function handleFile(file: File | null) {
		if (!file) return
		if (file.name.toLowerCase().endsWith('.csv')) {
			const text = await file.text()
			setTable(parseCsvText(text))
			setIsSheetVisible(true)
			setIsSheetSelected(true)
			return
		}
		if (file.name.toLowerCase().endsWith('.xlsx')) {
			setTable(await parseXlsxFile(file))
			setIsSheetVisible(true)
			setIsSheetSelected(true)
		}
	}

	function handleDrop(event: React.DragEvent<HTMLElement>) {
		event.preventDefault()
		setIsDragging(false)
		const file = event.dataTransfer.files?.[0]
		void handleFile(file ?? null)
	}

	function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
		const text = event.clipboardData.getData('text')
		if (!text) return
		setTable(parseCsvText(text))
	}

	function handleExportCsv() {
		const csv = Papa.unparse(
			[
				table.columns.map((column) => column.label),
				...table.rows.map((row) => table.columns.map((column) => row[column.id] ?? '')),
			],
			{ skipEmptyLines: true },
		)
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = 'sheet.csv'
		link.click()
		URL.revokeObjectURL(url)
	}

	function handleExportXlsx() {
		const worksheet = XLSX.utils.aoa_to_sheet([
			table.columns.map((column) => column.label),
			...table.rows.map((row) => table.columns.map((column) => row[column.id] ?? '')),
		])
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
		XLSX.writeFile(workbook, 'sheet.xlsx')
	}

	async function handleOpenInGoogleSheets() {
		setIsGoogleSheetsLoading(true)
		try {
			const res = await fetch('/api/export/google-sheets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, columns: table.columns, rows: table.rows }),
			})
			if (res.ok) window.location.href = '/api/export/google-sheets/init'
		} finally {
			setIsGoogleSheetsLoading(false)
		}
	}

	const slashItems = useMemo<SlashCommandItem[]>(
		() => [
			{
				title: 'Sheet',
				description: 'Create a blank 4x3 sheet',
				action: handleCreateSheet,
			},
			{
				title: 'Import sitemap',
				description: 'Paste a sitemap URL to populate rows',
				action: handleOpenSitemapPrompt,
			},
		],
		[handleCreateSheet, handleOpenSitemapPrompt],
	)

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit,
			Placeholder.configure({
				placeholder: 'Describe the spreadsheet you need or type /sheet',
			}),
			createSlashCommandExtension(slashItems),
		],
		content: '',
		editorProps: {
			attributes: {
				class: 'min-h-[120px] bg-transparent px-0 py-0 text-sm text-gray-600 outline-none',
			},
			handleKeyDown: (_view, event) => {
				if (
					event.key === 'Enter' &&
					!event.shiftKey &&
					editor &&
					!editor.isEmpty &&
					!isSheetVisible
				) {
					event.preventDefault()
					const prompt = editor.getText()
					editor.commands.clearContent()
					void handleGenerate(prompt)
					return true
				}
				if (event.key !== 'Backspace') return false
				if (!editor) return false
				if (isSheetVisible) return false
				if (!editor.isEmpty) return false

				event.preventDefault()
				setHasEnteredEditor(false)
				titleInputRef.current?.focus()
				return true
			},
		},
	})

	useEffect(() => {
		if (!isSheetSelected) return
		editor?.commands.blur()
	}, [editor, isSheetSelected])

	useEffect(() => {
		if (!isSheetSelected) return
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Enter') {
				if (ignoreNextSheetEnterRef.current) {
					ignoreNextSheetEnterRef.current = false
					return
				}
				event.preventDefault()
				setIsSheetSelected(false)
				setHasEnteredEditor(true)
				editor?.chain().focus().run()
			}
			if (event.key === 'Backspace') {
				event.preventDefault()
				setIsSheetVisible(false)
				setIsSheetSelected(false)
				if (editor?.isEmpty) {
					setHasEnteredEditor(false)
					titleInputRef.current?.focus()
					return
				}
				editor?.chain().focus().run()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [editor, isSheetSelected])

	useEffect(() => {
		if (!editor || !isSheetVisible) return
		const currentEditor = editor
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Backspace') return
			if (!currentEditor.isFocused) return
			const selection = currentEditor.state.selection
			const isAtStart = selection.$from.pos <= 2
			if (!isAtStart || !currentEditor.isEmpty) return
			event.preventDefault()
			if (!isSheetSelected) {
				setIsSheetSelected(true)
				return
			}
			setIsSheetVisible(false)
			setIsSheetSelected(false)
		}
		window.addEventListener('keydown', handleKeyDown, true)
		return () => window.removeEventListener('keydown', handleKeyDown, true)
	}, [editor, isSheetSelected, isSheetVisible])

	const columns = useMemo<ColumnDef<TableRow>[]>(
		() =>
			table.columns.map((column) => ({
				accessorKey: column.id,
				header: column.label,
				cell: ({ row }) => (
					<Input
						value={row.original[column.id] ?? ''}
						onChange={(event) => updateCell(row.index, column.id, event.target.value)}
						className="h-9 border-gray-200 text-sm"
					/>
				),
			})),
		[table.columns, updateCell],
	)

	const tableInstance = useReactTable({
		data: table.rows,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<main className="bg-gray-50">
			{isSitemapPromptOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
					<div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
						<h2 className="mb-1 text-sm font-semibold text-gray-900">Import sitemap</h2>
						<p className="mb-4 text-xs text-gray-500">
							Paste a sitemap URL and each &lt;loc&gt; will become a row.
						</p>
						<Input
							placeholder="https://example.com/sitemap.xml"
							value={sitemapInput}
							onChange={(e) => setSitemapInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') void handleImportSitemap()
								if (e.key === 'Escape') setIsSitemapPromptOpen(false)
							}}
							autoFocus
						/>
						{sitemapError ? <p className="mt-2 text-xs text-red-500">{sitemapError}</p> : null}
						<div className="mt-4 flex justify-end gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setIsSitemapPromptOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								size="sm"
								onClick={() => void handleImportSitemap()}
								disabled={isSitemapLoading || !sitemapInput.trim()}
							>
								{isSitemapLoading ? 'Importing...' : 'Import'}
							</Button>
						</div>
					</div>
				</div>
			) : null}
			<section className="py-16">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div
						className={['gap-10', isChatOpen ? 'grid lg:grid-cols-[1.1fr_1fr]' : 'grid'].join(' ')}
					>
						<section
							className={['group relative space-y-6', isChatOpen ? '' : 'lg:col-span-2'].join(' ')}
							aria-label="Spreadsheet builder"
							onDragOver={(event) => {
								event.preventDefault()
								setIsDragging(true)
							}}
							onDragLeave={() => setIsDragging(false)}
							onDrop={handleDrop}
							onPaste={handlePaste}
						>
							{isDragging ? (
								<div className="pointer-events-none absolute -inset-2 z-10 rounded-2xl border border-dashed border-violet-500 bg-violet-50/40">
									<div className="flex h-full items-center justify-center text-sm font-medium text-violet-700">
										Drop CSV/XLSX
									</div>
								</div>
							) : null}
							<div className="group space-y-2">
								<div className="flex items-center justify-between gap-2 opacity-0 transition group-hover:opacity-100">
									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => fileInputRef.current?.click()}
										>
											<Upload className="h-4 w-4" strokeWidth={1} />
											Browse files
										</Button>
										{isSheetVisible ? (
											<>
												<Button type="button" variant="ghost" size="sm" onClick={handleExportXlsx}>
													<FileSpreadsheet className="h-4 w-4" strokeWidth={1} />
													Export .xlsx
												</Button>
												<Button type="button" variant="ghost" size="sm" onClick={handleExportCsv}>
													<Download className="h-4 w-4" strokeWidth={1} />
													Export CSV
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => void handleOpenInGoogleSheets()}
													disabled={isGoogleSheetsLoading}
												>
													<ExternalLink className="h-4 w-4" strokeWidth={1} />
													{isGoogleSheetsLoading ? 'Opening...' : 'Open in Google Sheets'}
												</Button>
												<form action={createAction}>
													<input type="hidden" name="title" value={title} />
													<input type="hidden" name="description" value={title} />
													<input type="hidden" name="owner" value="private" />
													<input type="hidden" name="columns" value={JSON.stringify(table.columns)} />
													<input type="hidden" name="rows" value={JSON.stringify(table.rows)} />
													<Button type="submit" size="sm" variant="ghost">
														<Save className="h-4 w-4" strokeWidth={1} /> Save
													</Button>
												</form>
											</>
										) : null}
									</div>
									{isSheetVisible ? (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => setIsChatOpen((current) => !current)}
											className="text-violet-600 hover:bg-violet-100 hover:text-violet-700"
										>
											<Sparkles className="h-4 w-4" strokeWidth={1} />
											Refine
										</Button>
									) : null}
								</div>
								<div>
									<Input
										placeholder="Spreadsheet title"
										className="h-auto! px-0! text-2xl! font-extrabold leading-tight text-gray-900 placeholder:text-gray-400!"
										variant="ghost"
										ref={titleInputRef}
										value={title}
										onChange={(event) => setTitle(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === 'Enter') {
												event.preventDefault()
												setHasEnteredEditor(true)
												editor?.chain().focus().run()
												return
											}
											if (event.key !== '/') return
											event.preventDefault()
											setHasEnteredEditor(true)
											editor?.chain().focus().insertContent('/').run()
										}}
									/>
									{!hasEnteredEditor && !isSheetVisible ? (
										<div className="mt-3 space-y-3 text-sm text-gray-400">
											<div className="flex items-center gap-2">
												<span className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 text-xs text-gray-400">
													↵
												</span>
												Press Enter to start from scratch
											</div>
											<div className="flex items-center gap-2">
												<span className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 text-xs text-gray-400">
													/
												</span>
												Type / to insert a spreadsheet grid
											</div>
											<p className="text-[15px] text-gray-600">
												Meli is a spreadsheet builder that{' '}
												<span className="rounded bg-violet-100 px-1.5 text-violet-700">
													edits like a doc
												</span>
												. Just type{' '}
												<span className="rounded bg-violet-100 px-1.5 text-violet-700">/</span> to
												insert a spreadsheet grid and refine it in place.
											</p>
										<div className="mt-8">
											<p className="text-sm font-medium text-gray-600 mb-4">Or start from a template</p>
											<TemplateGallery
												onSelectTemplate={(prompt, templateTitle) => {
													setTitle(templateTitle)
													void handleGenerate(prompt)
												}}
											/>
										</div>
										</div>
									) : null}
									{generationError ? (
										<p className="mt-2 text-xs text-red-500">{generationError}</p>
									) : null}
									{isGenerating && !isSheetVisible ? (
										<div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
											<Sparkles className="h-4 w-4 animate-pulse text-violet-400" strokeWidth={1} />
											Generating spreadsheet...
										</div>
									) : null}
									{isSheetVisible ? (
										<div className="mt-4 space-y-4">
											<div className="relative">
												{isGenerating ? (
													<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/80 backdrop-blur-sm">
														<Sparkles
															className="h-5 w-5 animate-pulse text-violet-500"
															strokeWidth={1}
														/>
														<p className="text-xs text-gray-500">Generating spreadsheet...</p>
													</div>
												) : null}
												<div
													className={[
														'overflow-auto rounded-xl border bg-white',
														isSheetSelected ? 'border-violet-400' : 'border-gray-200',
													].join(' ')}
												>
													<table className="min-w-full border-collapse text-left text-sm">
														<thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
															{tableInstance.getHeaderGroups().map((headerGroup) => (
																<tr key={headerGroup.id}>
																	{headerGroup.headers.map((header) => (
																		<th
																			key={header.id}
																			className="border-b px-3 py-2 font-semibold"
																		>
																			{flexRender(
																				header.column.columnDef.header,
																				header.getContext(),
																			)}
																		</th>
																	))}
																</tr>
															))}
														</thead>
														<tbody>
															{tableInstance.getRowModel().rows.map((row) => (
																<tr key={row.id} className="even:bg-gray-50">
																	{row.getVisibleCells().map((cell) => (
																		<td key={cell.id} className="border-b px-2 py-2">
																			{flexRender(cell.column.columnDef.cell, cell.getContext())}
																		</td>
																	))}
																</tr>
															))}
														</tbody>
													</table>
												</div>
												<Button
													type="button"
													size="icon"
													variant="ghost"
													aria-label="Add column"
													className="absolute -right-10 top-1/2 -translate-y-1/2 rounded-full text-violet-600 hover:bg-violet-50"
													onClick={addColumn}
												>
													<Plus className="h-4 w-4" strokeWidth={1} />
												</Button>
												<Button
													type="button"
													size="icon"
													variant="ghost"
													aria-label="Add row"
													className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full text-violet-600 hover:bg-violet-50"
													onClick={addRow}
												>
													<Plus className="h-4 w-4" strokeWidth={1} />
												</Button>
											</div>
											<EditorContent editor={editor} />
										</div>
									) : (
										<EditorContent editor={editor} />
									)}
								</div>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv,.xlsx"
								onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
								className="sr-only"
							/>
						</section>

						{isChatOpen ? (
							<div className="space-y-4">
								<div className="rounded-xl border border-gray-200/0 bg-transparent p-0">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<h2 className="text-sm font-semibold text-gray-900">Refine with AI</h2>
										<p className="text-xs text-gray-500">Describe a change and press Enter.</p>
									</div>
									<div className="mt-4 flex flex-col gap-3">
										<Input
											placeholder="Add a status column, group rows by category..."
											value={refineInput}
											onChange={(event) => setRefineInput(event.target.value)}
											onKeyDown={(event) => {
												if (event.key === 'Enter' && refineInput.trim()) {
													event.preventDefault()
													const currentTable = JSON.stringify(table)
													const prompt = `Given this spreadsheet: ${currentTable}\n\n${refineInput.trim()}`
													setRefineLog((current) =>
														[`You: ${refineInput.trim()}`, ...current].slice(0, 6),
													)
													setRefineInput('')
													void handleGenerate(prompt)
												}
											}}
											variant="ghost"
											className="px-0"
											disabled={isGenerating}
										/>
										{isGenerating ? <p className="text-xs text-violet-500">Generating...</p> : null}
										{refineLog.length ? (
											<ul className="space-y-2 text-xs text-gray-500">
												{refineLog.map((entry) => (
													<li key={entry}>{entry}</li>
												))}
											</ul>
										) : null}
									</div>
								</div>
							</div>
						) : null}
					</div>
				</div>
			</section>
		</main>
	)
}
