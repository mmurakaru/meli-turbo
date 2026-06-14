import { applyRowUpdate } from '@/app/(dashboard)/(document)/document/[id]/editable-spreadsheet.helpers'
import type { TableModel } from './table-mutations'

const MAXIMUM_UNDO_HISTORY_SIZE = 100

export type SetCellOperation = {
	type: 'set_cell'
	rowIndex: number
	columnId: string
	previousValue: string
	nextValue: string
}

export type ReplaceTableOperation = {
	type: 'replace_table'
	previousTable: TableModel
	nextTable: TableModel
}

export type TableOperation = SetCellOperation | ReplaceTableOperation

export type UndoStack = {
	readonly undoHistory: readonly TableOperation[]
	readonly redoHistory: readonly TableOperation[]
}

export function buildUndoStack(): UndoStack {
	return { undoHistory: [], redoHistory: [] }
}

export function canUndo(stack: UndoStack): boolean {
	return stack.undoHistory.length > 0
}

export function canRedo(stack: UndoStack): boolean {
	return stack.redoHistory.length > 0
}

export function pushOperation(stack: UndoStack, operation: TableOperation): UndoStack {
	return {
		undoHistory: [operation, ...stack.undoHistory].slice(0, MAXIMUM_UNDO_HISTORY_SIZE),
		redoHistory: [],
	}
}

function invertOperation(operation: TableOperation): TableOperation {
	switch (operation.type) {
		case 'set_cell':
			return {
				type: 'set_cell',
				rowIndex: operation.rowIndex,
				columnId: operation.columnId,
				previousValue: operation.nextValue,
				nextValue: operation.previousValue,
			}
		case 'replace_table':
			return {
				type: 'replace_table',
				previousTable: operation.nextTable,
				nextTable: operation.previousTable,
			}
	}
}

export function undoOperation(stack: UndoStack): {
	stack: UndoStack
	inverseOperation: TableOperation
} {
	const [mostRecentOperation, ...remainingHistory] = stack.undoHistory
	const inverseOperation = invertOperation(mostRecentOperation)
	return {
		stack: {
			undoHistory: remainingHistory,
			redoHistory: [mostRecentOperation, ...stack.redoHistory],
		},
		inverseOperation,
	}
}

export function redoOperation(stack: UndoStack): {
	stack: UndoStack
	replayOperation: TableOperation
} {
	const [mostRecentOperation, ...remainingRedoHistory] = stack.redoHistory
	return {
		stack: {
			undoHistory: [mostRecentOperation, ...stack.undoHistory].slice(0, MAXIMUM_UNDO_HISTORY_SIZE),
			redoHistory: remainingRedoHistory,
		},
		replayOperation: mostRecentOperation,
	}
}

export function applyOperation(table: TableModel, operation: TableOperation): TableModel {
	switch (operation.type) {
		case 'set_cell':
			return {
				...table,
				rows: applyRowUpdate(
					table.rows,
					operation.rowIndex,
					operation.columnId,
					operation.nextValue,
				),
			}
		case 'replace_table':
			return operation.nextTable
	}
}
