"use client";

import { Button } from "@repo/ui/components/ui/button";
import { AnchorIcon } from "lucide-react";
import Link from "next/link";
import { useContent } from "./hooks/useContent";

export default function Home() {
  const { content } = useContent();

  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-8 p-4">
        <div className="flex items-center gap-2">
          <div className="flex justify-center">
            <AnchorIcon className="size-6 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
        </div>
        {content?.text ? (
          <p className="text-base text-gray-500 pb-8">{content.text}</p>
        ) : (
          <p className="text-base text-gray-500 pb-8">Loading content...</p>
        )}
        <Link href="/settings.html">
          <Button>Go to settings</Button>
        </Link>
      </div>
    </div>
  );
}
