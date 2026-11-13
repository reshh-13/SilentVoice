"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export interface ProgressBarProps {
  value: number // 0 to 100
  max?: number
  className?: string
  colorClass?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  colorClass = "bg-primary",
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      className={cn(
        "w-full h-2.5 bg-foreground/10 rounded-full overflow-hidden relative",
        className
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn("h-full rounded-full", colorClass)}
      />
    </div>
  )
}
