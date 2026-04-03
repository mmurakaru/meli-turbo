'use client'

import { useCallback, useRef, useState } from 'react'
import { ExportToolbar } from '@/app/(dashboard)/_components/export-toolbar'
import { RefinePanel } from '@/app/(dashboard)/_components/refine-panel'
import { SpreadsheetView } from '@/app/(dashboard)/_components/spreadsheet-view'
import { updateDocument } from '@/app/(dashboard)/actions'
import {
	addColumnToTable,
	addRowToTable,
	deleteColumnFromTable,
	deleteRowFromTable,
	renameColumnInTable,
	type TableModel,
} from '@/lib/table-mutations'
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

	const handleCellChange = useCallback(
		(rowIndex: number, columnId: string, value: string) => {
			applyMutation((current) => ({
				...current,
				rows: applyRowUpdate(current.rows, rowIndex, columnId, value),
			}))
		},
		[applyMutation],
	)

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

	const handleRefined = useCallback(
		(newTable: TableModel) => {
			setTable(newTable)
			persist(newTable, false)
		},
		[persist],
	)

	return (
		<div className="space-y-6">
			<ExportToolbar
				columns={table.columns}
				rows={table.rows}
				filename={documentTitle}
				documentId={documentId}
			/>
			<div className="space-y-2">
				<SpreadsheetView
					columns={table.columns}
					rows={table.rows}
					editable
					onCellChange={handleCellChange}
					onAddRow={handleAddRow}
					onAddColumn={handleAddColumn}
					onDeleteRow={handleDeleteRow}
					onDeleteColumn={handleDeleteColumn}
					onRenameColumn={handleRenameColumn}
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
