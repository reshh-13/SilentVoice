"use client"

import * as React from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  baseRadius: number
  radius: number
  color: string
  alpha: number
  baseAlpha: number
}

export function CursorBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const glowRef = React.useRef<HTMLDivElement>(null)
  const parallaxLayer1Ref = React.useRef<HTMLDivElement>(null)
  const parallaxLayer2Ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    // Respect reduced motion and touch devices
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0

    if (prefersReducedMotion || isTouchDevice) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    let mouseX = width / 2
    let mouseY = height / 2
    let targetMouseX = width / 2
    let targetMouseY = height / 2
    let isMouseActive = false

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX
      targetMouseY = e.clientY
      if (!isMouseActive) {
        isMouseActive = true
        mouseX = e.clientX
        mouseY = e.clientY
      }
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    window.addEventListener("resize", handleResize, { passive: true })

    // Warm curated color palette for particles
    const particleColors = [
      "176, 137, 104", // #B08968 (warm desert clay)
      "127, 85, 57",   // #7F5539 (secondary accent)
      "218, 196, 176", // soft cream
      "109, 151, 115", // sage green
    ]

    const particleCount = Math.min(22, Math.max(12, Math.floor(width / 80)))
    const particles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      const baseRadius = Math.random() * 2 + 1.2
      const baseAlpha = Math.random() * 0.22 + 0.1
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        baseRadius,
        radius: baseRadius,
        color: particleColors[i % particleColors.length],
        alpha: baseAlpha,
        baseAlpha,
      })
    }

    let animationFrameId: number

    const render = () => {
      // Smooth lerp towards cursor position
      mouseX += (targetMouseX - mouseX) * 0.075
      mouseY += (targetMouseY - mouseY) * 0.075

      // Update Parallax Layers directly on DOM elements without triggering React re-renders
      if (parallaxLayer1Ref.current) {
        const p1X = (mouseX - width / 2) * 0.018
        const p1Y = (mouseY - height / 2) * 0.018
        parallaxLayer1Ref.current.style.transform = `translate3d(${p1X}px, ${p1Y}px, 0)`
      }
      if (parallaxLayer2Ref.current) {
        const p2X = (mouseX - width / 2) * -0.03
        const p2Y = (mouseY - height / 2) * -0.03
        parallaxLayer2Ref.current.style.transform = `translate3d(${p2X}px, ${p2Y}px, 0)`
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${mouseX - 250}px, ${mouseY - 250}px, 0)`
        glowRef.current.style.opacity = isMouseActive ? "1" : "0"
      }

      ctx.clearRect(0, 0, width, height)

      // Draw and animate particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        p.x += p.vx
        p.y += p.vy

        // Wrap around viewport edges
        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20

        // Gentle displacement when cursor is nearby
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const interactionRadius = 130

        if (dist < interactionRadius && dist > 1) {
          const force = (interactionRadius - dist) / interactionRadius
          const angle = Math.atan2(dy, dx)
          p.x -= Math.cos(angle) * force * 1.8
          p.y -= Math.sin(angle) * force * 1.8
          p.alpha = Math.min(0.55, p.baseAlpha + force * 0.3)
          p.radius = p.baseRadius + force * 1.4
        } else {
          p.alpha += (p.baseAlpha - p.alpha) * 0.05
          p.radius += (p.baseRadius - p.radius) * 0.05
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Base warm atmospheric gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8F5F2] via-[#F4EFEA] to-[#F8F5F2]" />

      {/* Parallax Background Layer 1: Warm ambient blurs */}
      <div
        ref={parallaxLayer1Ref}
        className="absolute inset-0 transition-transform duration-75 ease-out will-change-transform"
      >
        <div className="absolute top-[8%] left-[12%] w-[450px] h-[450px] rounded-full bg-[#B08968]/9 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[8%] w-[550px] h-[550px] rounded-full bg-[#7F5539]/6 blur-[140px]" />
      </div>

      {/* Parallax Background Layer 2: Counter-drifting subtle accents */}
      <div
        ref={parallaxLayer2Ref}
        className="absolute inset-0 transition-transform duration-75 ease-out will-change-transform"
      >
        <div className="absolute top-[35%] right-[20%] w-[380px] h-[380px] rounded-full bg-[#F0E0D3]/40 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[6%] w-[420px] h-[420px] rounded-full bg-[#6D9773]/6 blur-[110px]" />
      </div>

      {/* Smooth Cursor-Following Radial Glow */}
      <div
        ref={glowRef}
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none opacity-0 transition-opacity duration-500 ease-out will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(240, 224, 211, 0.35) 0%, rgba(176, 137, 104, 0.16) 40%, rgba(127, 85, 57, 0.04) 70%, transparent 100%)",
          filter: "blur(24px)",
        }}
      />

      {/* Interactive Floating Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  )
}
