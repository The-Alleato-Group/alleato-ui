import * as React from "react";
import { UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";
import { cn } from "../lib/utils";

function initials(name: string) {
  // Only word-like parts count: "Megan Harrison (dev)" is MH, not "M(".
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => /^[\p{L}\p{N}]/u.test(part));
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : ""}`.toUpperCase();
}

export interface CommentAvatarProps {
  name: string;
  src?: string | null;
  size?: 24 | 28 | 32;
  className?: string;
}

/**
 * Shared circular identity mark for comment rows, composers, and mention lists.
 *
 * Initials fall back to the neutral `AvatarFallback` surface: a person is not
 * an accent, so no per-user color and no hex palette (DESIGN.md section 2).
 */
export function CommentAvatar({
  name,
  src,
  size = 32,
  className,
}: CommentAvatarProps) {
  const label = initials(name);

  return (
    <Avatar
      className={cn("shrink-0 rounded-full", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src ? <AvatarImage src={src} alt="" className="object-cover" /> : null}
      <AvatarFallback className="rounded-full text-xs font-semibold">
        {label || <UserRound className="size-3.5" />}
      </AvatarFallback>
    </Avatar>
  );
}
