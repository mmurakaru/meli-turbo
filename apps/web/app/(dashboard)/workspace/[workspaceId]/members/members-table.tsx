'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@workspace/ui/components/table'
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

const iconProps = { strokeWidth: 1, className: 'size-3' } as const
import { useState } from 'react'
import type { User, WorkspaceMember } from '@/lib/db/schema'

type Member = WorkspaceMember & {
	user: Pick<User, 'id' | 'name' | 'email'>
}

const columns: ColumnDef<Member>[] = [
	{
		id: 'name',
		accessorFn: (row) => row.user.name ?? row.user.email,
		header: ({ column }) => {
			const sorted = column.getIsSorted()
			return (
				<button
					type="button"
					className="flex items-center gap-1 hover:text-foreground"
					onClick={() => column.toggleSorting(sorted === 'asc')}
				>
					Name
					{sorted === 'asc' ? (
						<ArrowUp {...iconProps} />
					) : sorted === 'desc' ? (
						<ArrowDown {...iconProps} />
					) : (
						<ArrowUpDown {...iconProps} />
					)}
				</button>
			)
		},
		cell: ({ row }) => {
			const { user, role } = row.original
			const displayName = user.name ?? user.email
			const initials = displayName
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
			return (
				<div className="flex items-center gap-3">
					<Avatar className="size-10">
						<AvatarImage alt={displayName} />
						<AvatarFallback className={role === 'owner' ? 'bg-violet-500 text-white' : undefined}>
							{initials}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="font-medium text-xs">{displayName}</p>
						{user.name && <p className="text-xs text-muted-foreground">{user.email}</p>}
					</div>
				</div>
			)
		},
	},
	{
		accessorKey: 'joinedAt',
		header: 'Date joined',
		cell: ({ row }) => {
			const { joinedAt, role } = row.original
			return (
				<div>
					<p className="text-xs">Member since {format(new Date(joinedAt), 'MMM d, yyyy')}</p>
					{role === 'owner' && (
						<p className="text-xs text-muted-foreground">Created the workspace</p>
					)}
				</div>
			)
		},
	},
	{
		accessorKey: 'role',
		header: 'Role',
		cell: ({ getValue }) => {
			const role = getValue<string>()
			return <span className="text-xs capitalize">{role}</span>
		},
	},
]

export function MembersTable({ members }: { members: Member[] }) {
	const [sorting, setSorting] = useState<SortingState>([])

	const table = useReactTable({
		data: members,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	return (
		<div className="border rounded-lg overflow-hidden">
			<div className="px-6 py-4 border-b">
				<p className="text-sm font-normal text-violet-600">
					Members ({members.length})
				</p>
			</div>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id} className="text-xs font-normal text-muted-foreground">
									{flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows.map((row) => (
						<TableRow key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
