"use client";

import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/fireflies/format";

type Props = {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export function UserAvatar({ name, color, size = "md", className }: Props) {
  const bg = color || "#f59e0b";
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm ring-1 ring-black/5",
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
