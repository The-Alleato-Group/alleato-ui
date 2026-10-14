"use client";

import * as React from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, MoreVertical, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/tooltip";
import { cn } from "../lib/utils";
import { Button } from "../components/button";
import { TableIconButton } from "./table-icon-button";

/**
 * A single short create label across table pages. The specific record name
 * belongs in the accessible label and the surrounding page title.
 */
const ADD_BUTTON_CLASSNAME =
  "h-11 w-11 shrink-0 rounded-md p-0 xl:h-8 xl:w-auto xl:px-3";

export interface TablePageActionItem {
  label: string;
  testId?: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  destructive?: boolean;
}

export interface TablePageActionsProps {
  /**
   * Add action(s). One entry is a direct New button. Multiple entries expose
   * a New menu, with the chevron to the right of the label.
   */
  addOptions?: TablePageActionItem[];
  /** Short visible verb when New is misleading (for example, Upload or Grant). */
  buttonLabel?: string;
  /**
   * Accessible label for the add control (aria-label + hover tooltip). Used for
   * the multi-option button; the single-option button uses its own item label.
   * Default: "New".
   */
  addLabel?: string;
  /** Stable hook for the create trigger across single and menu variants. */
  testId?: string;
  /**
   * Items shown in the vertical 3-dot "More" menu. When omitted the menu is hidden.
   * Use this for secondary table actions (Import, Export, Bulk delete, etc).
   */
  moreOptions?: TablePageActionItem[];
  className?: string;
}

/** An enabled item with an href navigates; a disabled one never links. */
function itemHref(item: TablePageActionItem): string | null {
  return item.href && !item.disabled ? item.href : null;
}

function renderItem(item: TablePageActionItem, key: string): ReactNode {
  const href = itemHref(item);
  const content = (
    <>
      {item.icon ? (
        <span className="mr-2 flex h-4 w-4 items-center justify-center">
          {item.icon}
        </span>
      ) : null}
      {item.label}
    </>
  );
  return (
    <DropdownMenuItem
      key={key}
      asChild={href !== null}
      disabled={item.disabled}
      onClick={item.onClick}
      data-testid={item.testId}
      className={cn(
        item.destructive && "text-destructive focus:text-destructive",
      )}
    >
      {href !== null ? <Link href={href}>{content}</Link> : content}
    </DropdownMenuItem>
  );
}

/**
 * Standard table-page header actions: a compact New button and an optional
 * vertical 3-dot menu for secondary actions.
 *
 * `UnifiedTablePage` renders this from `header.create`, so each page describes
 * its creation paths without painting another header button.
 *
 * @example
 * <UnifiedTablePage
 *   header={{
 *     title: "Companies",
 *     create: {
 *         options: [
 *           { label: "Add New Company", icon: <Building2 />, onClick: handleAdd },
 *           { label: "Import from CSV", icon: <FileSpreadsheet />, onClick: handleImport },
 *         ],
 *     },
 *   }}
 * />
 */
export function TablePageActions({
  addOptions,
  buttonLabel = "New",
  addLabel = "New",
  testId,
  moreOptions,
  className,
}: TablePageActionsProps): React.ReactElement | null {
  const hasAdd = Array.isArray(addOptions) && addOptions.length > 0;
  const hasMore = Array.isArray(moreOptions) && moreOptions.length > 0;
  if (!hasAdd && !hasMore) return null;

  const singleAdd = hasAdd && addOptions!.length === 1 ? addOptions![0] : null;
  const singleAddHref = singleAdd ? itemHref(singleAdd) : null;
  const singleAddContent = singleAdd ? (
    <>
      {singleAdd.icon ? (
        <span className="flex h-4 w-4 items-center justify-center xl:hidden" aria-hidden>
          {singleAdd.icon}
        </span>
      ) : (
        <Plus className="h-4 w-4 xl:hidden" aria-hidden />
      )}
      <span className="hidden xl:inline">{buttonLabel}</span>
    </>
  ) : null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {hasAdd &&
        (singleAdd ? (
          // One action has no menu affordance; the record name stays accessible.
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* An href option is a link: a button with no onClick did nothing. */}
                <Button
                  asChild={singleAddHref !== null}
                  data-keep-text
                  data-testid={singleAdd.testId ?? testId}
                  className={ADD_BUTTON_CLASSNAME}
                  onClick={singleAdd.onClick}
                  aria-label={singleAdd.label}
                  disabled={singleAddHref === null ? singleAdd.disabled : undefined}
                >
                  {singleAddHref !== null ? (
                    <Link href={singleAddHref}>{singleAddContent}</Link>
                  ) : (
                    singleAddContent
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{singleAdd.label}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          // Multiple creation paths earn the chevron; it never opens a dead menu.
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      data-keep-text
                      data-testid={testId}
                      className={ADD_BUTTON_CLASSNAME}
                      aria-label={addLabel}
                    >
                      <Plus className="h-4 w-4 xl:hidden" aria-hidden />
                      <span className="hidden xl:inline">{buttonLabel}</span>
                      <ChevronDown
                        className="!h-3 !w-3 opacity-70"
                        aria-hidden
                      />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{addLabel}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="w-56">
              {addOptions!.map((item, index) =>
                renderItem(item, `add-${index}`),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}

      {hasMore && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TableIconButton
              data-keep-text
              className="h-8 w-8 shrink-0 p-0"
              aria-label="More actions"
            >
              <MoreVertical />
            </TableIconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {moreOptions!.map((item, index) => {
              if (item.label === "---") {
                return <DropdownMenuSeparator key={`sep-${index}`} />;
              }
              return renderItem(item, `more-${index}`);
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
