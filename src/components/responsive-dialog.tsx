"use client";

// Compatibility names share the canonical Dialog owner. DialogContent already
// switches to the padded bottom sheet on mobile; a second drawer path would
// bypass its spacing, accessibility, and forwarded content props.
export {
  Dialog as ResponsiveDialog,
  DialogTrigger as ResponsiveDialogTrigger,
  DialogContent as ResponsiveDialogContent,
  DialogHeader as ResponsiveDialogHeader,
  DialogTitle as ResponsiveDialogTitle,
  DialogDescription as ResponsiveDialogDescription,
  DialogFooter as ResponsiveDialogFooter,
  DialogClose as ResponsiveDialogClose,
} from "./dialog";
