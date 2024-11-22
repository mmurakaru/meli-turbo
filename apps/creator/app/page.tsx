"use client";

import { AnchorIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[100dvh">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex justify-center">
            <AnchorIcon className="size-5 text-purple-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
        </div>
        <div className="flex justify-center">
          <Link href="/settings.html">
            <SettingsIcon className="size-4 text-gray-500 hover:text-purple-500 focus-visible:text-purple-500 active:text-purple-500" />
          </Link>
        </div>
      </div>
      {/* 
      {content?.text ? (
        <p className="text-base text-gray-500 pb-8">{content.text}</p>
      ) : (
        <p className="text-base text-gray-500 pb-8">Loading content...</p>
      )} */}
    </div>
  );
}
