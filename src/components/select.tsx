"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "../lib/utils";
import { formControlVariants } from "./form-control-styles";

/**
 * Label of the currently-selected item, resolved during render so the trigger
 * paints it in its very first commit — including on the server.
 *
 * Radix does NOT render the selected label itself. A bare `<SelectValue />`
 * renders nothing of its own; the label arrives through a side channel:
 * `SelectContent` mounts its (closed) children into a detached DocumentFragment
 * and `SelectItemText` portals the selected item's children into the trigger's
 * value node. That channel needs two layout effects to have run — the fragment
 * is created in one (`SelectContent` returns `null` before it exists) and the
 * value node is captured in another — so the trigger can paint EMPTY even
 * though `value` is set. On the server layout effects never run at all, so
 * server-rendered HTML always ships a blank trigger.
 *
 * When a label is resolved, `SelectValue` renders a plain React-owned span
 * instead of registering Radix's value node. Radix therefore has no portal
 * target for `SelectItemText`, so it cannot move the option's text node into
 * the trigger and race React when the selected value changes during mount.
 * Placeholder-only and unresolved values still use Radix's value primitive.
 */
const SelectValueLabelContext = React.createContext<React.ReactNode>(undefined);

/**
 * Find the `children` of the `SelectItem` whose `value` matches, by walking the
 * element tree we were handed. Returns `undefined` when the item isn't a literal
 * descendant (e.g. it lives inside a caller's own component), in which case
 * `SelectValue` falls back to Radix's portal — never worse than before.
 */
function findSelectedItemLabel(
  node: React.ReactNode,
  value: string,
): React.ReactNode {
  let found: React.ReactNode;

  React.Children.forEach(node, (child) => {
    if (found !== undefined || !React.isValidElement(child)) return;

    const childProps = child.props as {
      value?: unknown;
      children?: React.ReactNode;
    };

    if (
      (child.type === SelectItem || child.type === SelectPrimitive.Item) &&
      childProps.value === value
    ) {
      found = childProps.children;
      return;
    }

    if (childProps.children !== undefined) {
      found = findSelectedItemLabel(childProps.children, value);
    }
  });

  return found;
}

function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  // Mirror the value for uncontrolled Selects purely so we can resolve a label;
  // Radix stays the source of truth for selection itself.
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  // An empty value must stay empty so the placeholder (and its
  // `data-placeholder` styling) still wins.
  const selectedLabel = React.useMemo(
    () =>
      currentValue === undefined || currentValue === ""
        ? undefined
        : findSelectedItemLabel(children, currentValue),
    [children, currentValue],
  );

  return (
    <SelectValueLabelContext.Provider value={selectedLabel}>
      <SelectPrimitive.Root
        data-slot="select"
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectValueLabelContext.Provider>
  );
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  children,
  placeholder,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  const resolvedLabel = React.useContext(SelectValueLabelContext);
  // Explicit children always win — a caller that passes its own label owns it.
  const content = children !== undefined ? children : resolvedLabel;

  if (content !== undefined) {
    const { asChild: _asChild, ...spanProps } = props;

    return (
      <span
        {...(spanProps as React.ComponentProps<"span">)}
        data-slot="select-value"
        data-select-value-owner="react"
      >
        {content}
      </span>
    );
  }

  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      placeholder={placeholder}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = "default",
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
  /**
   * `table` is the compact muted trigger used for view controls in a table
   * toolbar. Form selects should keep the default field treatment.
   */
  variant?: "default" | "inline" | "table";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-variant={variant}
      data-form-control={variant === "table" ? undefined : variant}
      data-table-control={variant === "table" ? "" : undefined}
      className={cn(
        formControlVariants({ variant, size }),
        "[&_svg:not([class*='text-'])]:text-muted-foreground flex items-center justify-between gap-2 text-sm",
        size === "default" && "py-2",
        "*:data-[slot=select-value]:truncate *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-[100] max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-sm",
          position === "popper" &&
            "data-[side=bottom]:translate-y-0 data-[side=left]:-translate-x-0 data-[side=right]:translate-x-0 data-[side=top]:-translate-y-0",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
