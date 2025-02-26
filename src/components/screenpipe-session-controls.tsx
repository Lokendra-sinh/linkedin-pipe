"use client"

import { useState } from "react"
import { Button } from "./ui/button";
import { useSession } from "@/providers/SessionProvider";


export function ScreenpipeSessionControls() {
    const { sessionId, setSessionId } = useSession()
    const [isSessionRunning, setIsSessionRunning] = useState<boolean>(false)

    const handleStartSession = async () => {
        try {
          const response = await fetch('/api/session/start', { method: 'POST' });
          if (response.ok) {
            const body = await response.json()
            if(body.data && body.data.sessionId){
            setSessionId(body.data.sessionId)
            setIsSessionRunning(true);
            }
          }
        } catch (error) {
          console.error('Failed to start Screenpipe:', error);
        }
      };
    
      const handleStopSession = async () => {
        try {

          const response = await fetch('/api/session/stop', { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId }) 
          });
          
          if (response.ok) {
            setIsSessionRunning(false);
            setSessionId(null);
          }
        } catch (error) {
          console.error('Failed to stop Screenpipe:', error);
        }
      };


      return (
        <div className="w-full flex items-center justify-center gap-4">
        <Button onClick={handleStartSession} disabled={isSessionRunning}>
          Start Screenpipe
        </Button>
        <Button onClick={handleStopSession} disabled={!isSessionRunning}>
          Stop Screenpipe
        </Button>
      </div>
      )
}