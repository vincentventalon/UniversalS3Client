import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CrossBucketClipboard } from '../types';

interface ClipboardContextType {
  clipboardData: CrossBucketClipboard | null;
  setClipboardData: (data: CrossBucketClipboard | null) => void;
  clearClipboard: () => void;
  hasClipboardData: boolean;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

interface ClipboardProviderProps {
  children: ReactNode;
}

export function ClipboardProvider({ children }: ClipboardProviderProps) {
  const [clipboardData, setClipboardData] = useState<CrossBucketClipboard | null>(null);

  const clearClipboard = () => {
    setClipboardData(null);
  };

  const hasClipboardData = clipboardData !== null;

  return (
    <ClipboardContext.Provider value={{
      clipboardData,
      setClipboardData,
      clearClipboard,
      hasClipboardData
    }}>
      {children}
    </ClipboardContext.Provider>
  );
}

export function useClipboard() {
  const context = useContext(ClipboardContext);
  if (context === undefined) {
    throw new Error('useClipboard must be used within a ClipboardProvider');
  }
  return context;
}