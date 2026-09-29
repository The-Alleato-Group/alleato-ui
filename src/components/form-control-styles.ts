import { cva, type VariantProps } from "class-variance-authority";

/**
 * Compact, muted surface shared by site-header selectors and table-toolbar
 * selects. These controls change the current view; they are not form fields.
 */
const compactSurfaceControlClassName =
  "justify-between gap-1.5 rounded-md border-0 bg-muted/50 px-2.5 shadow-none hover:bg-muted focus-visible:border-transparent focus-visible:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-muted/80 data-[state=open]:text-foreground [&_svg]:transition-colors hover:[&_svg]:text-foreground data-[state=open]:[&_svg]:text-foreground";

/**
 * Shared visual contract for input-like controls and semantic control triggers.
 *
 * Keep interaction semantics in the owning component. This utility only owns
 * the visual states that must remain aligned across inputs, selects, and date
 * triggers.
 */
const formControlVariants = cva(
  "placeholder:text-[hsl(var(--input-placeholder))] data-[placeholder]:text-[hsl(var(--input-placeholder))] data-[placeholder=true]:text-[hsl(var(--input-placeholder))] w-full min-w-0 rounded-md border border-input bg-background px-4 font-normal shadow-none transition-colors outline-none focus-visible:border-input focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "",
        inline:
          "border-0 !bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-ring",
        table: compactSurfaceControlClassName,
      },
      size: {
        default: "h-11",
        sm: "h-9 sm:h-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type FormControlVariantProps = VariantProps<typeof formControlVariants>;

export {
  compactSurfaceControlClassName,
  formControlVariants,
  type FormControlVariantProps,
};
