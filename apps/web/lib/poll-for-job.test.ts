import { describe, expect, it, vi } from 'vitest'
import { pollForJob } from './poll-for-job'

type Sheet = { columns: { id: string; label: string }[]; rows: Record<string, string>[] }

const mockSheet: Sheet = {
	columns: [{ id: 'col-1', label: 'Name' }],
	rows: [{ 'col-1': 'Alice' }],
}

describe('pollForJob', () => {
	it('returns the sheet when the job completes on the first poll', async () => {
		// Arrange
		const pollFn = vi.fn().mockResolvedValue({ status: 'completed', sheet: mockSheet })

		// Act
		const result = await pollForJob('job-abc', pollFn, { maxPolls: 5, delayMs: 0 })

		// Assert
		expect(result).toEqual({ sheet: mockSheet })
	})

	it('retries until the job completes', async () => {
		// Arrange
		const pollFn = vi
			.fn()
			.mockResolvedValueOnce({ status: 'active' })
			.mockResolvedValueOnce({ status: 'active' })
			.mockResolvedValueOnce({ status: 'completed', sheet: mockSheet })

		// Act
		const result = await pollForJob('job-abc', pollFn, { maxPolls: 10, delayMs: 0 })

		// Assert
		expect(result).toEqual({ sheet: mockSheet })
		expect(pollFn).toHaveBeenCalledTimes(3)
	})

	it('returns an error when the job fails', async () => {
		// Arrange
		const pollFn = vi.fn().mockResolvedValue({ status: 'failed', error: 'LLM timeout' })

		// Act
		const result = await pollForJob('job-abc', pollFn, { maxPolls: 5, delayMs: 0 })

		// Assert
		expect(result).toEqual({ error: 'LLM timeout' })
	})

	it('returns a generic error when failed job has no error message', async () => {
		// Arrange
		const pollFn = vi.fn().mockResolvedValue({ status: 'failed' })

		// Act
		const result = await pollForJob('job-abc', pollFn, { maxPolls: 5, delayMs: 0 })

		// Assert
		expect(result).toEqual({ error: 'Generation failed' })
	})

	it('returns a timeout error when maxPolls is exhausted', async () => {
		// Arrange
		const pollFn = vi.fn().mockResolvedValue({ status: 'active' })

		// Act
		const result = await pollForJob('job-abc', pollFn, { maxPolls: 3, delayMs: 0 })

		// Assert
		expect(result).toEqual({ error: 'Generation timed out. Please try again.' })
		expect(pollFn).toHaveBeenCalledTimes(3)
	})

	it('passes the jobId to every poll call', async () => {
		// Arrange
		const pollFn = vi.fn().mockResolvedValue({ status: 'completed', sheet: mockSheet })

		// Act
		await pollForJob('job-xyz', pollFn, { maxPolls: 1, delayMs: 0 })

		// Assert
		expect(pollFn).toHaveBeenCalledWith('job-xyz')
	})

	it('returns an error when the completed job has no sheet', async () => {
		// Arrange
		const pollFn = vi.fn().mockResolvedValue({ status: 'completed' })

		// Act
		const result = await pollForJob('job-abc', pollFn, { maxPolls: 5, delayMs: 0 })

		// Assert
		expect(result).toEqual({ error: 'Generation failed' })
	})
})
