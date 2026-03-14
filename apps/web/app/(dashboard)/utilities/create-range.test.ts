import { describe, expect, it } from 'vitest'
import { createRange } from './create-range'

describe('createRange', () => {
	it('returns a numeric range by default', () => {
		// Arrange
		const length = 5

		// Act
		const result = createRange(length)

		// Assert
		expect(result).toEqual([0, 1, 2, 3, 4])
	})

	it('returns an empty array for length 0', () => {
		// Arrange
		const length = 0

		// Act
		const result = createRange(length)

		// Assert
		expect(result).toEqual([])
	})

	it('maps values with a custom initializer', () => {
		// Arrange
		const length = 3
		const initializer = (i: number) => `item-${i}`

		// Act
		const result = createRange(length, initializer)

		// Assert
		expect(result).toEqual(['item-0', 'item-1', 'item-2'])
	})
})
