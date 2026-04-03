import { describe, expect, it } from 'vitest'
import { inferColumnType } from './infer-column-type'

describe('inferColumnType', () => {
	describe('number', () => {
		it('returns number when all values are integers', () => {
			// Arrange
			const values = ['1', '2', '3', '42', '100']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('number')
		})

		it('returns number when all values are decimals', () => {
			// Arrange
			const values = ['1.5', '2.99', '3.14', '0.001']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('number')
		})

		it('returns number when all values are negative numbers', () => {
			// Arrange
			const values = ['-1', '-42', '-3.14']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('number')
		})
	})

	describe('boolean', () => {
		it('returns boolean when all values are true or false', () => {
			// Arrange
			const values = ['true', 'false', 'true', 'true']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('boolean')
		})

		it('returns boolean for a single true value', () => {
			// Arrange
			const values = ['true']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('boolean')
		})
	})

	describe('url', () => {
		it('returns url when all values start with https', () => {
			// Arrange
			const values = ['https://example.com', 'https://google.com', 'https://github.com/user/repo']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('url')
		})

		it('returns url when all values start with http', () => {
			// Arrange
			const values = ['http://example.com', 'http://old-site.org']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('url')
		})
	})

	describe('date', () => {
		it('returns date when all values are ISO date strings', () => {
			// Arrange
			const values = ['2024-01-15', '2023-12-31', '2025-06-01']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('date')
		})

		it('returns date when all values are readable date strings', () => {
			// Arrange
			const values = ['January 15, 2024', 'December 31, 2023']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('date')
		})
	})

	describe('select', () => {
		it('returns select when values have low uniqueness ratio and enough samples', () => {
			// Arrange — 3 unique values out of 10, ratio = 0.3
			const values = [
				'Active',
				'Inactive',
				'Pending',
				'Active',
				'Active',
				'Inactive',
				'Pending',
				'Active',
				'Pending',
				'Inactive',
			]

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('select')
		})

		it('returns select when few unique values repeat across many rows', () => {
			// Arrange — 2 unique values out of 12, ratio ≈ 0.167
			const values = [
				'Open',
				'Closed',
				'Open',
				'Open',
				'Closed',
				'Open',
				'Closed',
				'Closed',
				'Open',
				'Open',
				'Closed',
				'Open',
			]

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('select')
		})
	})

	describe('text (fallback)', () => {
		it('returns text for mixed arbitrary strings', () => {
			// Arrange
			const values = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('text')
		})

		it('returns text for an empty array', () => {
			// Arrange
			const values: string[] = []

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('text')
		})

		it('returns text when only blank values are present', () => {
			// Arrange
			const values = ['', '', '']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('text')
		})

		it('does not infer number when mixed with non-numeric values', () => {
			// Arrange
			const values = ['1', '2', 'three', '4']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).not.toBe('number')
		})
	})

	describe('blank value handling', () => {
		it('ignores blank values when inferring type', () => {
			// Arrange — blanks should not prevent number inference
			const values = ['1', '', '3', '', '5']

			// Act
			const result = inferColumnType(values)

			// Assert
			expect(result).toBe('number')
		})
	})
})
