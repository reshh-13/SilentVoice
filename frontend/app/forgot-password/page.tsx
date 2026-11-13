"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Key, Mail, ArrowLeft, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please specify your email address.")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not dispatch recovery link.")
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
              <Key className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a password recovery link</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {success ? (
              <div className="flex flex-col items-center gap-4 text-center py-2">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Recovery Email Dispatched</h4>
                  <p className="text-xs text-foreground/50 mt-1 max-w-xs leading-relaxed">
                    Check your inbox at <strong>{email}</strong> for instructions to configure your password.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 rounded-xl text-red-500 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
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

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10.5 rounded-full bg-primary hover:bg-accent text-primary-foreground font-semibold shadow-xs mt-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Dispatching link...
                    </>
                  ) : (
                    "Send Recovery Link"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="pb-6 pt-4 border-t border-foreground/5 flex justify-center text-xs">
            <Link href="/login" className="text-foreground/50 hover:text-foreground flex items-center gap-1.5 font-medium transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Login
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
