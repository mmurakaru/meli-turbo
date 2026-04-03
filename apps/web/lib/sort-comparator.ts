import { type ColumnType } from './infer-column-type'

export type SortComparator = (firstValue: string, secondValue: string) => number

export function buildSortComparator(columnType: ColumnType): SortComparator {
	switch (columnType) {
		case 'number':
			return (firstValue, secondValue) =>
				(Number(firstValue) || 0) - (Number(secondValue) || 0)

		case 'date':
			return (firstValue, secondValue) =>
				Date.parse(firstValue) - Date.parse(secondValue)

		case 'boolean':
			return (firstValue, secondValue) => {
				if (firstValue === secondValue) return 0
				return firstValue === 'false' ? -1 : 1
			}

		default:
			return (firstValue, secondValue) =>
				firstValue.localeCompare(secondValue, undefined, { sensitivity: 'base' })
	}
}
