import { Button } from '@repo/ui/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <Link
          href={'/'}
          className="flex justify-center"
        >
          <Image
            src="icons/meli-logo-with-gradient.svg"
            alt="Meli logo"
            width={48}
            height={48}
          />
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Page Not Found</h1>
        <p className="text-base text-gray-500">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button
          variant="secondary"
          asChild
        >
          <Link
            href="/"
            className="max-w-48 mx-auto flex justify-center"
          >
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
