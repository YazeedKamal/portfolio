import type { FooterLogo } from "@/lib/types";
import { FooterPhysics } from "./FooterPhysics";

/** Footer — a Matter.js physics playground (logos that tumble and scatter away
 *  from the cursor) above a single centered credit line, divided by a hairline. */
export function Footer({ footerLogos = [] }: { footerLogos?: FooterLogo[] }) {
  return (
    <footer className="w-full bg-background text-foreground">
      <FooterPhysics logos={footerLogos} />
      <div className="flex w-full items-center justify-center border-t border-border px-6 py-6 text-sm text-muted-foreground">
        <p>❤️ Made with AI tools</p>
      </div>
    </footer>
  );
}
