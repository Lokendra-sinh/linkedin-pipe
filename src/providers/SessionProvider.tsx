"use client"
import { createContext, useState, useContext, SetStateAction, ReactNode } from 'react';

interface SessionContextProps {
    sessionId: string | null,
    setSessionId: React.Dispatch<SetStateAction<string | null>>
}

const SessionContext = createContext<SessionContextProps>({
    sessionId: null,
    setSessionId: () => null
});

interface SessionProviderProps {
    children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  return (
    <SessionContext.Provider value={{ sessionId, setSessionId }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);