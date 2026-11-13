"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Info, HelpCircle, Layers, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "@/components/common/search-bar"
import { SectionHeader } from "@/components/common/section-header"

interface SignItem {
  id: string
  name: string
  category: "Alphabets" | "Numbers" | "Greetings" | "Common Phrases" | "Emergency" | "Daily Life"
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  description: string
  svgType: string // identifier for rendering custom SVGs
}

const signDatabase: SignItem[] = [
  {
    id: "sign-a",
    name: "Letter A",
    category: "Alphabets",
    difficulty: "Beginner",
    description: "Form a closed fist with the thumb resting vertically against the outer edge of the index finger.",
    svgType: "fist",
  },
  {
    id: "sign-b",
    name: "Letter B",
    category: "Alphabets",
    difficulty: "Beginner",
    description: "Extend four fingers straight up closely together, folding the thumb flat across the palm.",
    svgType: "open-flat",
  },
  {
    id: "sign-c",
    name: "Letter C",
    category: "Alphabets",
    difficulty: "Beginner",
    description: "Curve your thumb and four fingers in unison to form a visible half-circle shape.",
    svgType: "curved-c",
  },
  {
    id: "sign-num1",
    name: "Number 1",
    category: "Numbers",
    difficulty: "Beginner",
    description: "Extend only the index finger pointing vertically upward, palm facing inward.",
    svgType: "point-up",
  },
  {
    id: "sign-num5",
    name: "Number 5",
    category: "Numbers",
    difficulty: "Beginner",
    description: "Spread all five fingers widely apart, holding palm facing forward.",
    svgType: "spread-hand",
  },
  {
    id: "sign-hello",
    name: "Hello",
    category: "Greetings",
    difficulty: "Beginner",
    description: "Bring the flat palm of your hand up near your forehead, sweeping it slightly outward in a salute.",
    svgType: "wave-salute",
  },
  {
    id: "sign-thanks",
    name: "Thank You",
    category: "Greetings",
    difficulty: "Beginner",
    description: "Touch the fingertips of your flat hand to your lips, then move it down and outward toward the person.",
    svgType: "lips-out",
  },
  {
    id: "sign-please",
    name: "Please",
    category: "Greetings",
    difficulty: "Beginner",
    description: "Place your flat open palm on the center of your chest and move it in a circular clockwise motion.",
    svgType: "chest-circle",
  },
  {
    id: "sign-how",
    name: "How are you?",
    category: "Common Phrases",
    difficulty: "Intermediate",
    description: "Form hand cups touching at knuckles, roll palms upward, and point forward toward the addressee.",
    svgType: "dual-roll",
  },
  {
    id: "sign-help",
    name: "Help",
    category: "Emergency",
    difficulty: "Intermediate",
    description: "Make a closed fist with thumb up on your dominant hand, resting it flat on the palm of your flat non-dominant hand.",
    svgType: "fist-on-palm",
  },
  {
    id: "sign-doc",
    name: "Doctor",
    category: "Emergency",
    difficulty: "Advanced",
    description: "Tap the fingertips of your dominant index and middle fingers twice onto the wrist of your non-dominant hand.",
    svgType: "wrist-tap",
  },
  {
    id: "sign-home",
    name: "Home",
    category: "Daily Life",
    difficulty: "Beginner",
    description: "Form a flat cone with your fingers and tap twice against the cheek near the mouth, then near the ear.",
    svgType: "cheek-tap",
  },
  {
    id: "sign-family",
    name: "Family",
    category: "Daily Life",
    difficulty: "Intermediate",
    description: "Make 'F' hand shapes with both hands. Touch thumbs and index fingers together, then circle outward.",
    svgType: "f-circle",
  },
]

