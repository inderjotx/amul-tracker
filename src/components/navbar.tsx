"use client";

import { Button } from "@/components/ui/button";
import { useSignIn } from "@/contexts/signin-context";
import { usePincode } from "@/contexts/pincode-context";
import { useSession, signOut } from "@/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const { openSignIn } = useSignIn();
  const { openPincode } = usePincode();
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-foreground text-xl font-bold hover:opacity-80"
            >
              Amul Tracker
            </Link>
            <Link
              href="/products"
              className="text-foreground/80 hover:text-foreground text-lg font-medium transition-colors"
            >
              Products
            </Link>
          </div>

          {/* Right side - User profile or Sign in */}
          <div className="flex items-center space-x-4">
            {isPending ? (
              <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
            ) : session?.user ? (
              <>
                <Button
                  variant="outline"
                  className="h-8 px-3 text-sm"
                  onClick={openPincode}
                >
                  Set Location
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      className="relative h-8 w-8 rounded-full p-0"
                    >
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                          {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {session.user.name && (
                          <p className="font-medium">{session.user.name}</p>
                        )}
                        {session.user.email && (
                          <p className="text-muted-foreground w-[200px] truncate text-sm">
                            {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/products">Products</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                variant="default"
                className="h-8 px-4 text-sm"
                onClick={openSignIn}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
