// "use client";

import { ScreenpipeSessionControls } from "@/components/screenpipe-session-controls";
import { SessionProvider } from "@/providers/SessionProvider";



export default function Page() {

  return (
    <SessionProvider>
    <div className="flex flex-col gap-4 items-center justify-center h-full mt-12">
      <p className="text-xl">Your personal job tracking assistant</p>
      <ScreenpipeSessionControls />
    </div>
    </SessionProvider>
  );
}
