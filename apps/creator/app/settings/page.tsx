"use client";

import { Button } from "@repo/ui/components/ui/button";
import { AnchorIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-2">
        <div className="flex justify-center">
          <AnchorIcon className="size-5 text-purple-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Settings
        </h1>
      </div>
      <div className="mt-auto self-end flex gap-2">
        <Link href="index.html">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
        <Button disabled>Save settings</Button>
      </div>
    </div>
  );
}
