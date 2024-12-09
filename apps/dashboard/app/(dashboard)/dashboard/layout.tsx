'use client';

import { signOut } from '@/app/(login)/actions';
import { useUser } from '@/lib/auth';
import { Button } from '@repo/ui/components/ui/button';
import { cn } from '@repo/ui/lib/utils';
import { Activity, AnchorIcon, ChartColumn, Clock, LogOutIcon, Menu, Settings, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', icon: Clock, label: 'Recents' },
    { href: '/dashboard/analytics', icon: ChartColumn, label: 'Analytics' },
    { href: '/dashboard/team', icon: Users, label: 'Team' },
    { href: '/dashboard/general', icon: Settings, label: 'General' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/dashboard/security', icon: Shield, label: 'Security' },
  ];

  async function handleSignOut() {
    setUser(null);
    await signOut();
    router.push('/');
  }

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-7xl w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <AnchorIcon
            strokeWidth={1}
            className="w-3.5 h-3.5 text-violet-700 mr-1"
          />
          <span className="text-sm font-medium uppercase">Meli</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={cn(
            'w-64 bg-white border-r border-gray-200 lg:block lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
            isSidebarOpen ? 'block translate-x-0 fixed' : 'hidden -translate-x-full',
          )}
        >
          <nav className="h-full overflow-y-auto p-4 flex flex-col">
            <div className="mb-4 px-4 flex items-center">
              <span className="text-sm font-medium uppercase">{user?.name}</span>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                passHref
              >
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={`my-1 w-full justify-start ${pathname === item.href ? 'bg-gray-100' : ''}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon
                    strokeWidth={1}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="font-light">{item.label}</span>
                </Button>
              </Link>
            ))}

            <form
              className="mt-auto"
              action={handleSignOut}
            >
              <Button
                type="submit"
                variant="ghost"
                className="my-1 w-full justify-start"
              >
                <LogOutIcon
                  strokeWidth={1}
                  className="mr-2 h-4 w-4"
                />
                <span className="font-light">Sign out</span>
              </Button>
            </form>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