// Render beautiful, customized minimal SVG gesture representations
const SignSVG: React.FC<{ type: string }> = ({ type }) => {
  const baseColor = "stroke-accent fill-none"
  const secondaryColor = "stroke-primary/50 fill-none"
  const nodeColor = "fill-primary stroke-background"

  // Different vector icons corresponding to mock hand postures
  switch (type) {
    case "fist":
      return (
        <svg viewBox="0 0 100 100" className="w-20 h-20">
          <rect x="25" y="45" width="40" height="40" rx="10" className={baseColor} strokeWidth="2.5" />
          <path d="M 65 48 C 65 48, 75 50, 75 60 C 75 70, 65 72, 65 72" className={baseColor} strokeWidth="2.5" />
          <line x1="35" y1="45" x2="35" y2="85" className={secondaryColor} strokeWidth="1.5" />
          <line x1="45" y1="45" x2="45" y2="85" className={secondaryColor} strokeWidth="1.5" />
          <line x1="55" y1="45" x2="55" y2="85" className={secondaryColor} strokeWidth="1.5" />
        </svg>
      )
    case "open-flat":
      return (
        <svg viewBox="0 0 100 100" className="w-20 h-20">
          <path d="M 35 85 L 35 45 C 35 40, 42 40, 42 45 L 42 85" className={baseColor} strokeWidth="2.5" />
          <rect x="35" y="45" width="30" height="40" rx="4" className={baseColor} strokeWidth="2.5" />
          <path d="M 30 65 C 20 65, 20 75, 35 75" className={baseColor} strokeWidth="2.5" />
          <line x1="45" y1="45" x2="45" y2="85" className={secondaryColor} strokeWidth="1.5" />
          <line x1="55" y1="45" x2="55" y2="85" className={secondaryColor} strokeWidth="1.5" />
        </svg>
      )
    case "curved-c":
      return (
        <svg viewBox="0 0 100 100" className="w-20 h-20">
          <path d="M 65 30 C 40 30, 30 45, 30 55 C 30 65, 40 80, 65 80" className={baseColor} strokeWidth="3" strokeLinecap="round" />
          <path d="M 65 40 C 50 40, 42 50, 42 55 C 42 60, 50 70, 65 70" className={secondaryColor} strokeWidth="1.5" />
        </svg>
      )
    case "point-up":
      return (
        <svg viewBox="0 0 100 100" className="w-20 h-20">
          <rect x="30" y="55" width="40" height="35" rx="8" className={baseColor} strokeWidth="2.5" />
          <path d="M 40 55 L 40 25 C 40 20, 48 20, 48 25 L 48 55" className={baseColor} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 30 70 C 20 70, 22 80, 30 80" className={secondaryColor} strokeWidth="2" />
        </svg>
      )
    case "spread-hand":
      return (
        <svg viewBox="0 0 100 100" className="w-20 h-20">
          <path d="M 20 65 C 20 65, 25 50, 30 52 C 35 54, 38 65, 38 65" className={baseColor} strokeWidth="2.5" />
          <path d="M 50 85 L 50 55" className={baseColor} strokeWidth="2.5" />
          <path d="M 38 65 L 38 30 C 38 25, 44 25, 44 30 L 44 60" className={baseColor} strokeWidth="2.5" />
          <path d="M 48 60 L 48 22 C 48 17, 54 17, 54 22 L 54 60" className={baseColor} strokeWidth="2.5" />
          <path d="M 58 60 L 58 25 C 58 20, 64 20, 64 25 L 64 63" className={baseColor} strokeWidth="2.5" />
          <path d="M 68 63 L 68 35 C 68 30, 74 30, 74 35 L 74 75" className={baseColor} strokeWidth="2.5" />
        </svg>
      )
    case "wave-salute":
      return (
        <svg viewBox="0 0 100 100" className="w-20 h-20">
          <path d="M 30 45 C 45 35, 75 40, 85 55" className={baseColor} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 25 50 L 35 40" className={secondaryColor} strokeWidth="1.5" />
          <path d="M 30 55 L 40 45" className={secondaryColor} strokeWidth="1.5" />
          <circle cx="85" cy="55" r="4" className={nodeColor} />
        </svg>
      )
    case "lips-out":
      return (
        <svg viewBox="0 0 100 100" className="w-20 h-20">
          <path d="M 30 50 C 45 50, 70 65, 80 50" className={baseColor} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="30" cy="50" r="4.5" className={nodeColor} />
          <circle cx="80" cy="50" r="4.5" className={nodeColor} />
        </svg>
      )
    case "chest-circle":
      return (
        <svg viewBox="0 0 100 100" className="w-20 h-20">
          <circle cx="50" cy="50" r="22" className={secondaryColor} strokeWidth="2" strokeDasharray="5 3" />
          <path d="M 50 28 C 65 28, 72 40, 72 50 C 72 65, 55 72, 50 72" className={baseColor} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="50,23 58,28 50,33" className="fill-accent" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-20 h-20">
          <path d="M 50 25 C 65 25, 75 35, 75 50 C 75 65, 50 75, 50 75" className={baseColor} strokeWidth="2" />
          <path d="M 50 75 C 50 75, 25 65, 25 50 C 25 35, 35 25, 50 25" className={secondaryColor} strokeWidth="2" />
          <circle cx="50" cy="50" r="5" className={nodeColor} />
        </svg>
      )
  }
}

