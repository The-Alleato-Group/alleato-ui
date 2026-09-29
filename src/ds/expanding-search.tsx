"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../components/button";
import { Input } from "../components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/tooltip";

// ---------------------------------------------------------------------------
// ExpandingSearch — THE search pattern for this codebase.
//
// Renders as a Search icon. Click → expands to an input. ESC clears and
// collapses; blur-while-empty collapses. This is the ONLY permitted search
// input in pages, tables and detail views. Raw <Input placeholder="Search...">
// is banned by ESLint (design-system/no-raw-search-input).
//
// This is the merge of two components that did the same job. `ExpandableSearch`
// (components/tables/unified) had 35 call sites to this one's 2, so the rule
// could be obeyed and violated at the same time — a page using the "wrong"
// expanding search looked identical to one using the right one. Every prop
// ExpandingSearch accepted is supported here, so its call sites move over
// unchanged; that path is now a deprecated re-export of this component.
// ---------------------------------------------------------------------------

export interface ExpandingSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible name for the trigger and the input. */
  ariaLabel?: string;
  /** Force the input open (e.g. when value is non-empty on mount). */
  defaultExpanded?: boolean;
  /** When false the input is always open — for toolbars that own the space. */
  collapsible?: boolean;
  className?: string;
  inputClassName?: string;
  triggerClassName?: string;
}

export function ExpandingSearch({
  value,
  onChange,
  placeholder = "Search...",
  ariaLabel = "Search",
  defaultExpanded = false,
  collapsible = true,
  className,
  inputClassName,
  triggerClassName,
}: ExpandingSearchProps) {
  const [expanded, setExpanded] = React.useState(
    defaultExpanded || !collapsible || value.length > 0,
  );
  const inputRef = React.useRef<HTMLInputElement>(null);

  // A non-collapsible instance must never be left closed, even if a caller
  // flips `collapsible` at runtime.
  React.useEffect(() => {
    if (!collapsible) setExpanded(true);
  }, [collapsible]);

  // An externally-set query (restored filter, deep link) must reveal itself.
  React.useEffect(() => {
    if (value.length > 0) setExpanded(true);
  }, [value]);

  function expand() {
    setExpanded(true);
    // Let the DOM update before focusing.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function collapse() {
    if (!collapsible || value.length > 0) return; // keep open while there is a query
    setExpanded(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      onChange("");
      if (collapsible) setExpanded(false);
    }
  }

  function clear(event: React.MouseEvent) {
    event.stopPropagation();
    onChange("");
    inputRef.current?.focus();
  }

  if (collapsible && !expanded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={expand}
              aria-label={ariaLabel}
              className={cn("h-8 w-8 text-muted-foreground", triggerClassName, className)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <div className="relative flex w-full items-center animate-in slide-in-from-left-2 duration-200">
        <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={collapse}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn(
            collapsible ? "h-8 w-52 pl-8 pr-7 text-sm" : "h-8 w-full pl-8 pr-7 text-sm",
            inputClassName,
          )}
        />
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onMouseDown={clear}
            aria-label="Clear search"
            className="absolute right-1 h-6 w-6 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
