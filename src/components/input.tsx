import * as React from "react"

import { cn } from "../lib/utils"
import { formControlVariants } from "./form-control-styles"

interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "inline";
}

function Input({ className, type, variant = "default", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      data-form-control={variant}
      className={cn(
        formControlVariants({ variant }),
        "file:text-foreground py-1 text-base file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input, type InputProps }
