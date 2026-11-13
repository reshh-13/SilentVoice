"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Volume2,
  Trash2,
  Calendar,
  FileDown,
  Search,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  Inbox,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/common/search-bar"
import { SectionHeader } from "@/components/common/section-header"
import { ProtectedRoute } from "@/components/common/protected-route"
import { useAuth } from "@/context/auth-context"
import { LoadingSpinner } from "@/components/common/loading-spinner"

interface HistoryEntry {
  id: string
  timestamp: string
  phrase: string
  translation: string
  confidence: number
  durationSeconds: number
}

const initialHistory: HistoryEntry[] = [
  {
    id: "hist-1",
    timestamp: "Aug 5, 2026 14:32",
    phrase: "HELLO WORLD",
    translation: "Hello World",
    confidence: 96,
    durationSeconds: 3.5,
  },
  {
    id: "hist-2",
    timestamp: "Aug 5, 2026 12:15",
    phrase: "MY NAME IS ALEX",
    translation: "My name is Alex",
    confidence: 89,
    durationSeconds: 5.2,
  },
  {
    id: "hist-3",
    timestamp: "Aug 4, 2026 18:40",
    phrase: "HOW ARE YOU",
    translation: "How are you?",
    confidence: 94,
    durationSeconds: 2.8,
  },
  {
    id: "hist-4",
    timestamp: "Aug 4, 2026 10:05",
    phrase: "I NEED ASSISTANCE",
    translation: "I need assistance",
    confidence: 91,
    durationSeconds: 4.1,
  },
  {
    id: "hist-5",
    timestamp: "Aug 3, 2026 15:55",
    phrase: "THANK YOU",
    translation: "Thank you",
    confidence: 98,
    durationSeconds: 1.9,
  },
]

