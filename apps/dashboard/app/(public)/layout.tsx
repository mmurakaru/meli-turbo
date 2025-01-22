'use client';

import { signOut } from '@/app/(login)/actions';
import { useUser } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Separator } from '@workspace/ui/components/separator';
import { LayoutDashboard, LogOut } from 'lucide-react';
//import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

//const MeliC = dynamic(() => import('./_components/meli-init').then((module) => module.MeliInit), { ssr: false });

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
    <header className="fixed top-0 w-full border-b border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center"
          aria-label="Meli"
        >
          <Image
            src="/icons/meli-with-gradient.svg"
            alt="Meli logo"
            width={24}
            height={24}
          />
          <span className="ml-2 text-xl font-semibold text-gray-900 uppercase">Meli</span>
        </Link>
        <div className="flex items-center space-x-4 hidden sm:block">
          <Button
            variant="link"
            asChild
          >
            <Link
              href="/product"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Product
            </Link>
          </Button>

          <Button
            variant="link"
            asChild
          >
            <Link
              href="/use-cases"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Use cases
            </Link>
          </Button>
          <Button
            variant="link"
            asChild
          >
            <Link
              href="/pricing"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Pricing
            </Link>
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu
              open={isMenuOpen}
              onOpenChange={setIsMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer size-9">
                  <AvatarImage alt={user.name || ''} />
                  <AvatarFallback className="bg-violet-200 text-white">
                    {user.email
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-gray-50 w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg gap-2"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-sidebar-foreground/70">
                    {user.email}
                  </DropdownMenuLabel>
                  <Link
                    href="/dashboard"
                    className="flex w-full items-center"
                  >
                    <DropdownMenuItem className="w-full cursor-pointer gap-2 h-9">
                      <LayoutDashboard
                        strokeWidth={1}
                        className="h-4 w-4"
                      />
                      <span className="font-light">Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <form action={handleSignOut}>
                    <button
                      type="submit"
                      className="w-full p-0"
                    >
                      <DropdownMenuItem className="w-full cursor-pointer gap-2 h-9">
                        <LogOut strokeWidth={1} />
                        <span className="font-light">Sign out</span>
                      </DropdownMenuItem>
                    </button>
                  </form>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="outline"
                asChild
              >
                <Link href="/sign-in">Sign in</Link>
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
  const productLinks = [
    { href: '/product', label: 'Product overview' },
    { href: '/use-cases', label: 'Use cases' },
    { href: '/pricing', label: 'Pricing' },
    { href: 'https://docs.meli-ai.com/', label: 'Docs' },
  ];

  const legalLinks = [
    { href: '/terms-of-use', label: 'Terms of Use' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/legal-notice', label: 'Legal Notice' },
  ];

  const companyLinks = [{ href: '/about', label: 'About' }];
  /* 
  const socialLinks = [
    { href: 'https://www.twitter.com/melihq', label: 'Twitter', className: 'bg-[url(/twitter-icon.svg)]' },
    { href: 'https://www.linkedin.com/company/melihq', label: 'LinkedIn', className: 'bg-[url(/linkedin-icon.svg)]' },
    { href: 'https://www.instagram.com/melihq', label: 'Instagram', className: 'bg-[url(/instagram-icon.svg)]' },
    { href: 'https://www.youtube.com/@melihq', label: 'YouTube', className: 'bg-[url(/youtube-icon.svg)]' },
  ]; */

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
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row w-full">
          <div className="flex flex-col items-center gap-2 sm:items-start w-full">
            <Link
              href="/"
              className="flex items-center"
              aria-label="Meli"
            >
              <Image
                src="/icons/meli-with-gradient.svg"
                alt="Meli logo"
                width={24}
                height={24}
              />
              <span className="ml-2 text-xl font-semibold text-gray-900 uppercase">Meli</span>
            </Link>
            <p className="text-xs text-muted-foreground">
              © Copyright {new Date().getFullYear()} Meli Software. All rights reserved.
            </p>
          </div>
          {/*           <div className="flex gap-4">
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
          </div> */}
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen pt-[4.25rem]">
      {/* <MeliC debug /> */}
      <Header />
      {children}
      <Footer />
    </section>
  );
}
