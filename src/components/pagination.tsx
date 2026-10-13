"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";

type SimplePaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * Records across every page. With `perPage` the label reads
   * "26–50 of 340"; without it the label falls back to "Page 2 of 14" rather
   * than guessing a count from the page math.
   */
  totalItems?: number;
  perPage?: number;
  className?: string;
};

/**
 * Record range plus previous/next arrows: "26–50 of 340 ‹ ›".
 *
 * No numbered page buttons, no first/last jumps (2026-10-13, after a Mobbin
 * review of Sentry, Squarespace, Navattic and Vercel tables): the count is the
 * one fact the table cannot show by itself, and the arrows are the one action.
 */
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  perPage,
  className,
}: SimplePaginationProps) {
  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}
    >
      <span className="mr-2 whitespace-nowrap tabular-nums" aria-live="polite">
        {formatPaginationRange({ currentPage, totalPages, totalItems, perPage })}
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage <= 1}
        aria-label="Previous page"
        onClick={() => onPageChange(currentPage - 1)}
        className="size-8 p-0 text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage >= totalPages}
        aria-label="Next page"
        onClick={() => onPageChange(currentPage + 1)}
        className="size-8 p-0 text-muted-foreground"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}

export function formatPaginationRange({
  currentPage,
  totalPages,
  totalItems,
  perPage,
}: {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  perPage?: number;
}): string {
  if (totalItems === undefined || perPage === undefined) {
    return `Page ${currentPage} of ${totalPages}`;
  }
  if (totalItems === 0) return "0 of 0";
  const first = Math.min((currentPage - 1) * perPage + 1, totalItems);
  const last = Math.min(currentPage * perPage, totalItems);
  return `${first.toLocaleString("en-US")}–${last.toLocaleString("en-US")} of ${totalItems.toLocaleString("en-US")}`;
}

// Composable Pagination Components (shadcn style)
const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<"a">;

const PaginationLink = ({
  className,
  isActive,
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "inline-flex items-center justify-center text-sm transition-colors px-2 py-1 min-w-[2rem] rounded",
      // Active page is marked by color and weight only; never a filled or bordered background.
      isActive
        ? "font-semibold text-primary"
        : "font-medium text-muted-foreground hover:text-foreground",
      className
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
