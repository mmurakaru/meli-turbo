import { v7 as uuidv7 } from 'uuid'
import { type ColumnType } from './infer-column-type'

export type Column = { id: string; label: string; type?: ColumnType }
export type Row = Record<string, string>
export type TableModel = { columns: Column[]; rows: Row[] }

export function addRowToTable(table: TableModel): TableModel {
	const emptyRow = Object.fromEntries(table.columns.map((column) => [column.id, '']))
	return {
		columns: table.columns,
		rows: [...table.rows, emptyRow],
	}
}

export function addColumnToTable(
	table: TableModel,
	label: string,
	type: ColumnType = 'text',
): TableModel {
	const newColumnId = uuidv7()
	const newColumn: Column = { id: newColumnId, label, type }
	return {
		columns: [...table.columns, newColumn],
		rows: table.rows.map((row) => ({ ...row, [newColumnId]: '' })),
	}
}

export function changeColumnType(
	table: TableModel,
	columnId: string,
	newType: ColumnType,
): TableModel {
	return {
		columns: table.columns.map((column) =>
			column.id === columnId ? { ...column, type: newType } : column,
		),
		rows: table.rows,
	}
}

export function deleteRowFromTable(table: TableModel, rowIndex: number): TableModel {
	return {
		columns: table.columns,
		rows: table.rows.filter((_, index) => index !== rowIndex),
	}
}

export function deleteColumnFromTable(table: TableModel, columnId: string): TableModel {
	return {
		columns: table.columns.filter((column) => column.id !== columnId),
		rows: table.rows.map((row) => {
			const { [columnId]: _removed, ...remainingFields } = row
			return remainingFields
		}),
	}
}

export function renameColumnInTable(
	table: TableModel,
	columnId: string,
	newLabel: string,
): TableModel {
	return {
		columns: table.columns.map((column) =>
			column.id === columnId ? { ...column, label: newLabel } : column,
		),
		rows: table.rows,
	}
}
