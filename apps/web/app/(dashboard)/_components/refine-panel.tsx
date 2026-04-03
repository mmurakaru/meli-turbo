'use client'

import { useState } from 'react'
import { Input } from '@workspace/ui/components/input'
import { Sparkles } from 'lucide-react'
import { fetchJobStatus, pollForJob } from '@/lib/poll-for-job'

type Sheet = { columns: { id: string; label: string }[]; rows: Record<string, string>[] }

interface RefinePanelProps {
	table: Sheet
	onRefined: (newTable: Sheet) => void
}

export function RefinePanel({ table, onRefined }: RefinePanelProps) {
	const [input, setInput] = useState('')
	const [log, setLog] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	async function handleRefine() {
		const trimmed = input.trim()
		if (!trimmed || isLoading) return

		setLog((prev) => [`You: ${trimmed}`, ...prev].slice(0, 6))
		setInput('')
		setIsLoading(true)
		setError('')

		try {
			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: `Given this spreadsheet: ${JSON.stringify(table)}\n\n${trimmed}` }),
			})
			const data = await res.json()
			if (!res.ok || !data.jobId) {
				setError(data.error ?? 'Failed to start generation')
				return
			}

			const result = await pollForJob(data.jobId, fetchJobStatus, {
				maxPolls: 60,
				delayMs: 1500,
			})

			if ('error' in result) {
				setError(result.error)
			} else {
				onRefined(result.sheet)
			}
		} catch {
			setError('Something went wrong. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-sm font-semibold text-gray-900">Refine with AI</h2>
				<p className="text-xs text-gray-500">Describe a change and press Enter.</p>
			</div>
			<div className="flex flex-col gap-3">
				<Input
					placeholder="Add a status column, group rows by category..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault()
							void handleRefine()
						}
					}}
					variant="ghost"
					className="px-0"
					disabled={isLoading}
				/>
				{isLoading && (
					<p className="flex items-center gap-1 text-xs text-violet-500">
						<Sparkles className="h-3 w-3 animate-pulse" strokeWidth={1} />
						Generating…
					</p>
				)}
				{error && <p className="text-xs text-red-500">{error}</p>}
				{log.length > 0 && (
					<ul className="space-y-2 text-xs text-gray-500">
						{log.map((entry) => (
							<li key={entry}>{entry}</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}
