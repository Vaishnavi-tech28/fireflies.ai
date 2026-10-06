import { cn } from "@/lib/utils";

// Firefly mark — a glowing firefly used as the product logo.
export function FireflyLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="ff-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* glow */}
      <circle cx="20" cy="14" r="9" fill="url(#ff-glow)" opacity="0.9" />
      {/* body */}
      <path
        d="M16.5 24.5c-2.5 1-5.5 0-5.5-3 0-2 1.5-3.5 1.5-5.5 0-2-1.5-3.5-1.5-5.5 0-3 3-4 5.5-3 2.5-1 5.5 0 5.5 3 0 2-1.5 3.5-1.5 5.5 0 2 1.5 3.5 1.5 5.5 0 3-3 4-5.5 3Z"
        fill="#1f2937"
      />
      {/* light */}
      <circle cx="22" cy="13" r="3.2" fill="#fde68a" />
      <circle cx="22" cy="13" r="3.2" fill="#fbbf24" opacity="0.55" />
    </svg>
  );
}

export function FireflyWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <FireflyLogo className="h-8 w-8" />
      <span className="text-lg font-bold tracking-tight">Fireflies</span>
    </div>
  );
}
