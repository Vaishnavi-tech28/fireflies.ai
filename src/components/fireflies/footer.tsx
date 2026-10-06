import { FireflyLogo } from "@/components/fireflies/firefly-logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background/80 px-4 py-4 md:px-6">
      <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <FireflyLogo className="h-5 w-5" />
          <span>
            Fireflies clone — meeting notes &amp; transcription demo.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Built with Next.js · Prisma · SQLite</span>
          <span className="hidden sm:inline">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
