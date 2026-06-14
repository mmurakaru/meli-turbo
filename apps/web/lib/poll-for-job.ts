type Sheet = { columns: { id: string; label: string }[]; rows: Record<string, string>[] }
type JobStatus = 'pending' | 'active' | 'completed' | 'failed'
type JobResult = { status: JobStatus; sheet?: Sheet; error?: string }

export type PollResult = { sheet: Sheet } | { error: string }

export type PollFn = (jobId: string) => Promise<JobResult>

export async function pollForJob(
	jobId: string,
	pollFn: PollFn,
	options: { maxPolls: number; delayMs: number },
): Promise<PollResult> {
	const { maxPolls, delayMs } = options

	for (let i = 0; i < maxPolls; i++) {
		if (delayMs > 0) {
			await new Promise((resolve) => setTimeout(resolve, delayMs))
		}

		const result = await pollFn(jobId)

		if (result.status === 'completed') {
			if (!result.sheet) return { error: 'Generation failed' }
			return { sheet: result.sheet }
		}

		if (result.status === 'failed') {
			return { error: result.error ?? 'Generation failed' }
		}
	}

	return { error: 'Generation timed out. Please try again.' }
}

export async function fetchJobStatus(jobId: string): Promise<JobResult> {
	const res = await fetch(`/api/jobs/${jobId}`)
	return res.json() as Promise<JobResult>
}
