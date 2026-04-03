'use client'

import { useCallback, useRef, useState } from 'react'
import { SpreadsheetView } from '@/app/(dashboard)/_components/spreadsheet-view'
import { updateDocument } from '@/app/(dashboard)/actions'
import { applyRowUpdate } from './editable-spreadsheet.helpers'

type Column = { id: string; label: string }
type Row = Record<string, string>

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
  const [columns] = useState(initialColumns)
  const [rows, setRows] = useState(initialRows)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persistRows = useCallback(
    (nextRows: Row[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSaveStatus('saving')
      debounceRef.current = setTimeout(async () => {
        const formData = new FormData()
        formData.append('documentId', documentId)
        formData.append('columns', JSON.stringify(columns))
        formData.append('rows', JSON.stringify(nextRows))
        const result = await updateDocument({ error: '', success: '' }, formData)
        setSaveStatus(result?.error ? 'error' : 'saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 800)
    },
    [documentId, columns],
  )

  const handleCellChange = useCallback(
    (rowIndex: number, columnId: string, value: string) => {
      setRows((current) => {
        const next = applyRowUpdate(current, rowIndex, columnId, value)
        persistRows(next)
        return next
      })
    },
    [persistRows],
  )

  return (
    <div className="space-y-2">
      <SpreadsheetView
        columns={columns}
        rows={rows}
        editable
        onCellChange={handleCellChange}
      />
      {saveStatus !== 'idle' && (
        <p className="text-xs text-gray-400">
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Failed to save'}
        </p>
      )}
    </div>
  )
}
