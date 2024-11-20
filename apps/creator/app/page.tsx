import { AnchorIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <AnchorIcon className="size-12 text-purple-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Not Found
        </h1>
        <p className="text-base text-gray-500">
          The chrome extension you are looking for might have been removed, had
          its name changed, or is temporarily unavailable.
        </p>
      </div>
    </div>
  );
}
