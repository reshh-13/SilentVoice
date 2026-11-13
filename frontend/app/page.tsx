"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Camera,
  Cpu,
  Volume2,
  CheckCircle2,
  Layers,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CursorBackground } from "@/components/home/cursor-background"

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 110, damping: 18 },
    },
  } as const

  const steps = [
    {
      num: "01",
      icon: Camera,
      title: "Detect Hand Gestures",
      desc: "MediaPipe tracks 21 distinct 3D joint landmark coordinates per hand directly in your browser without uploading video frames.",
    },
    {
      num: "02",
      icon: Cpu,
      title: "Recognize ASL Fingerspelling",
      desc: "Our browser-native neural network evaluates landmark geometry with a 60% confidence threshold and continuous 3-second stability validation.",
    },
    {
      num: "03",
      icon: Volume2,
      title: "Convert Letters into Text",
      desc: "The intelligent sentence builder auto-assembles words, inserts spaces on natural pauses, and speaks phrases aloud with text-to-speech.",
    },
  ]

  const features = [
    {
      icon: Camera,
      title: "Real-Time Hand Tracking",
      desc: "High-frequency 21-point 3D spatial hand tracking with zero server-side latency or video streaming overhead.",
    },
    {
      icon: Cpu,
      title: "AI-Powered Letter Recognition",
      desc: "Pre-trained deep neural network achieving 92.5% accuracy on American Sign Language fingerspelling datasets.",
    },
    {
      icon: Layers,
      title: "Sentence Building",
      desc: "Automated token appending with rolling window stabilization, duplicate locking, and full manual backspace editing.",
    },
    {
      icon: Volume2,
      title: "Text-to-Speech",
      desc: "Instant vocalization via browser Web Speech synthesis, making communication seamless for both signers and non-signers.",
    },
    {
      icon: GraduationCap,
      title: "Learning and Practice",
      desc: "Guided interactive flashcards, visual gesture diagrams, streak counters, and difficulty tiers to learn fingerspelling step-by-step.",
    },
  ]

  return (
    <div className="relative min-h-screen">
      {/* Interactive Cursor Background (Glow, Particles, Parallax) */}
      <CursorBackground />

      {/* Main Content Layer */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col gap-28 md:gap-36 pb-16"
      >
        {/* ========================================================================= */}
        {/* HERO SECTION                                                              */}
        {/* ========================================================================= */}
        <section className="pt-4 md:pt-8 min-h-[calc(100vh-140px)] flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
            {/* LEFT COLUMN: Text Content (~50%) */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left">
              {/* Eyebrow */}
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-accent font-semibold text-xs tracking-wider uppercase border border-primary/20 backdrop-blur-xs shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>SIGN LANGUAGE. WITHOUT BARRIERS.</span>
              </motion.div>

              {/* Large Headline */}
              <motion.h1
                variants={itemVariants}
                className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08]"
              >
                Every Gesture <br />
                <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
                  Tells a Story.
                </span>
              </motion.h1>

              {/* Supporting Text */}
              <motion.p
                variants={itemVariants}
                className="text-base sm:text-lg text-foreground/75 max-w-xl leading-relaxed font-normal"
              >
                SilentVoice converts American Sign Language (ASL) fingerspelling into text and spoken audio in real time using AI-powered hand tracking. Experience fluid communication directly in your browser.
              </motion.p>

              {/* Call-to-Action Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap items-center gap-4 pt-1"
              >
                <Link href="/translate">
                  <Button
                    size="lg"
                    className="rounded-full bg-primary hover:bg-accent text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 font-semibold px-7 h-12 text-sm gap-2"
                  >
                    <span>Start Translating</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link href="/guide">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-foreground/15 hover:bg-foreground/5 text-foreground/80 font-semibold px-6 h-12 text-sm gap-2 glass-card"
                  >
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Explore Guide</span>
                  </Button>
                </Link>
              </motion.div>

              {/* Real-Time Recognition Indicator */}
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2.5 pt-2 text-xs text-foreground/60"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                <span className="font-medium">
                  Real-time AI-powered recognition &bull; Zero server latency &bull; Private &amp; secure
                </span>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Video Character Hero (~50%) */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              {/* Subtle Ambient Glow Aura */}
              <div className="absolute -inset-6 bg-gradient-to-tr from-primary/25 via-accent/15 to-[#F0E0D3]/40 rounded-[2.5rem] blur-2xl -z-10 animate-pulse pointer-events-none" />

              {/* Floating Badge 1 (Top Left) */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-3 -left-3 sm:-left-5 z-20 glass-card border border-foreground/10 px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2.5 backdrop-blur-md bg-white/80 dark:bg-black/70 pointer-events-none"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9.5px] uppercase font-bold tracking-wider text-foreground/50">
                    Live Recognition
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    ASL Fingerspelling
                  </span>
                </div>
              </motion.div>

              {/* Floating Badge 2 (Bottom Right) */}
              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="absolute -bottom-3 -right-3 sm:-right-5 z-20 glass-card border border-foreground/10 px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2.5 backdrop-blur-md bg-white/80 dark:bg-black/70 pointer-events-none"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9.5px] uppercase font-bold tracking-wider text-foreground/50">
                    Stability Engine
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    60% &bull; 3s Continuous
                  </span>
                </div>
              </motion.div>

              {/* Video Character Responsive Container (Crops Black Pillarboxes) */}
              <div className="relative w-full max-w-[420px] sm:max-w-[460px] aspect-[103/108] rounded-3xl overflow-hidden shadow-2xl border border-foreground/10 bg-[#F0E0D3] z-10 group">
                <video
                  src="/video-project.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[186.2%] max-w-none h-full object-cover pointer-events-none select-none"
                />
                {/* Soft Vignette Overlay to blend with design */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/40 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 1: HOW IT WORKS                                                   */}
        {/* ========================================================================= */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-col items-center text-center gap-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Simple 3-Step Process
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              How SilentVoice Works
            </h2>
            <p className="text-sm sm:text-base text-foreground/60 leading-normal">
              From raw webcam video frames to accurate sentences in milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.num}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Card className="glass-card border border-foreground/10 rounded-2xl p-6 h-full flex flex-col justify-between hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
                    <CardHeader className="p-0 pb-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-heading text-2xl font-bold text-foreground/20">
                          {s.num}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-heading font-bold text-foreground">
                        {s.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <p className="text-xs sm:text-sm text-foreground/65 leading-relaxed">
                        {s.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: FEATURES                                                       */}
        {/* ========================================================================= */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-col items-center text-center gap-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Platform Features
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Engineered for Real Accessibility
            </h2>
            <p className="text-sm sm:text-base text-foreground/60 leading-normal">
              A complete suite of zero-latency, private, and intuitive communication tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={idx === 4 ? "sm:col-span-2 lg:col-span-1" : ""}
                >
                  <Card className="glass-card border border-foreground/10 rounded-2xl p-6 h-full flex flex-col hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-base font-bold text-foreground mb-2">
                      {f.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/65 leading-relaxed">
                      {f.desc}
                    </p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: CALL TO ACTION                                                 */}
        {/* ========================================================================= */}
        <motion.section
          variants={itemVariants}
          className="relative rounded-3xl p-8 sm:p-12 overflow-hidden glass-card border border-foreground/15 shadow-xl text-center flex flex-col items-center gap-6 max-w-4xl mx-auto w-full"
        >
          {/* Subtle Ambient Background Gradient in CTA */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-3 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Ready to Get Started?
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Ready to communicate differently?
            </h2>
            <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
              Experience seamless, real-time sign language translation directly inside your browser. No downloads, installations, or specialized hardware needed.
            </p>
          </div>

          <div className="relative z-10 pt-2">
            <Link href="/translate">
              <Button
                size="lg"
                className="rounded-full bg-primary hover:bg-accent text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-9 h-12 text-sm gap-2"
              >
                <span>Start Translating</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}
