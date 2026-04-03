'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ExportToolbar } from '@/app/(dashboard)/_components/export-toolbar'
import { RefinePanel } from '@/app/(dashboard)/_components/refine-panel'
import { SpreadsheetView } from '@/app/(dashboard)/_components/spreadsheet-view'
import { updateDocument } from '@/app/(dashboard)/actions'
import { type ColumnType, inferColumnType } from '@/lib/infer-column-type'
import {
	addColumnToTable,
	addRowToTable,
	changeColumnType,
	deleteColumnFromTable,
	deleteRowFromTable,
	renameColumnInTable,
	type TableModel,
} from '@/lib/table-mutations'
import {
	applyOperation,
	buildUndoStack,
	canRedo,
	canUndo,
	pushOperation,
	redoOperation,
	undoOperation,
	type TableOperation,
	type UndoStack,
} from '@/lib/undo-stack'
import { applyRowUpdate } from './editable-spreadsheet.helpers'

interface EditableSpreadsheetProps {
	documentId: string
	documentTitle: string
	initialColumns: TableModel['columns']
	initialRows: TableModel['rows']
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function EditableSpreadsheet({
	documentId,
	documentTitle,
	initialColumns,
	initialRows,
}: EditableSpreadsheetProps) {
	const [table, setTable] = useState<TableModel>({ columns: initialColumns, rows: initialRows })
	const [undoStack, setUndoStack] = useState<UndoStack>(buildUndoStack())
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const persist = useCallback(
		(nextTable: TableModel, debounced = true) => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
			setSaveStatus('saving')

			const save = async () => {
				const formData = new FormData()
				formData.append('documentId', documentId)
				formData.append('columns', JSON.stringify(nextTable.columns))
				formData.append('rows', JSON.stringify(nextTable.rows))
				const result = await updateDocument({ error: '', success: '' }, formData)
				setSaveStatus(result?.error ? 'error' : 'saved')
				setTimeout(() => setSaveStatus('idle'), 2000)
			}

			if (debounced) {
				debounceTimerRef.current = setTimeout(() => void save(), 800)
			} else {
				void save()
			}
		},
		[documentId],
	)

	const applyMutation = useCallback(
		(mutate: (current: TableModel) => TableModel, debounced = true) => {
			setTable((current) => {
				const next = mutate(current)
				persist(next, debounced)
				return next
			})
		},
		[persist],
	)

	const applyTrackedCellChange = useCallback(
		(rowIndex: number, columnId: string, value: string) => {
			setTable((currentTable) => {
				const previousValue = currentTable.rows[rowIndex]?.[columnId] ?? ''
				const operation: TableOperation = {
					type: 'set_cell',
					rowIndex,
					columnId,
					previousValue,
					nextValue: value,
				}
				setUndoStack((currentStack) => pushOperation(currentStack, operation))
				const next = { ...currentTable, rows: applyRowUpdate(currentTable.rows, rowIndex, columnId, value) }
				persist(next)
				return next
			})
		},
		[persist],
	)

	const handleUndo = useCallback(() => {
		if (!canUndo(undoStack)) return
		const { stack: nextStack, inverseOperation } = undoOperation(undoStack)
		setUndoStack(nextStack)
		setTable((currentTable) => {
			const next = applyOperation(currentTable, inverseOperation)
			persist(next, false)
			return next
		})
	}, [undoStack, persist])

	const handleRedo = useCallback(() => {
		if (!canRedo(undoStack)) return
		const { stack: nextStack, replayOperation } = redoOperation(undoStack)
		setUndoStack(nextStack)
		setTable((currentTable) => {
			const next = applyOperation(currentTable, replayOperation)
			persist(next, false)
			return next
		})
	}, [undoStack, persist])

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			const isMac = navigator.platform.toUpperCase().includes('MAC')
			const modifierKeyPressed = isMac ? event.metaKey : event.ctrlKey

			if (!modifierKeyPressed) return
			if (event.key === 'z' && !event.shiftKey) {
				event.preventDefault()
				handleUndo()
			}
			if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
				event.preventDefault()
				handleRedo()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [handleUndo, handleRedo])

	const handleAddRow = useCallback(() => {
		applyMutation(addRowToTable)
	}, [applyMutation])

	const handleAddColumn = useCallback(() => {
		applyMutation((current) => addColumnToTable(current, 'New Column'))
	}, [applyMutation])

	const handleDeleteRow = useCallback(
		(rowIndex: number) => {
			applyMutation((current) => deleteRowFromTable(current, rowIndex), false)
		},
		[applyMutation],
	)

	const handleDeleteColumn = useCallback(
		(columnId: string) => {
			applyMutation((current) => deleteColumnFromTable(current, columnId), false)
		},
		[applyMutation],
	)

	const handleRenameColumn = useCallback(
		(columnId: string, newLabel: string) => {
			applyMutation((current) => renameColumnInTable(current, columnId, newLabel))
		},
		[applyMutation],
	)

	const handleChangeColumnType = useCallback(
		(columnId: string, newType: ColumnType) => {
			applyMutation((current) => changeColumnType(current, columnId, newType), false)
		},
		[applyMutation],
	)

	const handleRefined = useCallback(
		(newTable: TableModel) => {
			const operation: TableOperation = {
				type: 'replace_table',
				previousTable: table,
				nextTable: newTable,
			}
			setUndoStack((current) => pushOperation(current, operation))

			const tableWithInferredTypes: TableModel = {
				...newTable,
				columns: newTable.columns.map((column) => ({
					...column,
					type: column.type ?? inferColumnType(newTable.rows.map((row) => row[column.id] ?? '')),
				})),
			}
			setTable(tableWithInferredTypes)
			persist(tableWithInferredTypes, false)
		},
		[table, persist],
	)

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<ExportToolbar
					columns={table.columns}
					rows={table.rows}
					filename={documentTitle}
					documentId={documentId}
				/>
				<div className="flex items-center gap-2 text-xs text-gray-400">
					<button
						type="button"
						onClick={handleUndo}
						disabled={!canUndo(undoStack)}
						className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-30"
						aria-label="Undo"
					>
						↩ Undo
					</button>
					<button
						type="button"
						onClick={handleRedo}
						disabled={!canRedo(undoStack)}
						className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-30"
						aria-label="Redo"
					>
						↪ Redo
					</button>
				</div>
			</div>
			<div className="space-y-2">
				<SpreadsheetView
					columns={table.columns}
					rows={table.rows}
					editable
					onCellChange={applyTrackedCellChange}
					onAddRow={handleAddRow}
					onAddColumn={handleAddColumn}
					onDeleteRow={handleDeleteRow}
					onDeleteColumn={handleDeleteColumn}
					onRenameColumn={handleRenameColumn}
					onChangeColumnType={handleChangeColumnType}
				/>
				{saveStatus !== 'idle' && (
					<p className="text-xs text-gray-400">
						{saveStatus === 'saving' && 'Saving…'}
						{saveStatus === 'saved' && 'Saved'}
						{saveStatus === 'error' && 'Failed to save'}
					</p>
				)}
			</div>
			<RefinePanel table={table} onRefined={handleRefined} />
		</div>
	)
}
