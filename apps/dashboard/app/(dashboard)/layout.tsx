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
import { Separator } from '@repo/ui/components/ui/separator';
import { Anchor, Home, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

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
          aria-label="Meli"
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
                  Sign in
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
interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
  children?: ReactNode;
}

export function FooterColumn({ title, links, children }: FooterColumnProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {links.map((link) => (
        <FooterLink
          key={link.href}
          {...link}
        />
      ))}
      {children}
    </div>
  );
}

function FooterLink({ href, label, external }: FooterLink) {
  const linkProps = external ? { target: '_blank', rel: 'noreferrer' } : {};

  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
      {...linkProps}
    >
      {label}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </Link>
  );
}

export function Footer() {
  const productLinks = [{ href: '/pricing', label: 'Pricing' }];

  const legalLinks = [
    { href: '/terms-of-use', label: 'Terms of Use' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/legal-notice', label: 'Legal Notice' },
  ];

  const companyLinks = [{ href: '/about', label: 'About' }];

  const socialLinks = [
    { href: 'https://www.twitter.com/melihq', label: 'Twitter', className: 'bg-[url(/twitter-icon.svg)]' },
    { href: 'https://www.linkedin.com/company/melihq', label: 'LinkedIn', className: 'bg-[url(/linkedin-icon.svg)]' },
    { href: 'https://www.instagram.com/melihq', label: 'Instagram', className: 'bg-[url(/instagram-icon.svg)]' },
    { href: 'https://www.youtube.com/@melihq', label: 'YouTube', className: 'bg-[url(/youtube-icon.svg)]' },
  ];
  return (
    <footer className="bg-background text-foreground">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FooterColumn
            title="Product"
            links={productLinks}
          />
          <FooterColumn
            title="Legal"
            links={legalLinks}
          />
          <FooterColumn
            title="Company"
            links={companyLinks}
          />
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Link
              href="/"
              className="flex items-center"
              aria-label="Meli"
            >
              <Anchor className="h-6 w-6 text-purple-500" />
              <span className="ml-2 text-xl font-semibold text-gray-900">MELI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © Copyright {new Date().getFullYear()} Meli Software. All rights reserved.
            </p>
          </div>
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`h-6 w-6 bg-contain bg-center bg-no-repeat opacity-50 transition-opacity hover:opacity-100 ${link.className}`}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      {children}
      <Footer />
    </section>
  );
}
