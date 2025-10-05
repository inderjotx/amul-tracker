import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "./ui/button";

export const Footer = () => {
  return (
    <footer className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex items-center justify-center border-t pt-2 pb-4 backdrop-blur">
      <div className="flex items-center justify-center gap-4">
        <div>
          built by
          <Link
            className="text-primary font-bold underline"
            href="https://inderjot.xyz"
            target="_blank"
          >
            {" "}
            @inderjot
          </Link>
        </div>

        <Link
          href="https://github.com/inderjotx/amul-tracker"
          target="_blank"
          className="text-primary"
        >
          <Button className="rounded-full" size={"icon"}>
            <Github className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </footer>
  );
};
