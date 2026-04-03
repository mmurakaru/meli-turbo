import { describe, expect, it } from 'vitest'
import { applyRowUpdate } from './editable-spreadsheet.helpers'

type Row = Record<string, string>

const baseRows: Row[] = [
  { 'col-1': 'Alice', 'col-2': 'alice@example.com' },
  { 'col-1': 'Bob', 'col-2': 'bob@example.com' },
  { 'col-1': 'Carol', 'col-2': 'carol@example.com' },
]

describe('applyRowUpdate', () => {
  it('updates the correct cell value', () => {
    // Arrange
    const rows = structuredClone(baseRows)

    // Act
    const result = applyRowUpdate(rows, 1, 'col-1', 'Robert')

    // Assert
    expect(result[1]['col-1']).toBe('Robert')
  })

  it('does not mutate the original rows array', () => {
    // Arrange
    const rows = structuredClone(baseRows)

    // Act
    applyRowUpdate(rows, 0, 'col-1', 'Changed')

    // Assert
    expect(rows[0]['col-1']).toBe('Alice')
  })

  it('returns a new array reference', () => {
    // Arrange
    const rows = structuredClone(baseRows)

    // Act
    const result = applyRowUpdate(rows, 0, 'col-1', 'Changed')

    // Assert
    expect(result).not.toBe(rows)
  })

  it('returns a new object reference for the updated row', () => {
    // Arrange
    const rows = structuredClone(baseRows)

    // Act
    const result = applyRowUpdate(rows, 0, 'col-1', 'Changed')

    // Assert
    expect(result[0]).not.toBe(rows[0])
  })

  it('leaves all other rows unchanged', () => {
    // Arrange
    const rows = structuredClone(baseRows)

    // Act
    const result = applyRowUpdate(rows, 0, 'col-1', 'Changed')

    // Assert
    expect(result[1]).toEqual(baseRows[1])
    expect(result[2]).toEqual(baseRows[2])
  })

  it('sets a new key if the column did not exist on the row', () => {
    // Arrange
    const rows: Row[] = [{ 'col-1': 'Alice' }]

    // Act
    const result = applyRowUpdate(rows, 0, 'col-2', 'new@example.com')

    // Assert
    expect(result[0]['col-2']).toBe('new@example.com')
  })

  it('sets an empty string value correctly', () => {
    // Arrange
    const rows = structuredClone(baseRows)

    // Act
    const result = applyRowUpdate(rows, 0, 'col-1', '')

    // Assert
    expect(result[0]['col-1']).toBe('')
  })

  it('preserves rows length', () => {
    // Arrange
    const rows = structuredClone(baseRows)

    // Act
    const result = applyRowUpdate(rows, 2, 'col-2', 'new@carol.com')

    // Assert
    expect(result).toHaveLength(baseRows.length)
  })
})
