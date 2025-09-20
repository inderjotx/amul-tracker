"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SignInContextType {
  isOpen: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
}

const SignInContext = createContext<SignInContextType | undefined>(undefined);

export function useSignIn() {
  const context = useContext(SignInContext);
  if (context === undefined) {
    throw new Error("useSignIn must be used within a SignInProvider");
  }
  return context;
}

interface SignInProviderProps {
  children: ReactNode;
}

export function SignInProvider({ children }: SignInProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openSignIn = () => setIsOpen(true);
  const closeSignIn = () => setIsOpen(false);

  return (
    <SignInContext.Provider value={{ isOpen, openSignIn, closeSignIn }}>
      {children}
    </SignInContext.Provider>
  );
}
