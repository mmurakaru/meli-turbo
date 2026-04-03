import { describe, expect, it } from 'vitest'
import {
	applyOperation,
	buildUndoStack,
	canRedo,
	canUndo,
	pushOperation,
	redoOperation,
	undoOperation,
} from './undo-stack'
import type { TableOperation } from './undo-stack'
import type { TableModel } from './table-mutations'

const baseTable: TableModel = {
	columns: [
		{ id: 'col-1', label: 'Name', type: 'text' },
		{ id: 'col-2', label: 'Email', type: 'text' },
	],
	rows: [
		{ 'col-1': 'Alice', 'col-2': 'alice@example.com' },
		{ 'col-1': 'Bob', 'col-2': 'bob@example.com' },
	],
}

const setCellOperation: TableOperation = {
	type: 'set_cell',
	rowIndex: 0,
	columnId: 'col-1',
	previousValue: 'Alice',
	nextValue: 'Alicia',
}

describe('buildUndoStack', () => {
	it('creates an empty undo stack', () => {
		// Act
		const stack = buildUndoStack()

		// Assert
		expect(canUndo(stack)).toBe(false)
		expect(canRedo(stack)).toBe(false)
	})
})

describe('pushOperation', () => {
	it('adds an operation to the undo stack', () => {
		// Arrange
		const stack = buildUndoStack()

		// Act
		const updatedStack = pushOperation(stack, setCellOperation)

		// Assert
		expect(canUndo(updatedStack)).toBe(true)
	})

	it('clears the redo stack when a new operation is pushed', () => {
		// Arrange
		const stack = buildUndoStack()
		const stackWithOperation = pushOperation(stack, setCellOperation)
		const stackAfterUndo = undoOperation(stackWithOperation)

		// Act — push a new operation after undoing
		const stackWithNewOperation = pushOperation(stackAfterUndo.stack, setCellOperation)

		// Assert
		expect(canRedo(stackWithNewOperation)).toBe(false)
	})

	it('does not mutate the original stack', () => {
		// Arrange
		const stack = buildUndoStack()

		// Act
		pushOperation(stack, setCellOperation)

		// Assert
		expect(canUndo(stack)).toBe(false)
	})

	it('caps the undo history at the maximum allowed size', () => {
		// Arrange
		let stack = buildUndoStack()
		for (let index = 0; index < 105; index++) {
			stack = pushOperation(stack, setCellOperation)
		}

		// Act — undo all the way back
		let undoCount = 0
		let current = stack
		while (canUndo(current)) {
			const result = undoOperation(current)
			current = result.stack
			undoCount++
		}

		// Assert — capped at 100
		expect(undoCount).toBe(100)
	})
})

describe('undoOperation', () => {
	it('returns the inverse of a set_cell operation', () => {
		// Arrange
		const stack = pushOperation(buildUndoStack(), setCellOperation)

		// Act
		const { inverseOperation } = undoOperation(stack)

		// Assert
		expect(inverseOperation).toEqual({
			type: 'set_cell',
			rowIndex: 0,
			columnId: 'col-1',
			previousValue: 'Alicia',
			nextValue: 'Alice',
		})
	})

	it('moves the operation to the redo stack', () => {
		// Arrange
		const stack = pushOperation(buildUndoStack(), setCellOperation)

		// Act
		const { stack: stackAfterUndo } = undoOperation(stack)

		// Assert
		expect(canRedo(stackAfterUndo)).toBe(true)
		expect(canUndo(stackAfterUndo)).toBe(false)
	})

	it('does not mutate the original stack', () => {
		// Arrange
		const stack = pushOperation(buildUndoStack(), setCellOperation)

		// Act
		undoOperation(stack)

		// Assert
		expect(canUndo(stack)).toBe(true)
	})
})

describe('redoOperation', () => {
	it('returns the original operation for replay', () => {
		// Arrange
		const stack = pushOperation(buildUndoStack(), setCellOperation)
		const { stack: stackAfterUndo } = undoOperation(stack)

		// Act
		const { replayOperation } = redoOperation(stackAfterUndo)

		// Assert
		expect(replayOperation).toEqual(setCellOperation)
	})

	it('moves the operation back to the undo stack', () => {
		// Arrange
		const stack = pushOperation(buildUndoStack(), setCellOperation)
		const { stack: stackAfterUndo } = undoOperation(stack)

		// Act
		const { stack: stackAfterRedo } = redoOperation(stackAfterUndo)

		// Assert
		expect(canUndo(stackAfterRedo)).toBe(true)
		expect(canRedo(stackAfterRedo)).toBe(false)
	})
})

describe('applyOperation', () => {
	it('applies a set_cell operation to the table', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		const result = applyOperation(table, setCellOperation)

		// Assert
		expect(result.rows[0]['col-1']).toBe('Alicia')
	})

	it('does not mutate the original table', () => {
		// Arrange
		const table = structuredClone(baseTable)

		// Act
		applyOperation(table, setCellOperation)

		// Assert
		expect(table.rows[0]['col-1']).toBe('Alice')
	})

	it('applies a replace_table operation by returning the next table', () => {
		// Arrange
		const table = structuredClone(baseTable)
		const newTable: TableModel = {
			columns: [{ id: 'col-1', label: 'Title', type: 'text' }],
			rows: [{ 'col-1': 'Row one' }],
		}
		const replaceOperation: TableOperation = {
			type: 'replace_table',
			previousTable: table,
			nextTable: newTable,
		}

		// Act
		const result = applyOperation(table, replaceOperation)

		// Assert
		expect(result.columns[0].label).toBe('Title')
		expect(result.rows[0]['col-1']).toBe('Row one')
	})
})