export default function GuidePage() {
  const [activeCategory, setActiveCategory] = React.useState<string>("All")
  const [searchQuery, setSearchQuery] = React.useState("")

  const categories = ["All", "Alphabets", "Numbers", "Greetings", "Common Phrases", "Emergency", "Daily Life"]

  const filteredSigns = signDatabase.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8"
    >
      <SectionHeader
        title="ASL Sign Guide"
        description="Search and filter through visual American Sign Language gestures. Study the hand shapes, description specifications, and challenge tags."
        action={
          <SearchBar
            placeholder="Search sign gesture..."
            onSearch={setSearchQuery}
          />
        }
      />

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={
              activeCategory === category
                ? "rounded-full bg-primary hover:bg-accent text-primary-foreground font-semibold px-5.5 h-9 shrink-0 text-xs transition-all shadow-xs"
                : "rounded-full bg-background border border-foreground/10 hover:bg-foreground/5 hover:text-foreground text-foreground/75 font-semibold px-5.5 h-9 shrink-0 text-xs transition-all"
            }
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Signs Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredSigns.length > 0 ? (
            filteredSigns.map((sign) => (
              <motion.div
                key={sign.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                whileHover={{ y: -4 }}
                className="h-full flex flex-col"
              >
                <Card className="h-full flex flex-col justify-between overflow-hidden border border-foreground/5 shadow-md">
                  <CardHeader className="bg-foreground/[0.01] border-b border-foreground/5 p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <Badge className="bg-primary/10 text-accent border border-primary/20 px-2.5 rounded-full font-semibold text-[10px]">
                        {sign.category}
                      </Badge>
                      <Badge
                        variant={
                          sign.difficulty === "Beginner"
                            ? "default"
                            : sign.difficulty === "Intermediate"
                            ? "secondary"
                            : "destructive"
                        }
                        className="rounded-full px-2.5 text-[10px] font-semibold"
                      >
                        {sign.difficulty}
                      </Badge>
                    </div>

                    {/* Vector Hand Gesture Placeholder */}
                    <div className="w-full h-32 rounded-xl bg-background border border-foreground/5 flex items-center justify-center shadow-inner relative">
                      <SignSVG type={sign.svgType} />
                      <div className="absolute bottom-2.5 right-2.5 text-[10px] text-foreground/35 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        <span>Posture Template</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 flex flex-col gap-2">
                    <CardTitle className="text-base font-bold text-foreground">
                      {sign.name}
                    </CardTitle>
                    <p className="text-xs md:text-sm text-foreground/60 leading-relaxed mt-1">
                      {sign.description}
                    </p>
                  </CardContent>
                  <CardFooter className="p-5 pt-3 border-t border-foreground/5 flex justify-end">
                    <Button variant="ghost" size="sm" className="rounded-full text-xs font-semibold text-accent hover:bg-primary/10 px-4 h-8 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      Joint Landmarks
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/45">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-heading text-lg font-bold text-foreground">No signs found</h4>
                <p className="text-sm text-foreground/50 max-w-xs mt-1">
                  Adjust your filters or try a different term.
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
