import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-neon-green bg-primary text-primary-foreground hover:bg-primary/80 glow-effect neon-border",
        secondary:
          "border-neon-blue bg-neon-blue text-black hover:bg-neon-blue/80 glow-effect neon-border",
        destructive:
          "border-orange-500 bg-orange-500 text-white hover:bg-orange-600 glow-effect neon-border",
        outline: "text-neon-green border-neon-green neon-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
