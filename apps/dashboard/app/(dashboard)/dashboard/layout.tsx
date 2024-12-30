'use client';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@workspace/ui/components/sidebar';
import { AppSidebar } from '../components/app-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="block sticky inset-y-0 p-2 shrink-0 items-center gap-2 transition-[width,height] ease-linear bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            {/* 
            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />
            <div className="flex items-center">
              <AnchorIcon
                strokeWidth={1}
                className="w-3.5 h-3.5 text-violet-700 mr-1"
              />
              <span className="text-sm font-medium uppercase">Meli</span>
            </div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Recents</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
          </div>
        </header>
        <section className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</section>
      </SidebarInset>
    </SidebarProvider>
  );
}
