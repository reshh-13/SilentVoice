"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { LoadingSpinner } from "@/components/common/loading-spinner"

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size={36} />
        <span className="text-sm font-semibold text-foreground/45">Authenticating session...</span>
      </div>
    )
  }

  if (!user) {
    return null // Return nothing while redirecting
  }

  return <>{children}</>
}
