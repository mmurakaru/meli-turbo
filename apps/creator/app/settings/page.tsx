"use client";

import { AnchorIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-8 p-4">
        <div className="flex items-center gap-2">
          <div className="flex justify-center">
            <AnchorIcon className="size-6 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Settings
          </h1>
        </div>
      </div>
    </div>
  );
}
