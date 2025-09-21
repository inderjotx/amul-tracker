"use client";

import { useState } from "react";
import { usePincode } from "@/contexts/pincode-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { api } from "@/trpc/react";

export function PincodeDialog() {
  const { isOpen, closePincode } = usePincode();
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const utils = api.useUtils();

  const setPincodeMutation = api.products.setPincode.useMutation({
    onSuccess: () => {
      toast.success("Location set successfully!");
      void utils.products.getUserSession.invalidate();
      closePincode();
      setPincode("");
      setError(null);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async () => {
    if (pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    setError(null);
    setPincodeMutation.mutate({ pincode });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closePincode();
      setPincode("");
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Your Pincode</DialogTitle>
          <DialogDescription>
            Please enter your 6-digit pincode to set your delivery location and
            find nearby stores.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <InputOTP
            maxLength={6}
            value={pincode}
            onChange={setPincode}
            className="justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="text-destructive text-center text-sm">{error}</p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={setPincodeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={setPincodeMutation.isPending || pincode.length !== 6}
            className="w-full sm:w-auto"
          >
            {setPincodeMutation.isPending
              ? "Setting Location..."
              : "Set Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
