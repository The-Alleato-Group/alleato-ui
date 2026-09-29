import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "../lib/utils"
import { formControlVariants } from "./form-control-styles"

export const buttonDisabledStateClasses =
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:opacity-100 disabled:hover:border-border disabled:hover:bg-muted disabled:hover:text-muted-foreground disabled:active:translate-y-0"

const buttonVariants = cva(
  `inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[var(--button-radius)] text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${buttonDisabledStateClasses} aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 data-[placeholder-style]:text-[hsl(var(--input-placeholder))] active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-']):not([class*='h-']):not([class*='w-'])]:size-4`,
  {
    variants: {
      variant: {
        // Near-ink, never orange (owner, 2026-09-17); tokens in globals.css.
        default:
          "bg-button-primary text-button-primary-foreground shadow-xs hover:bg-button-primary/90 active:bg-button-primary/80",
        // The one sanctioned orange button, and the only exception to the rule
        // above (owner, 2026-09-23: the sign-in button carries the brand, "it's
        // okay if this is different than the rest of the buttons on the site").
        // Unauthenticated surfaces only — sign-in, password reset. Inside the
        // app shell the labeled primary action stays near-ink.
        brand:
          "bg-primary text-primary-foreground shadow-xs hover:brightness-95 active:brightness-90",
        action:
          "bg-action text-action-foreground shadow-xs hover:bg-action/90 active:bg-action/80 focus-visible:ring-action/25",
        inverse:
          "bg-foreground text-background shadow-xs hover:bg-foreground/90 active:bg-foreground/80",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/95 active:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border bg-card text-foreground shadow-none hover:border-foreground/15 hover:bg-muted/80 active:bg-muted dark:bg-input/30 dark:hover:bg-input/50 [&[role=combobox]]:rounded-md [&[role=combobox]]:border [&[role=combobox]]:border-input [&[role=combobox]]:bg-background [&[role=combobox]]:shadow-none [&[role=combobox]]:hover:border-input [&[role=combobox]]:hover:bg-background [&[role=combobox]]:hover:text-foreground [&[role=combobox]]:active:translate-y-0 [&[role=combobox]]:dark:hover:bg-input/30",
        control: `${formControlVariants()} hover:bg-background hover:text-foreground active:translate-y-0`,
        secondary:
          "bg-secondary text-secondary-foreground shadow-none hover:bg-secondary/90 active:bg-secondary/80",
        ghost:
          "border-0 text-muted-foreground shadow-none hover:bg-muted hover:text-foreground active:bg-muted/80 dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        control: "",
        "control-icon": "size-11 px-0",
      },
    },
    // An icon-only ghost button is a glyph, not a chip: it changes colour on
    // hover and never grows a background (owner rule, 2026-09-12 — "there is
    // no background color on hover for icons like that").
    compoundVariants: [
      {
        variant: "ghost",
        size: ["icon", "icon-xs", "icon-sm", "icon-lg", "control-icon"],
        className:
          "hover:bg-transparent active:bg-transparent dark:hover:bg-transparent",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({
  className,
  variant: variantProp,
  size: sizeProp,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  // A combobox trigger is a form control, not a button: it sits in a row with
  // Input/Select/DateField and must share their height, padding, radius and
  // border. Callers historically hand-rolled this (h-7/h-9/h-11/min-h-10 across
  // 28 call sites), so the sizing is owned here rather than at the call site.
  // An explicit `size` still wins, for deliberately dense contexts.
  const isComboboxTrigger = props.role === "combobox"
  const usesControlSizing =
    isComboboxTrigger && (variantProp === undefined || variantProp === "outline")

  const variant = usesControlSizing ? "control" : (variantProp ?? "default")
  const size = sizeProp ?? (usesControlSizing ? "control" : "default")

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants, type ButtonProps }
