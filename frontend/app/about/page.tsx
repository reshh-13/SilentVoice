"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Heart, Laptop, Server, Shield, Sparkles, Cpu, Layers, HelpCircle, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/components/common/section-header"

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  } as const

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-12 max-w-5xl mx-auto"
    >
      <SectionHeader
        title="About silent voice"
        description="Learn about the pipeline, design philosophy, and technology stacks driving real-time sign translation."
      />

      {/* Vision Card */}
      <motion.div variants={itemVariants}>
        <Card className="border border-foreground/5 shadow-md">
          <CardContent className="p-8 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-accent flex items-center justify-center shrink-0">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-heading text-lg font-bold text-foreground">Project Vision</h3>
              <p className="text-sm md:text-base text-foreground/60 leading-relaxed">
                Communication is a fundamental human right. However, sign language users face immense barriers in everyday environments.
                <strong> silent voice</strong> seeks to narrow this gap by delivering a lightweight, zero-install, responsive translator that runs directly inside your browser. We aim to support classroom environments and assistive workflows with computer vision and neural networking structures.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Interactive SVG AI Workflow Pipeline Diagram */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-lg font-bold text-foreground">AI Translation Pipeline Workflow</h3>
          <p className="text-sm text-foreground/50">Details of how video frame streams are captured, analyzed, and synthesized into text speech.</p>
        </div>

        <Card className="border border-foreground/5 shadow-md overflow-hidden bg-foreground/[0.01] p-6 md:p-8 flex items-center justify-center">
          {/* Custom SVG Pipeline Flowchart */}
          <svg viewBox="0 0 820 280" className="w-full max-w-4xl h-auto select-none font-mono text-[10px]">
            {/* Definitions for arrow markers */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="fill-accent/60" />
              </marker>
            </defs>

            {/* Block 1: Camera Input */}
            <rect x="15" y="100" width="110" height="70" rx="8" className="fill-background stroke-primary/30" strokeWidth="1.5" />
            <text x="70" y="130" textAnchor="middle" className="fill-foreground font-bold font-sans text-xs">Webcam</text>
            <text x="70" y="145" textAnchor="middle" className="fill-foreground/45">30 fps Video Stream</text>

            <path d="M 125 135 L 155 135" className="stroke-primary/50 fill-none" strokeWidth="1.5" markerEnd="url(#arrow)" />

            {/* Block 2: Frame Extractor */}
            <rect x="165" y="100" width="120" height="70" rx="8" className="fill-background stroke-primary/30" strokeWidth="1.5" />
            <text x="225" y="130" textAnchor="middle" className="fill-foreground font-bold font-sans text-xs">OpenCV Engine</text>
            <text x="225" y="145" textAnchor="middle" className="fill-foreground/45">Frame Scaling &amp; Normalization</text>

            <path d="M 285 135 L 315 135" className="stroke-primary/50 fill-none" strokeWidth="1.5" markerEnd="url(#arrow)" />

            {/* Block 3: MediaPipe Landmarks */}
            <rect x="325" y="100" width="130" height="70" rx="8" className="fill-background stroke-primary/30" strokeWidth="1.5" />
            <text x="390" y="130" textAnchor="middle" className="fill-foreground font-bold font-sans text-xs">MediaPipe Hands</text>
            <text x="390" y="145" textAnchor="middle" className="fill-foreground/45">21 3D Joint Keypoints</text>

            <path d="M 455 135 L 485 135" className="stroke-primary/50 fill-none" strokeWidth="1.5" markerEnd="url(#arrow)" />

            {/* Block 4: TensorFlow Classification */}
            <rect x="495" y="100" width="130" height="70" rx="8" className="fill-background stroke-primary/30" strokeWidth="1.5" />
            <text x="560" y="130" textAnchor="middle" className="fill-foreground font-bold font-sans text-xs">TensorFlow model</text>
            <text x="560" y="145" textAnchor="middle" className="fill-foreground/45">LSTM Gesture Classifier</text>

            <path d="M 625 135 L 655 135" className="stroke-primary/50 fill-none" strokeWidth="1.5" markerEnd="url(#arrow)" />

            {/* Block 5: Output */}
            <rect x="665" y="100" width="135" height="70" rx="8" className="fill-background stroke-primary/30" strokeWidth="1.5" />
            <text x="732" y="125" textAnchor="middle" className="fill-foreground font-bold font-sans text-xs">Output</text>
            <text x="732" y="140" textAnchor="middle" className="fill-foreground/45">Text &amp; Speech Synthesis</text>
            <text x="732" y="152" textAnchor="middle" className="fill-primary font-semibold text-[9px]">(TTS Engine)</text>

            {/* Loopback indicator */}
            <path d="M 732 170 L 732 210 L 390 210 L 390 170" className="stroke-primary/20 fill-none" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow)" />
            <text x="560" y="200" textAnchor="middle" className="fill-foreground/35 text-[9px]">Feedback loop for predictive smoothing</text>
          </svg>
        </Card>
      </motion.div>

      {/* Technical Integration list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="h-full border border-foreground/5 shadow-md">
            <CardHeader className="pb-3 border-b border-foreground/5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-accent flex items-center justify-center mb-2">
                <Laptop className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">Client Interface</CardTitle>
              <CardDescription>Visual Layout Stacks</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-foreground/60 leading-relaxed flex flex-col gap-2 pt-4">
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> Next.js 15 App router</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> Tailwind CSS v4 variables</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> Framer Motion layouts</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> React Webcam video stream</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> shadcn/ui components</span>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full border border-foreground/5 shadow-md">
            <CardHeader className="pb-3 border-b border-foreground/5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-accent flex items-center justify-center mb-2">
                <Cpu className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">AI Analytics Engine</CardTitle>
              <CardDescription>Vision &amp; Landmarking</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-foreground/60 leading-relaxed flex flex-col gap-2 pt-4">
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> OpenCV frame scaling</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> MediaPipe hand skeleton</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> 21 keypoints coordinate arrays</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> TensorFlow classification layers</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> WebSockets live framing</span>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full border border-foreground/5 shadow-md">
            <CardHeader className="pb-3 border-b border-foreground/5">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-accent flex items-center justify-center mb-2">
                <Shield className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">Data &amp; Operations</CardTitle>
              <CardDescription>Security &amp; Persistence</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-foreground/60 leading-relaxed flex flex-col gap-2 pt-4">
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> Local session tokens</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> Local SQLite translated logs</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> In-browser neural MLP weights</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> Dotenv variables protection</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-primary" /> FastAPI backend scaffolding</span>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
