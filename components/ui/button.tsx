import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-primary",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90",
        destructive:
          "bg-red-500 text-white hover:bg-red-500/90 dark:bg-red-900 dark:text-white dark:hover:bg-red-900/90",
        outline:
          "border border-primary/20 bg-white hover:bg-primary/5 hover:text-primary dark:border-primary/30 dark:bg-slate-950 dark:hover:bg-primary/10 dark:hover:text-primary",
        secondary:
          "bg-secondary text-white hover:bg-secondary/80 dark:bg-secondary dark:text-white dark:hover:bg-secondary/80",
        accent:
          "bg-accent text-white hover:bg-accent/80 dark:bg-accent dark:text-white dark:hover:bg-accent/80",
        ghost: "hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline dark:text-primary",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
