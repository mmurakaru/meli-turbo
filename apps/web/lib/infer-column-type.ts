export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'url' | 'select'

const MINIMUM_SAMPLE_SIZE_FOR_SELECT_INFERENCE = 6
const MAXIMUM_UNIQUE_RATIO_FOR_SELECT = 0.3

export function inferColumnType(values: string[]): ColumnType {
	const nonBlankValues = values.filter((value) => value.trim() !== '')

	if (nonBlankValues.length === 0) return 'text'

	const sample = nonBlankValues.slice(0, 20)

	if (sample.every((value) => !Number.isNaN(Number(value)))) return 'number'

	if (sample.every((value) => value === 'true' || value === 'false')) return 'boolean'

	if (sample.every((value) => value.startsWith('http'))) return 'url'

	if (sample.every((value) => !Number.isNaN(Date.parse(value)))) return 'date'

	if (
		sample.length >= MINIMUM_SAMPLE_SIZE_FOR_SELECT_INFERENCE &&
		new Set(sample).size / sample.length <= MAXIMUM_UNIQUE_RATIO_FOR_SELECT
	) {
		return 'select'
	}

	return 'text'
}
