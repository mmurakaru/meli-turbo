import Image from 'next/image';
import Link from 'next/link';

export function GDPRBadge() {
  return (
    <Link
      href="/privacy-policy"
      className="flex rounded-[0.25rem]"
    >
      <div className="rounded-l-md grid place-items-center bg-[#3f45da] bg-gradient-to-tl from-[#4047db]  to-[#6e73f7] size-12">
        <Image
          src="/icons/stars_with_lock.svg"
          alt="GDPR logo"
          width={24}
          height={24}
        />
      </div>
      <div className="rounded-r-md border-[0.5px] border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground p-1.5 h-12 flex items-center">
        <div>
          <span className="block text-xs">GDPR</span>
          <span className="block text-xs uppercase">Compliant</span>
        </div>
      </div>
    </Link>
  );
}
