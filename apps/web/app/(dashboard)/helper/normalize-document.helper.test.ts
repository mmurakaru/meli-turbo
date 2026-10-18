import { describe, expect, it } from 'vitest'
import type { Document } from '@/lib/db/schema'
import { normalizeDocument, normalizedDocuments } from './normalize-document.helper'

const baseDocument: Document = {
	id: '00000000-0000-7000-8000-000000000001',
	ownerId: 'owner-123',
	ownerType: 'workspace',
	title: 'My Document',
	description: 'A test document',
	data: { columns: [], rows: [] },
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-06-15T00:00:00Z'),
	deletedAt: null,
}

describe('normalizeDocument', () => {
	it("translates ownerType 'workspace' to 'Workspace'", () => {
		// Arrange
		const document: Document = { ...baseDocument, ownerType: 'workspace' }

		// Act
		const result = normalizeDocument(document)

		// Assert
		expect(result.ownerType).toBe('Workspace')
	})

	it("translates ownerType 'user' to 'Private'", () => {
		// Arrange
		const document: Document = { ...baseDocument, ownerType: 'user' }

		// Act
		const result = normalizeDocument(document)

		// Assert
		expect(result.ownerType).toBe('Private')
	})

	it("formats updatedAt as 'MMM dd, yyyy'", () => {
		// Arrange
		const document: Document = { ...baseDocument, updatedAt: new Date('2024-06-15T00:00:00Z') }

		// Act
		const result = normalizeDocument(document)

		// Assert
		expect(result.updatedAt).toBe('Jun 15, 2024')
	})

	it('passes through all other fields unchanged', () => {
		// Arrange
		const document: Document = { ...baseDocument }

		// Act
		const result = normalizeDocument(document)

		// Assert
		expect(result.id).toBe(document.id)
		expect(result.ownerId).toBe(document.ownerId)
		expect(result.title).toBe(document.title)
		expect(result.description).toBe(document.description)
		expect(result.createdAt).toBe(document.createdAt)
		expect(result.deletedAt).toBe(document.deletedAt)
	})
})

describe('normalizedDocuments', () => {
	it('maps each document through normalizeDocument', () => {
		// Arrange
		const documents: Document[] = [
			{ ...baseDocument, id: '00000000-0000-7000-8000-000000000001', ownerType: 'workspace' },
			{ ...baseDocument, id: '00000000-0000-7000-8000-000000000002', ownerType: 'user' },
		]

		// Act
		const result = normalizedDocuments(documents)

		// Assert
		expect(result).toHaveLength(2)
		expect(result[0].ownerType).toBe('Workspace')
		expect(result[1].ownerType).toBe('Private')
	})

	it('returns an empty array for empty input', () => {
		// Arrange + Act
		const result = normalizedDocuments([])

		// Assert
		expect(result).toEqual([])
	})
})
