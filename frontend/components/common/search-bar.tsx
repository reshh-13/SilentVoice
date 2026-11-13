"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onSearch, onChange, ...props }, ref) => {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e)
      if (onSearch) onSearch(e.target.value)
    }

    return (
      <div className="relative flex items-center w-full max-w-md">
        <span className="absolute left-4 text-foreground/40">
          <Search className="h-4.5 w-4.5" />
        </span>
        <input
          type="text"
          ref={ref}
          onChange={handleSearchChange}
          className={cn(
            "w-full h-11 pl-11 pr-4 bg-background/50 backdrop-blur-md border border-foreground/8 text-sm rounded-full text-foreground placeholder-foreground/45 transition-all outline-hidden focus:border-primary/50 focus:ring-4 focus:ring-primary/8 shadow-xs",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

SearchBar.displayName = "SearchBar"
