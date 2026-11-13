"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { LogIn, Mail, Lock, AlertCircle, Sparkles, RefreshCw } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function LoginPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const { login, isFallback, user } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (user) {
      router.push("/translate")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill out all fields.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await login(email, password)
      router.push("/translate")
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Invalid email or password.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center -mt-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border border-foreground/5 shadow-xl glass-card">
          <CardHeader className="pb-4 border-b border-foreground/5 flex flex-col gap-2 items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-accent flex items-center justify-center">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Sign In</CardTitle>
              <CardDescription>Enter your credential keys to open your sandbox</CardDescription>
            </div>
            {isFallback && (
              <Badge className="bg-primary/20 text-accent border border-primary/30 rounded-full text-[10px] flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Demo Sandbox Mode Active
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 rounded-xl text-red-500 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isFallback && (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-[11px] text-foreground/60 leading-relaxed">
                  <strong>Testing Tip:</strong> Standard auth parameters are offline. You can input any credentials (e.g. <code>test@test.com</code> / <code>123456</code>) to log in!
                </div>
              )}

              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-foreground/55 uppercase tracking-wider font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-foreground/35" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@school.edu"
                    className="w-full h-10.5 pl-10 pr-4 bg-background/50 border border-foreground/8 rounded-full text-sm placeholder-foreground/35 outline-hidden focus:border-primary/50 focus:ring-4 focus:ring-primary/8 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 relative">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-foreground/55 uppercase tracking-wider font-mono">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-accent hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-foreground/35" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10.5 pl-10 pr-4 bg-background/50 border border-foreground/8 rounded-full text-sm placeholder-foreground/35 outline-hidden focus:border-primary/50 focus:ring-4 focus:ring-primary/8 transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-10.5 rounded-full bg-primary hover:bg-accent text-primary-foreground font-semibold shadow-xs mt-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pb-6 pt-4 border-t border-foreground/5 flex justify-center text-xs">
            <span className="text-foreground/50">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-accent hover:underline font-semibold">
                Sign Up
              </Link>
            </span>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
