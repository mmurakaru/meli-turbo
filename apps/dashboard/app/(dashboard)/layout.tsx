'use client';

import { signOut } from '@/app/(login)/actions';
import { useUser } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';
import { Button } from '@repo/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import { Anchor, Home, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setUser } = useUser();
  const router = useRouter();

  async function handleSignOut() {
    setUser(null);
    await signOut();
    router.push('/');
  }

  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center"
        >
          <Anchor className="h-6 w-6 text-purple-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900">MELI</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            href="/pricing"
            className="pricing-link text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Pricing
          </Link>
          {user ? (
            <DropdownMenu
              open={isMenuOpen}
              onOpenChange={setIsMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer size-9">
                  <AvatarImage alt={user.name || ''} />
                  <AvatarFallback>
                    {user.email
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="p-0"
              >
                <DropdownMenuItem className="w-full cursor-pointer m-1">
                  <Link
                    href="/dashboard"
                    className="flex w-full items-center"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <form
                  action={handleSignOut}
                  className="p-1"
                >
                  <button
                    type="submit"
                    className="flex w-full"
                  >
                    <DropdownMenuItem className="w-full cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="outline"
                asChild
              >
                <Link
                  href="/sign-in"
                  className="signin-link"
                >
                  Log in
                </Link>
              </Button>
              <Button asChild>
                <Link
                  href="/sign-up"
                  className="signup-link"
                >
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      {children}
    </section>
  );
}
