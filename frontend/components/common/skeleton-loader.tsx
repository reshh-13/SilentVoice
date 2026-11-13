import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular"
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = "rectangular",
  ...props
}) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-foreground/10",
        {
          "h-4 w-full rounded-sm": variant === "text",
          "rounded-2xl": variant === "rectangular",
          "rounded-full": variant === "circular",
        },
        className
      )}
      {...props}
    />
  )
}
