'use client'

import { Button } from '@workspace/ui/components/button'
import { SidebarTrigger } from '@workspace/ui/components/sidebar'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { SquarePen } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NEW_DOCUMENT_PATHNAME } from '../constants/dashboard.constants'

export function DashboardHeader() {
	const pathname = usePathname()

	return (
		<header className="block sticky top-0 inset-y-0 p-2 shrink-0 items-center gap-2 transition-[width,height] ease-linear bg-white border-b border-gray-200 z-10">
			<div className="flex items-center gap-2 justify-between">
				<SidebarTrigger />
				{pathname !== NEW_DOCUMENT_PATHNAME ? (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									data-sidebar="new-tour"
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									asChild
								>
									<Link href={NEW_DOCUMENT_PATHNAME}>
										<SquarePen strokeWidth={1} />
										<span className="sr-only">Create new spreadsheet</span>
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Create new spreadsheet</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				) : null}
			</div>
		</header>
	)
}
