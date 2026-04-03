import { describe, expect, it } from 'vitest'
import {
	addColumnToTable,
	addRowToTable,
	deleteColumnFromTable,
	deleteRowFromTable,
	renameColumnInTable,
} from './table-mutations'

type Column = { id: string; label: string }
type Row = Record<string, string>
type TableModel = { columns: Column[]; rows: Row[] }

const baseTable: TableModel = {
	columns: [
		{ id: 'col-1', label: 'Name' },
		{ id: 'col-2', label: 'Email' },
	],
	rows: [
		{ 'col-1': 'Alice', 'col-2': 'alice@example.com' },
		{ 'col-1': 'Bob', 'col-2': 'bob@example.com' },
	],
}

describe('addRowToTable', () => {
	it('appends a new empty row to the table', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = addRowToTable(table)

		// Assert
		expect(result.rows).toHaveLength(3)
	})

	it('the new row contains an empty string for every existing column', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = addRowToTable(table)

		// Assert
		expect(result.rows[2]).toEqual({ 'col-1': '', 'col-2': '' })
	})

	it('does not mutate the original table', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		addRowToTable(table)

		// Assert
		expect(table.rows).toHaveLength(2)
	})

	it('returns a new table reference', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = addRowToTable(table)

		// Assert
		expect(result).not.toBe(table)
	})

	it('preserves existing columns unchanged', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = addRowToTable(table)

		// Assert
		expect(result.columns).toEqual(baseTable.columns)
	})
})

describe('addColumnToTable', () => {
	it('appends a new column with the given label', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = addColumnToTable(table, 'Status')

		// Assert
		expect(result.columns).toHaveLength(3)
		expect(result.columns[2].label).toBe('Status')
	})

	it('the new column has a unique id', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = addColumnToTable(table, 'Status')

		// Assert
		const newColumnId = result.columns[2].id
		expect(newColumnId).toBeTruthy()
		expect(result.columns.slice(0, 2).map((column) => column.id)).not.toContain(newColumnId)
	})

	it('adds an empty string for the new column in every existing row', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = addColumnToTable(table, 'Status')

		// Assert
		const newColumnId = result.columns[2].id
		expect(result.rows[0][newColumnId]).toBe('')
		expect(result.rows[1][newColumnId]).toBe('')
	})

	it('does not mutate the original table', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		addColumnToTable(table, 'Status')

		// Assert
		expect(table.columns).toHaveLength(2)
	})

	it('preserves existing row values', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = addColumnToTable(table, 'Status')

		// Assert
		expect(result.rows[0]['col-1']).toBe('Alice')
		expect(result.rows[1]['col-2']).toBe('bob@example.com')
	})
})

describe('deleteRowFromTable', () => {
	it('removes the row at the given index', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = deleteRowFromTable(table, 0)

		// Assert
		expect(result.rows).toHaveLength(1)
		expect(result.rows[0]['col-1']).toBe('Bob')
	})

	it('removes the last row when given the last index', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = deleteRowFromTable(table, 1)

		// Assert
		expect(result.rows).toHaveLength(1)
		expect(result.rows[0]['col-1']).toBe('Alice')
	})

	it('does not mutate the original table', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		deleteRowFromTable(table, 0)

		// Assert
		expect(table.rows).toHaveLength(2)
	})

	it('preserves existing columns unchanged', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = deleteRowFromTable(table, 0)

		// Assert
		expect(result.columns).toEqual(baseTable.columns)
	})
})

describe('deleteColumnFromTable', () => {
	it('removes the column with the given id', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = deleteColumnFromTable(table, 'col-1')

		// Assert
		expect(result.columns).toHaveLength(1)
		expect(result.columns[0].id).toBe('col-2')
	})

	it('removes the column values from every row', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = deleteColumnFromTable(table, 'col-1')

		// Assert
		expect(result.rows[0]).not.toHaveProperty('col-1')
		expect(result.rows[1]).not.toHaveProperty('col-1')
	})

	it('preserves other column values in every row', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = deleteColumnFromTable(table, 'col-1')

		// Assert
		expect(result.rows[0]['col-2']).toBe('alice@example.com')
		expect(result.rows[1]['col-2']).toBe('bob@example.com')
	})

	it('does not mutate the original table', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		deleteColumnFromTable(table, 'col-1')

		// Assert
		expect(table.columns).toHaveLength(2)
		expect(table.rows[0]).toHaveProperty('col-1')
	})
})

describe('renameColumnInTable', () => {
	it('updates the label of the specified column', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = renameColumnInTable(table, 'col-1', 'Full Name')

		// Assert
		expect(result.columns[0].label).toBe('Full Name')
	})

	it('does not change any other column labels', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = renameColumnInTable(table, 'col-1', 'Full Name')

		// Assert
		expect(result.columns[1].label).toBe('Email')
	})

	it('does not mutate the original table', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		renameColumnInTable(table, 'col-1', 'Full Name')

		// Assert
		expect(table.columns[0].label).toBe('Name')
	})

	it('preserves the column id when renaming', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = renameColumnInTable(table, 'col-1', 'Full Name')

		// Assert
		expect(result.columns[0].id).toBe('col-1')
	})

	it('leaves row data unchanged', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = renameColumnInTable(table, 'col-1', 'Full Name')

		// Assert
		expect(result.rows).toEqual(baseTable.rows)
	})
})
