'use client'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

type Column = { id: string; label: string }
type Row = Record<string, string>

export function SpreadsheetView({ columns, rows }: { columns: Column[]; rows: Row[] }) {
  const colDefs = useMemo<ColumnDef<Row>[]>(
    () => columns.map((col) => ({
      accessorKey: col.id,
      header: col.label,
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    })),
    [columns]
  )

  const table = useReactTable({
    data: rows,
    columns: colDefs,
    getCoreRowModel: getCoreRowModel(),
  })

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        No spreadsheet data yet.
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border-b px-3 py-2 font-semibold">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="even:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border-b px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
