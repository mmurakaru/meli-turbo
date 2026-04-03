'use client'

import { useCallback, useRef, useState } from 'react'
import { SpreadsheetView } from '@/app/(dashboard)/_components/spreadsheet-view'
import { RefinePanel } from '@/app/(dashboard)/_components/refine-panel'
import { updateDocument } from '@/app/(dashboard)/actions'
import { applyRowUpdate } from './editable-spreadsheet.helpers'

type Column = { id: string; label: string }
type Row = Record<string, string>
type Sheet = { columns: Column[]; rows: Row[] }

interface EditableSpreadsheetProps {
	documentId: string
	initialColumns: Column[]
	initialRows: Row[]
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function EditableSpreadsheet({
	documentId,
	initialColumns,
	initialRows,
}: EditableSpreadsheetProps) {
	const [table, setTable] = useState<Sheet>({ columns: initialColumns, rows: initialRows })
	const { columns, rows } = table
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const persist = useCallback(
		(nextTable: Sheet, debounced = true) => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
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
				debounceRef.current = setTimeout(() => void save(), 800)
			} else {
				void save()
			}
		},
		[documentId],
	)

	const handleCellChange = useCallback(
		(rowIndex: number, columnId: string, value: string) => {
			setTable((current) => {
				const next = { ...current, rows: applyRowUpdate(current.rows, rowIndex, columnId, value) }
				persist(next)
				return next
			})
		},
		[persist],
	)

	const handleRefined = useCallback(
		(newTable: Sheet) => {
			setTable(newTable)
			persist(newTable, false)
		},
		[persist],
	)

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<SpreadsheetView columns={columns} rows={rows} editable onCellChange={handleCellChange} />
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
