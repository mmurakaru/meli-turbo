'use client';

import { Button } from '@workspace/ui/components/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@workspace/ui/components/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { SquarePen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '../components/nav/app-sidebar';
import { NEW_TOUR_PATHNAME } from '../constants/dashboard.constants';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="md:overflow-x-auto relative">
        <header className="block sticky top-0 inset-y-0 p-2 shrink-0 items-center gap-2 transition-[width,height] ease-linear bg-white border-b border-gray-200 z-10">
          <div className="flex items-center gap-2 justify-between">
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

            {pathname !== NEW_TOUR_PATHNAME ? (
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
                      <Link href={NEW_TOUR_PATHNAME}>
                        <SquarePen strokeWidth={1} />
                        <span className="sr-only">Create new tour</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create new tour</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
        </header>
        <section className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-screen-xl">{children}</section>
      </SidebarInset>
    </SidebarProvider>
  );
}
