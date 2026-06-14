type Row = Record<string, string>

export function applyRowUpdate(
	rows: Row[],
	rowIndex: number,
	columnId: string,
	value: string,
): Row[] {
	const next = [...rows]
	next[rowIndex] = { ...next[rowIndex], [columnId]: value }
	return next
}
