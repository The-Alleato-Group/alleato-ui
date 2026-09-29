"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/utils";
import { titleCase } from "../lib/title-case";

type SectionHeaderAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

interface SectionHeaderProps {
  title: string;
  action?: SectionHeaderAction | ReactNode;
  className?: string;
}

// Distinguish structured actions from arbitrary React nodes at runtime.
function isSectionHeaderAction(
  action: SectionHeaderProps["action"],
): action is SectionHeaderAction {
  return typeof action === "object" && action !== null && "label" in action;
}

export function SectionHeader({
  title,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          {typeof title === "string" ? titleCase(title) : title}
        </h2>
      </div>
      {action &&
        (isSectionHeaderAction(action) ? (
          action.onClick ? (
            // eslint-disable-next-line design-system/no-design-violations -- minimal inline link-style action
            <button
              type="button"
              onClick={action.onClick}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {action.label}
            </button>
          ) : (
            <a
              href={action.href}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {action.label}
            </a>
          )
        ) : (
          action
        ))}
    </div>
  );
}