export default function HistoryPage() {
  const { user, getToken } = useAuth()
  const [history, setHistory] = React.useState<HistoryEntry[]>([])
  const [loadingLogs, setLoadingLogs] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [confidenceFilter, setConfidenceFilter] = React.useState<"all" | "high" | "standard">("all")

  React.useEffect(() => {
    const loadHistory = async () => {
      if (!user) return
      setLoadingLogs(true)
      setErrorMsg(null)
      try {
        const token = await getToken()
        if (!token) throw new Error("Authentication session failed")
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/user/history`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
        
        if (!response.ok) throw new Error("Could not load translation logs")
        
        const data = await response.json()
        
        const formatted = data.map((item: { id?: string; timestamp?: string; phrase: string; translation: string; confidence: number; durationSeconds?: number; duration?: number }, index: number) => ({
          id: item.id || `hist-${index}`,
          timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
          }) : "Unknown Date",
          phrase: item.phrase,
          translation: item.translation,
          confidence: item.confidence,
          durationSeconds: item.durationSeconds || item.duration || 4.2
        }))
        
        setHistory(formatted)
      } catch (e: unknown) {
        console.error(e)
        setErrorMsg(e instanceof Error ? e.message : "Failed to load translation logs.")
      } finally {
        setLoadingLogs(false)
      }
    }
    
    loadHistory()
  }, [user, getToken])

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken()
      if (!token) throw new Error("Unauthenticated session")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/user/history/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error("Failed to delete record")
      
      setHistory((prev) => prev.filter((item) => item.id !== id))
    } catch (e: unknown) {
      console.error(e)
      alert(e instanceof Error ? e.message : "Could not delete history item.")
    }
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    }
  }

  const exportHistory = () => {
    const dataString = history
      .map((h) => `${h.timestamp} | ASL: ${h.phrase} | English: ${h.translation} | Conf: ${h.confidence}%`)
      .join("\n")
    const element = document.createElement("a")
    const file = new Blob([dataString], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "silent-voice-translation-history.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesConfidence =
      confidenceFilter === "all" ||
      (confidenceFilter === "high" && item.confidence >= 92) ||
      (confidenceFilter === "standard" && item.confidence < 92)

    return matchesSearch && matchesConfidence
  })

  return (
    <ProtectedRoute>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8"
      >
      <SectionHeader
        title="Translation Logs"
        description="Verify history log archives, repeat audio playback, and export translation sessions to external files."
        action={
          <div className="flex gap-3">
            <SearchBar
              placeholder="Search phrases..."
              onSearch={setSearchQuery}
            />
            <Button
              variant="outline"
              onClick={exportHistory}
              disabled={history.length === 0}
              className="rounded-full border-foreground/15 text-foreground/75 hidden md:flex items-center gap-1.5 h-11 px-5 font-semibold text-xs transition-colors"
            >
              <FileDown className="h-4 w-4" />
              Export History
            </Button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-foreground/5 pb-2">
        <span className="text-xs font-bold text-foreground/45 flex items-center gap-1.5 mr-2">
          <Filter className="h-3.5 w-3.5" />
          Filter Confidence:
        </span>
        <Button
          variant={confidenceFilter === "all" ? "default" : "outline"}
          onClick={() => setConfidenceFilter("all")}
          className="rounded-full h-8 px-4 text-xs font-semibold"
        >
          All Entries
        </Button>
        <Button
          variant={confidenceFilter === "high" ? "default" : "outline"}
          onClick={() => setConfidenceFilter("high")}
          className="rounded-full h-8 px-4 text-xs font-semibold"
        >
          High (&gt;= 92%)
        </Button>
        <Button
          variant={confidenceFilter === "standard" ? "default" : "outline"}
          onClick={() => setConfidenceFilter("standard")}
          className="rounded-full h-8 px-4 text-xs font-semibold"
        >
          Standard (&lt; 92%)
        </Button>
      </div>

      {loadingLogs ? (
        <div className="min-h-[25vh] flex flex-col items-center justify-center gap-3">
          <LoadingSpinner size={28} />
          <span className="text-xs text-foreground/45">Loading translation logs...</span>
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-red-500/10 border border-red-500/15 rounded-xl text-red-500 text-xs text-center max-w-sm mx-auto shadow-xs">
          {errorMsg}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => {
                const isHighConfidence = item.confidence >= 92

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ y: -3 }}
                  >
                    <Card className="h-full flex flex-col justify-between border border-foreground/5 shadow-md">
                      <CardHeader className="bg-foreground/[0.01] border-b border-foreground/5 p-5 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-foreground/50 font-semibold flex items-center gap-1.5 font-mono">
                            <Calendar className="h-3.5 w-3.5 text-foreground/40" />
                            {item.timestamp}
                          </span>
                          <Badge
                            variant={isHighConfidence ? "success" : "default"}
                            className="rounded-full px-2.5 text-[10px] font-bold"
                          >
                            {item.confidence}% Match
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/35 font-mono">
                            ASL Sign Gesture Input
                          </span>
                          <CardTitle className="text-lg font-bold text-foreground tracking-wide font-sans mt-0.5">
                            {item.phrase}
                          </CardTitle>
                        </div>

                        <div className="flex flex-col gap-1 border-t border-foreground/5 pt-3 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/35 font-mono">
                            English Translation
                          </span>
                          <p className="text-sm font-semibold text-accent leading-relaxed">
                            {item.translation}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="p-5 pt-3 border-t border-foreground/5 flex items-center justify-between">
                        <span className="text-xs text-foreground/45 font-mono">
                          Gesture Stream: {item.durationSeconds}s
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => speakText(item.translation)}
                            className="rounded-full h-8 w-8 text-primary hover:bg-primary/10"
                            title="Speak Translation"
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="rounded-full h-8 w-8 text-red-500 hover:bg-red-500/10"
                            title="Delete Log"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )
              })
            ) : (
              <motion.div
                layout
                className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-foreground/3 border border-foreground/5 flex items-center justify-center text-foreground/30 relative shadow-inner">
                  <Inbox className="h-8 w-8" />
                </div>
                <div className="flex flex-col gap-1 max-w-xs mx-auto">
                  <h4 className="font-heading text-lg font-bold text-foreground">No Logs Found</h4>
                  <p className="text-sm text-foreground/50 leading-relaxed mt-0.5">
                    No translation files match your search queries or active filter tags.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  </ProtectedRoute>
  )
}
