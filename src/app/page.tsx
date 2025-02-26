"use client";

import { ScreenpipeSessionControls } from "@/components/screenpipe-session-controls";
import { SessionsTable } from "@/components/sessions-table";
import { SessionProvider } from "@/providers/SessionProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  return (
    <SessionProvider>
      <div className="flex flex-col gap-6 container py-8 max-w-5xl mx-auto">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Job Scout</h1>
          <p className="text-gray-500 mt-1">Your personal job tracking assistant</p>
        </div>
        
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="capture">Capture</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions" className="mt-6">
            <SessionsTable />
          </TabsContent>
          
          <TabsContent value="capture" className="mt-6">
            <div className="flex flex-col items-center justify-center gap-6 py-10 border rounded-lg bg-gray-50">
              <div className="text-center max-w-md">
                <h3 className="text-lg font-medium mb-2">Start Tracking Jobs</h3>
                <p className="text-gray-500 mb-4">
                  Screenpipe will capture your browsing session and identify job postings automatically.
                </p>
              </div>
              <ScreenpipeSessionControls />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SessionProvider>
  );
}