import * as XLSX from 'xlsx'

export type Column = { id: string; label: string }
export type Row = Record<string, string>

function escapeCsvValue(value: string): string {
	return `"${value.replace(/"/g, '""')}"`
}

export function buildCsvContent(columns: Column[], rows: Row[]): string {
	const headerRow = columns.map((column) => escapeCsvValue(column.label)).join(',')
	const dataRows = rows.map((row) =>
		columns.map((column) => escapeCsvValue(row[column.id] ?? '')).join(','),
	)
	return [headerRow, ...dataRows].join('\n')
}

export function downloadCsv(columns: Column[], rows: Row[], filename: string): void {
	const content = buildCsvContent(columns, rows)
	const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const anchor = document.createElement('a')
	anchor.href = url
	anchor.download = `${filename}.csv`
	anchor.click()
	URL.revokeObjectURL(url)
}

export function downloadXlsx(columns: Column[], rows: Row[], filename: string): void {
	const matrix = [
		columns.map((column) => column.label),
		...rows.map((row) => columns.map((column) => row[column.id] ?? '')),
	]
	const worksheet = XLSX.utils.aoa_to_sheet(matrix)
	const workbook = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
	XLSX.writeFile(workbook, `${filename}.xlsx`)
}
