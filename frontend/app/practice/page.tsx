"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import Webcam from "react-webcam"
import {
  Camera,
  CameraOff,
  ChevronRight,
  Flame,
  HelpCircle,
  RefreshCw,
  Award,
  Layers,
  Sparkles,
  Info,
  RotateCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/components/common/section-header"
import { ProgressBar } from "@/components/common/progress-bar"
import { ProtectedRoute } from "@/components/common/protected-route"

interface PracticeCard {
  letter: string
  word?: string
  hint: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  svgType: string
}

const practiceDeck: PracticeCard[] = [
  {
    letter: "A",
    hint: "Keep fist closed, thumb resting flat on the side of index finger.",
    difficulty: "Beginner",
    svgType: "fist",
  },
  {
    letter: "B",
    hint: "Make an open hand flat palm, fingers straight up, fold thumb over palm.",
    difficulty: "Beginner",
    svgType: "open-flat",
  },
  {
    letter: "C",
    hint: "Curve thumb and fingers to form a standard curved 'C' circle shape.",
    difficulty: "Beginner",
    svgType: "curved-c",
  },
  {
    letter: "1",
    hint: "Point index finger straight up, curl remaining fingers into your palm.",
    difficulty: "Beginner",
    svgType: "point-up",
  },
  {
    letter: "5",
    hint: "Open flat palm facing forward, spreading all five fingers wide.",
    difficulty: "Beginner",
    svgType: "spread-hand",
  },
]

export default function PracticePage() {
  const [isWebcamOn, setIsWebcamOn] = React.useState(false)
  const [cardIndex, setCardIndex] = React.useState(0)
  const [isFlipped, setIsFlipped] = React.useState(false)
  const [accuracy, setAccuracy] = React.useState<number | null>(null)
  const [isEvaluating, setIsEvaluating] = React.useState(false)
  const [streak, setStreak] = React.useState(4)
  const [cardsSolved, setCardsSolved] = React.useState(0)

  const currentCard = practiceDeck[cardIndex]
  const webcamRef = React.useRef<Webcam>(null)

  const handleEvaluate = () => {
    setIsEvaluating(true)
    // Mock image processing delay
    setTimeout(() => {
      setIsEvaluating(false)
      const mockScore = Math.floor(Math.random() * 20) + 80 // 80 to 99
      setAccuracy(mockScore)
      setCardsSolved((s) => s + 1)
      if (mockScore >= 88) {
        setStreak((s) => s + 1)
      }
    }, 1200)
  }

  const handleNextCard = () => {
    setIsFlipped(false)
    setAccuracy(null)
    setCardIndex((prev) => (prev + 1) % practiceDeck.length)
  }

  return (
    <ProtectedRoute>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <SectionHeader
        title="Practice Sandbox"
        description="Verify your gestural muscle memory. Form the requested sign on the flashcard inside your camera bounds and calculate similarity."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Live Webcam with Bounding Box (70%) */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="h-full overflow-hidden border border-foreground/5 shadow-xl relative bg-black/5 dark:bg-black/35 flex items-center justify-center min-h-[420px]">
            {isWebcamOn ? (
              <div className="w-full h-full relative aspect-video flex items-center justify-center">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover rounded-2xl"
                />
                
                {/* Visual Bounding Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-dashed border-primary/60 rounded-3xl flex items-center justify-center relative bg-primary/3 backdrop-brightness-110">
                    <span className="absolute -top-7 text-[10px] font-bold text-accent bg-background/80 px-2 py-0.5 rounded-md border border-primary/20 backdrop-blur-xs font-mono">
                      PLACE HAND HERE
                    </span>
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-accent rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-accent rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-accent rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-accent rounded-br-xl" />
                  </div>
                </div>

                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary/25 text-accent border border-primary/35 flex items-center gap-1.5 px-3 py-1 font-semibold rounded-full font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    PRACTICE Sandbox Active
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/45 border border-foreground/5 shadow-xs">
                  <CameraOff className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">Webcam Offline</h3>
                  <p className="text-sm text-foreground/50 max-w-sm mt-1 leading-relaxed">
                    Connecting your webcam enables real-time posture assessments against ASL letter templates.
                  </p>
                </div>
                <Button
                  onClick={() => setIsWebcamOn(true)}
                  className="rounded-full bg-primary hover:bg-accent text-primary-foreground font-semibold px-8 h-11.5 shadow-md shadow-primary/10"
                >
                  <Camera className="mr-2 h-4.5 w-4.5" />
                  Turn Camera On
                </Button>
              </div>
            )}

            {isWebcamOn && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-background/70 backdrop-blur-md px-4 py-2 rounded-xl border border-foreground/5">
                <span className="text-[11px] font-semibold text-foreground/55">Align hand joints in the dashed box</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsWebcamOn(false)}
                  className="text-red-500 hover:bg-red-500/10 rounded-full h-8 px-3 font-semibold text-xs"
                >
                  Close Camera
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Flashcard & scoring interface (30%) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="border border-foreground/5 shadow-md flex-1 flex flex-col justify-between">
            <CardHeader className="border-b border-foreground/5 pb-4.5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/45 font-mono">
                  Challenge Card {cardIndex + 1} of {practiceDeck.length}
                </span>
                <div className="flex items-center gap-1.5 text-orange-600 bg-orange-500/10 border border-orange-500/15 px-3 py-1 rounded-full text-xs font-bold">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  <span>{streak} Streak</span>
                </div>
              </div>
              <CardDescription>Replicate the target cue below</CardDescription>
            </CardHeader>

            {/* Flashcard container with flip animation */}
            <CardContent className="py-6 flex items-center justify-center">
              <div className="w-full max-w-sm aspect-[4/3] relative perspective-1000">
                <AnimatePresence mode="wait">
                  {!isFlipped ? (
                    /* Side A: Prompt */
                    <motion.div
                      key="side-a"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => setIsFlipped(true)}
                      className="absolute inset-0 bg-primary/5 hover:bg-primary/8 border border-primary/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer shadow-inner group transition-all"
                    >
                      <span className="text-[10px] font-bold tracking-widest text-primary/70 uppercase">Challenge Sign</span>
                      <span className="text-7xl font-extrabold text-accent mt-2 font-heading tracking-wide">
                        {currentCard.letter}
                      </span>
                      <span className="text-[10px] font-semibold text-foreground/40 mt-6 flex items-center gap-1 bg-background/80 px-3 py-1 rounded-full border border-foreground/5 group-hover:text-foreground/70 transition-colors">
                        <RotateCw className="h-3 w-3" />
                        Click to Reveal Hint
                      </span>
                    </motion.div>
                  ) : (
                    /* Side B: Vector Posture hint */
                    <motion.div
                      key="side-b"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => setIsFlipped(false)}
                      className="absolute inset-0 bg-background/80 border border-foreground/8 rounded-2xl flex flex-col items-center justify-center p-5 text-center cursor-pointer shadow-md group transition-all"
                    >
                      <span className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase">Hand Posture Hint</span>
                      <div className="w-20 h-20 bg-foreground/3 rounded-xl border border-foreground/5 flex items-center justify-center my-3 relative shadow-inner">
                        {/* Styled SVG icons representing postures */}
                        {currentCard.svgType === "fist" && (
                          <svg viewBox="0 0 100 100" className="w-14 h-14 stroke-accent fill-none" strokeWidth="2.5">
                            <rect x="25" y="45" width="40" height="40" rx="10" />
                            <path d="M 65 48 C 65 48, 75 50, 75 60 C 75 70, 65 72, 65 72" />
                          </svg>
                        )}
                        {currentCard.svgType === "open-flat" && (
                          <svg viewBox="0 0 100 100" className="w-14 h-14 stroke-accent fill-none" strokeWidth="2.5">
                            <path d="M 35 85 L 35 45 M 35 45 C 35 40, 42 40, 42 45 L 42 85" />
                            <rect x="35" y="45" width="30" height="40" rx="4" />
                          </svg>
                        )}
                        {currentCard.svgType === "curved-c" && (
                          <svg viewBox="0 0 100 100" className="w-14 h-14 stroke-accent fill-none" strokeWidth="3">
                            <path d="M 65 30 C 40 30, 30 45, 30 55 C 30 65, 40 80, 65 80" strokeLinecap="round" />
                          </svg>
                        )}
                        {currentCard.svgType === "point-up" && (
                          <svg viewBox="0 0 100 100" className="w-14 h-14 stroke-accent fill-none" strokeWidth="2.5">
                            <rect x="30" y="55" width="40" height="35" rx="8" />
                            <path d="M 40 55 L 40 25 C 40 20, 48 20, 48 25 L 48 55" strokeLinecap="round" />
                          </svg>
                        )}
                        {currentCard.svgType === "spread-hand" && (
                          <svg viewBox="0 0 100 100" className="w-14 h-14 stroke-accent fill-none" strokeWidth="2.5">
                            <path d="M 20 65 C 20 65, 25 50, 30 52 L 38 65 L 38 30 C 38 25, 44 25, 44 30 L 44 60 L 48 22 C 48 17, 54 17, 54 22 L 54 60 L 58 25 C 58 20, 64 20, 64 25 L 64 63 L 68 35 C 68 30, 74 30, 74 35 L 74 75" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-foreground/75 leading-relaxed max-w-[240px]">
                        {currentCard.hint}
                      </p>
                      <span className="text-[9px] text-foreground/35 mt-3">Click to hide hint</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>

            {/* Score progress details */}
            <CardContent className="py-2.5 flex flex-col gap-3.5 border-t border-foreground/5 pt-4">
              <div className="flex justify-between items-center text-xs font-semibold text-foreground/50">
                <span>Completed this turn</span>
                <span>{cardsSolved} signs</span>
              </div>
              
              {accuracy !== null && (
                <div className="flex flex-col gap-2 bg-foreground/[0.01] border border-foreground/5 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-foreground/45 uppercase tracking-wider">Similarity Score</span>
                    <span className={accuracy >= 88 ? "text-green-500" : "text-primary"}>
                      {accuracy}% {accuracy >= 88 ? "(Pass)" : "(Retry)"}
                    </span>
                  </div>
                  <ProgressBar value={accuracy} colorClass={accuracy >= 88 ? "bg-green-500" : "bg-primary"} />
                  <span className="text-[11px] text-foreground/50 text-center mt-1">
                    {accuracy >= 88 ? "Awesome job! You matched ASL posture coordinates." : "Close effort! Flip the card to inspect the finger layout."}
                  </span>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-foreground/5 pt-4 flex justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextCard}
                className="rounded-full border-foreground/15 text-foreground/75 h-9"
              >
                Skip Gesture
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEvaluate}
                  disabled={!isWebcamOn || isEvaluating}
                  className="rounded-full bg-primary hover:bg-accent text-primary-foreground font-semibold h-9 px-5 shadow-xs"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Assessing...
                    </>
                  ) : (
                    "Evaluate Gesture"
                  )}
                </Button>
                
                {accuracy !== null && accuracy >= 88 && (
                  <Button
                    size="sm"
                    onClick={handleNextCard}
                    className="rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold h-9 px-5"
                  >
                    Next Card
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </motion.div>
  </ProtectedRoute>
  )
}
