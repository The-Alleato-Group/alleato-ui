"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";
import { cn } from "../lib/utils";
import styles from "./premium.module.css";

export type MediaCardProps = Omit<
  React.ComponentProps<"article">,
  "children" | "title"
> & {
  title: string;
  subtitle?: string;
  metadata?: React.ReactNode;
  image: { src: string; alt: string };
  href: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
};

export function MediaCard({
  title,
  subtitle,
  metadata,
  image,
  href,
  badge,
  action,
  className,
  ...props
}: MediaCardProps) {
  const [failedSrc, setFailedSrc] = React.useState<string>();
  const failed = failedSrc === image.src;
  return (
    <article {...props} className={cn(styles.media, "min-w-0", className)}>
      <a
        href={href}
        className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
          {failed ? (
            <span
              role="img"
              aria-label={image.alt || "Image unavailable"}
              className="flex h-full items-center justify-center text-muted-foreground"
            >
              <ImageOff aria-hidden="true" className="size-8" />
            </span>
          ) : (
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              width={640}
              height={640}
              onError={() => setFailedSrc(image.src)}
              className={cn(styles.image, "h-full w-full object-cover")}
            />
          )}
          {badge && (
            <span className="absolute left-3 top-3 rounded-full bg-background px-3 py-1 text-sm font-medium text-foreground shadow-sm">
              {badge}
            </span>
          )}
        </div>
        <div className="grid gap-1 pt-3">
          <h3 className="pr-1 text-base font-semibold leading-snug">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {metadata && <div className="text-sm">{metadata}</div>}
        </div>
      </a>
      {action && <div className="absolute right-2 top-2">{action}</div>}
    </article>
  );
}
