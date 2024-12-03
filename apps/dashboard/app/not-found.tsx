import { Button } from '@repo/ui/components/ui/button';
import { AnchorIcon } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <AnchorIcon className="size-12 text-purple-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Page Not Found</h1>
        <p className="text-base text-gray-500">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="max-w-48 mx-auto flex justify-center"
        >
          <Button variant="secondary">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
