"use client";

import { Button } from "@/components/ui/button";
import { useSignIn } from "@/contexts/signin-context";

// Example component showing how to use the sign-in context from anywhere in the app
export default function ExampleSignInUsage() {
  const { openSignIn } = useSignIn();

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">
        Example: Using Sign-In Context
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">
        This component demonstrates how to open the sign-in dialog from anywhere
        in the application.
      </p>
      <Button onClick={openSignIn}>Open Sign-In Dialog</Button>
    </div>
  );
}
