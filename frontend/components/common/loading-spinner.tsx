import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoadingSpinnerProps {
  className?: string
  size?: number
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = 24,
}) => {
  return (
    <div className="flex items-center justify-center">
      <Loader2
        style={{ width: size, height: size }}
        className={cn("animate-spin text-primary/80", className)}
      />
    </div>
  )
}
