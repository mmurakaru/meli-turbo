'use client'

import { Button } from '@workspace/ui/components/button'
import { Download, ExternalLink, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { type Column, downloadCsv, downloadXlsx, type Row } from '@/lib/export-table'

interface ExportToolbarProps {
	columns: Column[]
	rows: Row[]
	filename: string
	documentId: string
}

export function ExportToolbar({ columns, rows, filename, documentId }: ExportToolbarProps) {
	const [isGoogleSheetsLoading, setIsGoogleSheetsLoading] = useState(false)

	async function handleExportToGoogleSheets() {
		setIsGoogleSheetsLoading(true)
		try {
			const response = await fetch('/api/export/google-sheets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: filename, documentId }),
			})
			if (response.ok) {
				window.location.href = '/api/export/google-sheets/init'
			}
		} finally {
			setIsGoogleSheetsLoading(false)
		}
	}

	return (
		<div className="flex items-center gap-1">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => downloadCsv(columns, rows, filename)}
			>
				<Download className="h-4 w-4" strokeWidth={1} />
				Export CSV
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => downloadXlsx(columns, rows, filename)}
			>
				<FileSpreadsheet className="h-4 w-4" strokeWidth={1} />
				Export .xlsx
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => void handleExportToGoogleSheets()}
				disabled={isGoogleSheetsLoading}
			>
				<ExternalLink className="h-4 w-4" strokeWidth={1} />
				{isGoogleSheetsLoading ? 'Opening…' : 'Open in Google Sheets'}
			</Button>
		</div>
	)
}
