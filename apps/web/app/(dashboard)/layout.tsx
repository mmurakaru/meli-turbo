import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar'
import { DashboardHeader } from './_components/dashboard-header'
import { AppSidebarServer } from './_components/nav/app-sidebar-server'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebarServer />
			<SidebarInset className="md:overflow-x-auto relative">
				<DashboardHeader />
				<section className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-screen-xl">{children}</section>
			</SidebarInset>
		</SidebarProvider>
	)
}
