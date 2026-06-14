import { describe, expect, it } from 'vitest'
import { buildCsvContent } from './export-table'

type Column = { id: string; label: string }
type Row = Record<string, string>

const columns: Column[] = [
	{ id: 'col-1', label: 'Name' },
	{ id: 'col-2', label: 'Email' },
	{ id: 'col-3', label: 'Role' },
]

const rows: Row[] = [
	{ 'col-1': 'Alice', 'col-2': 'alice@example.com', 'col-3': 'Engineer' },
	{ 'col-1': 'Bob', 'col-2': 'bob@example.com', 'col-3': 'Designer' },
]

describe('buildCsvContent', () => {
	it('produces a header row from column labels', () => {
		// Arrange + Act
		const result = buildCsvContent(columns, rows)
		const headerRow = result.split('\n')[0]

		// Assert
		expect(headerRow).toBe('"Name","Email","Role"')
	})

	it('produces one data row per input row', () => {
		// Arrange + Act
		const result = buildCsvContent(columns, rows)
		const dataRows = result.split('\n').slice(1)

		// Assert
		expect(dataRows).toHaveLength(2)
	})

	it('places column values in the order defined by columns', () => {
		// Arrange + Act
		const result = buildCsvContent(columns, rows)
		const firstDataRow = result.split('\n')[1]

		// Assert
		expect(firstDataRow).toBe('"Alice","alice@example.com","Engineer"')
	})

	it('wraps every value in double quotes', () => {
		// Arrange
		const simpleColumns: Column[] = [{ id: 'col-1', label: 'Name' }]
		const simpleRows: Row[] = [{ 'col-1': 'Alice' }]

		// Act
		const result = buildCsvContent(simpleColumns, simpleRows)
		const dataRow = result.split('\n')[1]

		// Assert
		expect(dataRow).toBe('"Alice"')
	})

	it('escapes double quotes inside values by doubling them', () => {
		// Arrange
		const simpleColumns: Column[] = [{ id: 'col-1', label: 'Note' }]
		const simpleRows: Row[] = [{ 'col-1': 'He said "hello"' }]

		// Act
		const result = buildCsvContent(simpleColumns, simpleRows)
		const dataRow = result.split('\n')[1]

		// Assert
		expect(dataRow).toBe('"He said ""hello"""')
	})

	it('outputs an empty string for missing column values', () => {
		// Arrange
		const simpleColumns: Column[] = [
			{ id: 'col-1', label: 'Name' },
			{ id: 'col-2', label: 'Email' },
		]
		const rowWithMissingValue: Row[] = [{ 'col-1': 'Alice' }]

		// Act
		const result = buildCsvContent(simpleColumns, rowWithMissingValue)
		const dataRow = result.split('\n')[1]

		// Assert
		expect(dataRow).toBe('"Alice",""')
	})

	it('returns only a header row when given no data rows', () => {
		// Arrange + Act
		const result = buildCsvContent(columns, [])
		const lines = result.split('\n')

		// Assert
		expect(lines).toHaveLength(1)
		expect(lines[0]).toBe('"Name","Email","Role"')
	})

	it('handles commas inside values without breaking the format', () => {
		// Arrange
		const simpleColumns: Column[] = [{ id: 'col-1', label: 'Address' }]
		const simpleRows: Row[] = [{ 'col-1': '123 Main St, Springfield' }]

		// Act
		const result = buildCsvContent(simpleColumns, simpleRows)
		const dataRow = result.split('\n')[1]

		// Assert
		expect(dataRow).toBe('"123 Main St, Springfield"')
	})

	it('uses newline as the row separator', () => {
		// Arrange + Act
		const result = buildCsvContent(columns, rows)

		// Assert
		expect(result).toContain('\n')
		expect(result.split('\n')).toHaveLength(3)
	})
})
