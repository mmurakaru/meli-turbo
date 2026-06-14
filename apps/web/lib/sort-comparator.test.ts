import { describe, expect, it } from 'vitest'
import { buildSortComparator } from './sort-comparator'

describe('buildSortComparator', () => {
	describe('text type', () => {
		it('sorts strings alphabetically ascending', () => {
			// Arrange
			const compare = buildSortComparator('text')
			const values = ['Banana', 'Apple', 'Cherry']

			// Act
			const result = [...values].sort(compare)

			// Assert
			expect(result).toEqual(['Apple', 'Banana', 'Cherry'])
		})

		it('sorts strings alphabetically descending when negated', () => {
			// Arrange
			const compare = buildSortComparator('text')
			const values = ['Banana', 'Apple', 'Cherry']

			// Act
			const result = [...values].sort((first, second) => -compare(first, second))

			// Assert
			expect(result).toEqual(['Cherry', 'Banana', 'Apple'])
		})

		it('is case-insensitive', () => {
			// Arrange
			const compare = buildSortComparator('text')

			// Act
			const result = compare('apple', 'Banana')

			// Assert
			expect(result).toBeLessThan(0)
		})
	})

	describe('number type', () => {
		it('sorts numbers numerically rather than lexicographically', () => {
			// Arrange
			const compare = buildSortComparator('number')
			const values = ['10', '9', '100', '2']

			// Act
			const result = [...values].sort(compare)

			// Assert
			expect(result).toEqual(['2', '9', '10', '100'])
		})

		it('places smaller numbers before larger ones', () => {
			// Arrange
			const compare = buildSortComparator('number')

			// Act
			const result = compare('5', '20')

			// Assert
			expect(result).toBeLessThan(0)
		})

		it('treats non-numeric values as zero', () => {
			// Arrange
			const compare = buildSortComparator('number')

			// Act
			const result = compare('abc', '5')

			// Assert
			expect(result).toBeLessThan(0)
		})
	})

	describe('date type', () => {
		it('sorts dates chronologically', () => {
			// Arrange
			const compare = buildSortComparator('date')
			const values = ['2024-03-15', '2023-01-01', '2025-12-31']

			// Act
			const result = [...values].sort(compare)

			// Assert
			expect(result).toEqual(['2023-01-01', '2024-03-15', '2025-12-31'])
		})

		it('places earlier dates before later dates', () => {
			// Arrange
			const compare = buildSortComparator('date')

			// Act
			const result = compare('2020-01-01', '2024-06-15')

			// Assert
			expect(result).toBeLessThan(0)
		})
	})

	describe('boolean type', () => {
		it('places false before true', () => {
			// Arrange
			const compare = buildSortComparator('boolean')

			// Act
			const result = compare('false', 'true')

			// Assert
			expect(result).toBeLessThan(0)
		})

		it('considers two equal boolean values as equal', () => {
			// Arrange
			const compare = buildSortComparator('boolean')

			// Act
			const result = compare('true', 'true')

			// Assert
			expect(result).toBe(0)
		})
	})

	describe('url and select types', () => {
		it('falls back to locale-aware text sort for url type', () => {
			// Arrange
			const compare = buildSortComparator('url')

			// Act
			const result = compare('https://apple.com', 'https://banana.com')

			// Assert
			expect(result).toBeLessThan(0)
		})

		it('falls back to locale-aware text sort for select type', () => {
			// Arrange
			const compare = buildSortComparator('select')

			// Act
			const result = compare('Active', 'Inactive')

			// Assert
			expect(result).toBeLessThan(0)
		})
	})

	describe('equal values', () => {
		it('returns zero for two identical text values', () => {
			// Arrange
			const compare = buildSortComparator('text')

			// Act
			const result = compare('same', 'same')

			// Assert
			expect(result).toBe(0)
		})

		it('returns zero for two identical numbers', () => {
			// Arrange
			const compare = buildSortComparator('number')

			// Act
			const result = compare('42', '42')

			// Assert
			expect(result).toBe(0)
		})
	})
})
