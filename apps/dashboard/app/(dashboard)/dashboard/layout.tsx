import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@workspace/ui/components/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  //   const { user, setUser } = useUser();
  //   const router = useRouter();
  //   const pathname = usePathname();
  //   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  //   const navItemsTop = [
  //     { href: '/dashboard', icon: Clock, label: 'Recents', id: null },
  //     { href: '/dashboard/analytics', icon: ChartColumn, label: 'Analytics', id: null },
  //     { href: '/dashboard/team', icon: Users, label: 'Team', id: null },
  //     { href: '/dashboard/private', icon: CircleUser, label: 'Private', id: null },
  //     // { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
  //   ];

  //   const navItemsBottom = [
  //     { href: '/dashboard/workspace', icon: Settings, label: 'Workspace Settings', id: null },
  //     { href: '/dashboard/account', icon: UserCog, label: 'Account settings', id: null },
  //   ];

  //   async function handleSignOut() {
  //     setUser(null);
  //     await signOut();
  //     router.push('/');
  //   }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="p-0 lg:p-4 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            {/* <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
