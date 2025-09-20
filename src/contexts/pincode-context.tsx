"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PincodeContextType {
  isOpen: boolean;
  openPincode: () => void;
  closePincode: () => void;
}

const PincodeContext = createContext<PincodeContextType | undefined>(undefined);

export function usePincode() {
  const context = useContext(PincodeContext);
  if (context === undefined) {
    throw new Error("usePincode must be used within a PincodeProvider");
  }
  return context;
}

interface PincodeProviderProps {
  children: ReactNode;
}

export function PincodeProvider({ children }: PincodeProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openPincode = () => setIsOpen(true);
  const closePincode = () => setIsOpen(false);

  return (
    <PincodeContext.Provider value={{ isOpen, openPincode, closePincode }}>
      {children}
    </PincodeContext.Provider>
  );
}
