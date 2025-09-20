import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { SignInProvider } from "@/contexts/signin-context";
import { PincodeProvider } from "@/contexts/pincode-context";
import Navbar from "@/components/navbar";
import SignInDialog from "@/components/sign-in";
import { PincodeDialog } from "@/components/pincode-dialog";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Amul Tracker",
  description: "Track Amul products and prices",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <SignInProvider>
            <PincodeProvider>
              <div className="bg-background min-h-screen">
                <Navbar />
                <main className="container mx-auto px-4 py-6">{children}</main>
                <SignInDialog />
                <PincodeDialog />
                <Toaster position="top-center" richColors />
              </div>
            </PincodeProvider>
          </SignInProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
