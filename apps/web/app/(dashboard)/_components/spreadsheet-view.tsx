'use client'

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { type ColumnType } from '@/lib/infer-column-type'

export type Column = { id: string; label: string; type?: ColumnType }
type Row = Record<string, string>

const COLUMN_TYPE_OPTIONS: ColumnType[] = ['text', 'number', 'date', 'boolean', 'url', 'select']

interface SpreadsheetViewProps {
	columns: Column[]
	rows: Row[]
	editable?: boolean
	onCellChange?: (rowIndex: number, columnId: string, value: string) => void
	onAddRow?: () => void
	onAddColumn?: () => void
	onDeleteRow?: (rowIndex: number) => void
	onDeleteColumn?: (columnId: string) => void
	onRenameColumn?: (columnId: string, newLabel: string) => void
	onChangeColumnType?: (columnId: string, newType: ColumnType) => void
}

function EditableColumnHeader({
	column,
	onRename,
	onDelete,
	onChangeType,
}: {
	column: Column
	onRename: (newLabel: string) => void
	onDelete: () => void
	onChangeType: (newType: ColumnType) => void
}) {
	const [isEditing, setIsEditing] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	function handleActivateEditing() {
		setIsEditing(true)
	}

	function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
		const newLabel = event.target.value.trim()
		if (newLabel && newLabel !== column.label) {
			onRename(newLabel)
		}
		setIsEditing(false)
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Enter') event.currentTarget.blur()
		if (event.key === 'Escape') setIsEditing(false)
	}

	return (
		<div className="group/header space-y-1">
			<div className="flex items-center justify-between gap-1">
				{isEditing ? (
					<input
						ref={(element) => {
							if (element) {
								inputRef.current = element
								element.focus()
								element.select()
							}
						}}
						defaultValue={column.label}
						onBlur={handleBlur}
						onKeyDown={handleKeyDown}
						className="w-full bg-transparent text-xs font-semibold uppercase tracking-wide focus:outline-none"
					/>
				) : (
					<button
						type="button"
						onDoubleClick={handleActivateEditing}
						onKeyDown={(event) => event.key === 'Enter' && handleActivateEditing()}
						className="cursor-text text-left"
					>
						{column.label}
					</button>
				)}
				<button
					type="button"
					onClick={onDelete}
					className="invisible shrink-0 text-gray-400 hover:text-red-500 group-hover/header:visible"
					aria-label={`Delete column ${column.label}`}
				>
					<Trash2 className="h-3 w-3" />
				</button>
			</div>
			<select
				value={column.type ?? 'text'}
				onChange={(event) => onChangeType(event.target.value as ColumnType)}
				className="w-full cursor-pointer bg-transparent text-[10px] text-gray-400 focus:outline-none"
				aria-label={`Column type for ${column.label}`}
			>
				{COLUMN_TYPE_OPTIONS.map((columnType) => (
					<option key={columnType} value={columnType}>
						{columnType}
					</option>
				))}
			</select>
		</div>
	)
}

function TypeAwareCell({
	value,
	columnType,
	editable,
	onBlur,
}: {
	value: string
	columnType: ColumnType
	editable: boolean
	onBlur: (newValue: string) => void
}) {
	if (!editable) {
		if (columnType === 'boolean') {
			return (
				<input
					type="checkbox"
					checked={value === 'true'}
					readOnly
					className="cursor-default"
					aria-label="Boolean value"
				/>
			)
		}
		if (columnType === 'url') {
			return (
				<a
					href={value}
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-500 underline"
				>
					{value}
				</a>
			)
		}
		return <span className={columnType === 'number' ? 'block text-right tabular-nums' : ''}>{value}</span>
	}

	if (columnType === 'boolean') {
		return (
			<input
				type="checkbox"
				checked={value === 'true'}
				onChange={(event) => onBlur(String(event.target.checked))}
				aria-label="Boolean value"
			/>
		)
	}

	const inputType = columnType === 'date' ? 'date' : columnType === 'number' ? 'number' : 'text'

	return (
		<input
			type={inputType}
			defaultValue={value}
			onBlur={(event) => onBlur(event.target.value)}
			className={[
				'w-full bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-violet-300 rounded px-1 -mx-1',
				columnType === 'number' ? 'text-right tabular-nums' : '',
			].join(' ')}
		/>
	)
}

export function SpreadsheetView({
	columns,
	rows,
	editable,
	onCellChange,
	onAddRow,
	onAddColumn,
	onDeleteRow,
	onDeleteColumn,
	onRenameColumn,
	onChangeColumnType,
}: SpreadsheetViewProps) {
	const columnDefinitions = useMemo<ColumnDef<Row>[]>(
		() =>
			columns.map((column) => ({
				accessorKey: column.id,
				header: () =>
					editable && onRenameColumn && onDeleteColumn && onChangeColumnType ? (
						<EditableColumnHeader
							column={column}
							onRename={(newLabel) => onRenameColumn(column.id, newLabel)}
							onDelete={() => onDeleteColumn(column.id)}
							onChangeType={(newType) => onChangeColumnType(column.id, newType)}
						/>
					) : (
						column.label
					),
				cell: ({ getValue, row }) => (
					<TypeAwareCell
						value={(getValue() as string) ?? ''}
						columnType={column.type ?? 'text'}
						editable={!!editable}
						onBlur={(newValue) => onCellChange?.(row.index, column.id, newValue)}
					/>
				),
			})),
		[columns, editable, onCellChange, onRenameColumn, onDeleteColumn, onChangeColumnType],
	)

	const tableInstance = useReactTable({
		data: rows,
		columns: columnDefinitions,
		getCoreRowModel: getCoreRowModel(),
	})

	if (columns.length === 0) {
		return (
			<div className="flex items-center justify-center h-64 text-sm text-gray-400">
				No spreadsheet data yet.
			</div>
		)
	}

	return (
		<div className="space-y-2">
			<div className="overflow-auto rounded-xl border border-gray-200 bg-white">
				<table className="min-w-full border-collapse text-left text-sm">
					<thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
						{tableInstance.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className="border-b px-3 py-2 font-semibold">
										{flexRender(header.column.columnDef.header, header.getContext())}
									</th>
								))}
								{editable && onAddColumn && (
									<th className="border-b px-2 py-2">
										<button
											type="button"
											onClick={onAddColumn}
											aria-label="Add column"
											className="text-gray-400 hover:text-violet-600"
										>
											<Plus className="h-4 w-4" />
										</button>
									</th>
								)}
							</tr>
						))}
					</thead>
					<tbody>
						{tableInstance.getRowModel().rows.map((row) => (
							<tr key={row.id} className="group even:bg-gray-50">
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="border-b px-3 py-2">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
								{editable && onDeleteRow && (
									<td className="border-b px-2 py-2">
										<button
											type="button"
											onClick={() => onDeleteRow(row.index)}
											aria-label={`Delete row ${row.index + 1}`}
											className="invisible text-gray-400 hover:text-red-500 group-hover:visible"
										>
											<Trash2 className="h-3 w-3" />
										</button>
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{editable && onAddRow && (
				<button
					type="button"
					onClick={onAddRow}
					className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600"
				>
					<Plus className="h-3 w-3" />
					Add row
				</button>
			)}
		</div>
	)
}
