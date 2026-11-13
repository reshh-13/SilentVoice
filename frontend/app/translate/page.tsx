"use client"

import * as React from "react"
import { motion } from "motion/react"
import Webcam from "react-webcam"
import {
  Camera,
  CameraOff,
  Volume2,
  Trash2,
  Copy,
  Download,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info,
  ShieldCheck,
  RotateCcw,
  Delete,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/common/protected-route"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import {
  getHandLandmarker,
  closeHandLandmarker,
  MediaPipeLandmark,
  HandTrackingResult,
  MEDIAPIPE_HAND_CONNECTIONS,
} from "@/services/mediapipe"
import {
  loadFingerspellingModel,
  predictLandmarks,
  predictLandmarksWithVariant,
  OrientationVariant,
  ASLPrediction,
  ModelWeightsData,
} from "@/services/fingerspelling-model"
import {
  PredictionStabilizer,
  StabilizerResult,
} from "@/services/prediction-stabilizer"
import {
  WordSpaceDetector,
  PauseState,
} from "@/services/word-space-detector"

// Static normalized 21-point hand posture template for fallback preview
const staticPreviewLandmarks: MediaPipeLandmark[] = [
  { x: 0.50, y: 0.88, z: 0 },
  { x: 0.38, y: 0.80, z: 0 },
  { x: 0.30, y: 0.70, z: 0 },
  { x: 0.25, y: 0.60, z: 0 },
  { x: 0.20, y: 0.52, z: 0 },

  { x: 0.40, y: 0.54, z: 0 },
  { x: 0.36, y: 0.38, z: 0 },
  { x: 0.33, y: 0.26, z: 0 },
  { x: 0.30, y: 0.16, z: 0 },

  { x: 0.50, y: 0.50, z: 0 },
  { x: 0.50, y: 0.32, z: 0 },
  { x: 0.50, y: 0.20, z: 0 },
  { x: 0.50, y: 0.10, z: 0 },

  { x: 0.60, y: 0.54, z: 0 },
  { x: 0.64, y: 0.38, z: 0 },
  { x: 0.67, y: 0.26, z: 0 },
  { x: 0.70, y: 0.16, z: 0 },

  { x: 0.70, y: 0.64, z: 0 },
  { x: 0.76, y: 0.52, z: 0 },
  { x: 0.80, y: 0.42, z: 0 },
  { x: 0.84, y: 0.34, z: 0 },
]

export default function TranslatePage() {
  const { user, getToken, updateProfileStats } = useAuth()
  const [isWebcamOn, setIsWebcamOn] = React.useState(false)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [isMediaPipeLoading, setIsMediaPipeLoading] = React.useState(false)
  const [mediaPipeError, setMediaPipeError] = React.useState<string | null>(null)

  // ML Model Loading & Real-Time Prediction States
  const [isModelLoaded, setIsModelLoaded] = React.useState(false)
  const [modelError, setModelError] = React.useState<string | null>(null)
  const [prediction, setPrediction] = React.useState<ASLPrediction | null>(null)

  // Prediction Stabilization & Sentence Builder States
  const [stabilizerResult, setStabilizerResult] = React.useState<StabilizerResult | null>(null)
  const [lastAcceptedToken, setLastAcceptedToken] = React.useState<string | null>(null)
  const [tokenFlashKey, setTokenFlashKey] = React.useState<number>(0)
  const [isDebugOpen, setIsDebugOpen] = React.useState(false)
  const [isOrientationSuiteOpen, setIsOrientationSuiteOpen] = React.useState(false)
  const [testGroundTruth, setTestGroundTruth] = React.useState<string>("A")
  const [testHand, setTestHand] = React.useState<"Right" | "Left">("Right")
  const [capturedSamples, setCapturedSamples] = React.useState<Array<{
    id: string
    timestamp: number
    groundTruth: string
    hand: "Right" | "Left"
    detectedHandedness: string
    landmarks: MediaPipeLandmark[]
  }>>([])
  const [isCapturingBurst, setIsCapturingBurst] = React.useState(false)

  // Phase 4D-2 Pause Space Debug State
  const [pauseState, setPauseState] = React.useState<PauseState>("IDLE")
  const [elapsedPauseMs, setElapsedPauseMs] = React.useState<number>(0)

  // Sentence Builder State
  const [sentence, setSentence] = React.useState<string>("")
  const [finalTranslation, setFinalTranslation] = React.useState<string>("")
  const [isSaving, setIsSaving] = React.useState(false)

  const webcamRef = React.useRef<Webcam>(null)
  const overlayCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const sidebarCanvasRef = React.useRef<HTMLCanvasElement>(null)

  const animationFrameId = React.useRef<number | null>(null)
  const lastVideoTime = React.useRef<number>(-1)

  // Sentence ref to prevent stale closures
  const sentenceRef = React.useRef<string>("")
  React.useEffect(() => {
    sentenceRef.current = sentence
  }, [sentence])

  // Shared landmark data
  const [handTrackingResult, setHandTrackingResult] = React.useState<HandTrackingResult>({
    detectedHandsCount: 0,
    landmarks: [],
    handedness: [],
  })

  // Singleton Model, Stabilizer & WordSpaceDetector Refs
  const modelRef = React.useRef<{
    model: ModelWeightsData
    labels: string[]
  } | null>(null)

  const stabilizerRef = React.useRef<PredictionStabilizer>(
    new PredictionStabilizer({
      windowSize: 5,
      confidenceThreshold: 60,
      majorityCount: 3,
      stabilityDurationMs: 3000,
      handLossGraceMs: 400,
    })
  )

  const spaceDetectorRef = React.useRef<WordSpaceDetector>(
    new WordSpaceDetector({
      wordPauseMs: 1500,
      gracePeriodMs: 300,
    })
  )

  // Load ASL Model once on mount
  React.useEffect(() => {
    let isSubscribed = true

    const initModel = async () => {
      try {
        const loadedData = await loadFingerspellingModel()

        if (isSubscribed) {
          modelRef.current = loadedData
          setIsModelLoaded(true)
        }
      } catch (err: unknown) {
        console.error("ASL Model initialization error:", err)

        if (isSubscribed) {
          setModelError(
            err instanceof Error ? err.message : "Model unavailable"
          )
        }
      }
    }

    initModel()

    return () => {
      isSubscribed = false
    }
  }, [])

  // Clean up MediaPipe resources
  React.useEffect(() => {
    return () => {
      closeHandLandmarker()
    }
  }, [])

  // Live MediaPipe Detection Loop
  React.useEffect(() => {
    let isSubscribed = true

    if (!isWebcamOn) {
      setHandTrackingResult({
        detectedHandsCount: 0,
        landmarks: [],
        handedness: [],
      })

      setPrediction(null)
      setStabilizerResult(null)

      stabilizerRef.current.reset()
      spaceDetectorRef.current.reset()

      setPauseState("IDLE")
      setElapsedPauseMs(0)

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
        animationFrameId.current = null
      }

      return
    }

    const startDetectionLoop = async () => {
      setIsMediaPipeLoading(true)
      setMediaPipeError(null)

      try {
        const landmarker = await getHandLandmarker()

        if (!isSubscribed) return

        setIsMediaPipeLoading(false)

        const detectFrame = () => {
          if (!isSubscribed) return

          if (
            webcamRef.current &&
            webcamRef.current.video &&
            webcamRef.current.video.readyState >= 2
          ) {
            const video = webcamRef.current.video
            const currentTime = video.currentTime

            if (currentTime !== lastVideoTime.current) {
              lastVideoTime.current = currentTime

              const startTimeMs = performance.now()

              const results = landmarker.detectForVideo(
                video,
                startTimeMs
              )

              if (results && results.landmarks) {
                const formattedLandmarks: MediaPipeLandmark[][] =
                  results.landmarks.map((hand) =>
                    hand.map((lm) => ({
                      x: lm.x,
                      y: lm.y,
                      z: lm.z,
                    }))
                  )

                const handednessLabels = results.handedness
                  ? results.handedness.map(
                      (h) => h[0]?.categoryName || "Hand"
                    )
                  : []

                setHandTrackingResult({
                  detectedHandsCount: formattedLandmarks.length,
                  landmarks: formattedLandmarks,
                  handedness: handednessLabels,
                })

                // REAL MODEL INFERENCE
                if (
                  formattedLandmarks.length > 0 &&
                  modelRef.current
                ) {
                  try {
                    const primaryHand = formattedLandmarks[0]

                    const rawPred = predictLandmarks(
                      primaryHand,
                      modelRef.current.model,
                      modelRef.current.labels
                    )

                    setPrediction(rawPred)

                    const stabRes = stabilizerRef.current.processFrame(rawPred)

                    setStabilizerResult(stabRes)

                    // Accepted token
                    if (stabRes.acceptedLetter) {
                      const newLetter = stabRes.acceptedLetter

                      setLastAcceptedToken(newLetter)
                      setTokenFlashKey((prev) => prev + 1)

                      spaceDetectorRef.current.onTokenAccepted()

                      setSentence((prevSentence) => prevSentence + newLetter)
                    }
                  } catch (predictErr) {
                    console.error("Inference prediction error:", predictErr)
                  }
                } else {
                  setPrediction(null)
                  const stabRes = stabilizerRef.current.processFrame(null)
                  setStabilizerResult(stabRes)
                }

                // Automatic word-space detection
                const spaceEval = spaceDetectorRef.current.evaluate(sentenceRef.current)

                setPauseState(spaceEval.state)
                setElapsedPauseMs(spaceEval.elapsedMs)

                if (spaceEval.shouldInsertSpace) {
                  setSentence((prev) => {
                    if (prev && prev.length > 0 && !prev.endsWith(" ")) {
                      return prev + " "
                    }

                    return prev
                  })
                }
              } else {
                setHandTrackingResult({
                  detectedHandsCount: 0,
                  landmarks: [],
                  handedness: [],
                })
                setPrediction(null)
                const stabRes = stabilizerRef.current.processFrame(null)
                setStabilizerResult(stabRes)
              }
            }
          }

          animationFrameId.current = requestAnimationFrame(detectFrame)
        }

        detectFrame()
      } catch (err: unknown) {
        console.error("MediaPipe detection loop error:", err)

        if (isSubscribed) {
          setMediaPipeError(
            err instanceof Error ? err.message : "MediaPipe vision error."
          )

          setIsMediaPipeLoading(false)
        }
      }
    }

    startDetectionLoop()

    return () => {
      isSubscribed = false

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
        animationFrameId.current = null
      }
    }
  }, [isWebcamOn])

  // Toggle Camera Feed
  const toggleWebcam = () => {
    if (!isWebcamOn) {
      setIsConnecting(true)

      setTimeout(() => {
        setIsConnecting(false)
        setIsWebcamOn(true)
      }, 800)
    } else {
      setIsWebcamOn(false)

      setHandTrackingResult({
        detectedHandsCount: 0,
        landmarks: [],
        handedness: [],
      })

      setPrediction(null)
      setStabilizerResult(null)

      stabilizerRef.current.reset()
      spaceDetectorRef.current.reset()

      setPauseState("IDLE")
      setElapsedPauseMs(0)
    }
  }

  // Phase 4E: Backspace / Manual Character Deletion
  const handleBackspace = React.useCallback(() => {
    setSentence((prev) => {
      if (!prev || prev.length === 0) return prev
      return prev.slice(0, -1)
    })
    // Synchronize space detector so it doesn't immediately re-insert an automatic space
    spaceDetectorRef.current.onManualDelete()
  }, [])

  // Keyboard Backspace Listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement | null)?.isContentEditable
      ) {
        return
      }

      if (e.key === "Backspace") {
        e.preventDefault()
        handleBackspace()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleBackspace])

  // Clear Sentence Builder
  const clearSentence = () => {
    setSentence("")
    setFinalTranslation("")
    setLastAcceptedToken(null)

    stabilizerRef.current.reset()
    spaceDetectorRef.current.reset()

    setStabilizerResult(null)
    setPauseState("IDLE")
    setElapsedPauseMs(0)
  }

  // Save translation to history
  const saveToHistory = async () => {
    if (!sentence || !user) return

    setIsSaving(true)

    try {
      const token = await getToken()

      if (!token) {
        throw new Error("Unauthenticated session")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/user/history`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: "fingerspelling",
            phrase: sentence,
            translation: finalTranslation || sentence,
            confidence: prediction?.confidence || 95,
            duration: 4.5,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Could not log item to database")
      }

      await updateProfileStats(1, 0)

      alert("Translation successfully recorded in history!")
    } catch (e: unknown) {
      console.error(e)

      alert(
        e instanceof Error ? e.message : "Failed to save translation."
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Speak constructed sentence
  const speakSentence = () => {
    if ("speechSynthesis" in window && sentence) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(
        finalTranslation || sentence
      )

      window.speechSynthesis.speak(utterance)
    }
  }

  // Copy sentence
  const copyToClipboard = () => {
    if (sentence) {
      navigator.clipboard.writeText(sentence)

      alert("Sentence copied to clipboard!")
    }
  }

  // Download sentence
  const downloadText = () => {
    if (sentence) {
      const element = document.createElement("a")

      const file = new Blob(
        [`Phrase: ${sentence}\nTranslation: ${finalTranslation || sentence}`],
        {
          type: "text/plain",
        }
      )

      element.href = URL.createObjectURL(file)

      element.download = "sign-translation.txt"

      document.body.appendChild(element)

      element.click()

      document.body.removeChild(element)
    }
  }

  // Controlled Webcam Testing Actions
  const handleCaptureSample = React.useCallback(() => {
    if (handTrackingResult.landmarks.length === 0) {
      alert("No hand currently detected in webcam. Please position your hand in view.")
      return
    }
    const currentLandmarks = handTrackingResult.landmarks[0]
    const detected = handTrackingResult.handedness[0] || testHand
    const newSample = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      groundTruth: testGroundTruth,
      hand: testHand,
      detectedHandedness: detected,
      landmarks: currentLandmarks.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z })),
    }
    setCapturedSamples((prev) => [...prev, newSample])
  }, [handTrackingResult, testGroundTruth, testHand])

  const handleCaptureBurst = React.useCallback(async () => {
    if (handTrackingResult.landmarks.length === 0) {
      alert("No hand currently detected in webcam. Please position your hand in view.")
      return
    }
    setIsCapturingBurst(true)
    for (let i = 0; i < 5; i++) {
      if (handTrackingResult.landmarks.length > 0) {
        const currentLandmarks = handTrackingResult.landmarks[0]
        const detected = handTrackingResult.handedness[0] || testHand
        const newSample = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          groundTruth: testGroundTruth,
          hand: testHand,
          detectedHandedness: detected,
          landmarks: currentLandmarks.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z })),
        }
        setCapturedSamples((prev) => [...prev, newSample])
      }
      await new Promise((r) => setTimeout(r, 120))
    }
    setIsCapturingBurst(false)
  }, [handTrackingResult, testGroundTruth, testHand])

  const orientationEvaluation = React.useMemo(() => {
    if (!modelRef.current || capturedSamples.length === 0) return null

    const model = modelRef.current.model
    const labels = modelRef.current.labels

    const conditions: Array<{ id: OrientationVariant; name: string }> = [
      { id: "ORIGINAL", name: "Condition A: Original Landmarks (As-Is)" },
      { id: "INVERT_ALL_X", name: "Condition B: Invert All X (-X)" },
      { id: "CANONICALIZE_LEFT", name: "Condition C: Handedness Canonicalized (Left -> Right)" },
      { id: "NO_CANONICALIZATION", name: "Condition D: No Canonicalization (Baseline)" },
    ]

    return conditions.map(({ id, name }) => {
      let correct = 0
      let top3Correct = 0
      let rightCorrect = 0
      let rightTotal = 0
      let leftCorrect = 0
      let leftTotal = 0
      let totalConfidence = 0

      const perLetter: Record<string, { total: number; correct: number; rightTotal: number; rightCorrect: number; leftTotal: number; leftCorrect: number }> = {}
      const confusionMap: Record<string, Record<string, number>> = {}

      const predictions = capturedSamples.map((sample) => {
        const pred = predictLandmarksWithVariant(
          sample.landmarks,
          model,
          labels,
          id,
          sample.hand
        )
        const isMatch = pred.label.toUpperCase() === sample.groundTruth.toUpperCase()
        if (isMatch) correct++

        const isInTop3 = pred.topPredictions.some(
          (tp) => tp.label.toUpperCase() === sample.groundTruth.toUpperCase()
        )
        if (isInTop3) top3Correct++

        totalConfidence += pred.confidence

        const gt = sample.groundTruth.toUpperCase()
        const pl = pred.label.toUpperCase()

        if (!perLetter[gt]) {
          perLetter[gt] = { total: 0, correct: 0, rightTotal: 0, rightCorrect: 0, leftTotal: 0, leftCorrect: 0 }
        }
        perLetter[gt].total++
        if (isMatch) perLetter[gt].correct++

        if (sample.hand === "Right") {
          rightTotal++
          perLetter[gt].rightTotal++
          if (isMatch) {
            rightCorrect++
            perLetter[gt].rightCorrect++
          }
        } else {
          leftTotal++
          perLetter[gt].leftTotal++
          if (isMatch) {
            leftCorrect++
            perLetter[gt].leftCorrect++
          }
        }

        if (!isMatch) {
          if (!confusionMap[gt]) confusionMap[gt] = {}
          confusionMap[gt][pl] = (confusionMap[gt][pl] || 0) + 1
        }

        return {
          sampleId: sample.id,
          groundTruth: sample.groundTruth,
          hand: sample.hand,
          predLetter: pred.label,
          confidence: pred.confidence,
          topPredictions: pred.topPredictions,
          isMatch,
          isInTop3,
        }
      })

      const confusedPairs: Array<{ trueLetter: string; predLetter: string; count: number }> = []
      for (const [trueL, predsObj] of Object.entries(confusionMap)) {
        for (const [predL, count] of Object.entries(predsObj)) {
          confusedPairs.push({ trueLetter: trueL, predLetter: predL, count })
        }
      }
      confusedPairs.sort((a, b) => b.count - a.count)

      return {
        id,
        name,
        total: capturedSamples.length,
        accuracy: (correct / capturedSamples.length) * 100,
        top3Accuracy: (top3Correct / capturedSamples.length) * 100,
        rightAccuracy: rightTotal > 0 ? (rightCorrect / rightTotal) * 100 : null,
        rightTotal,
        leftAccuracy: leftTotal > 0 ? (leftCorrect / leftTotal) * 100 : null,
        leftTotal,
        avgConfidence: totalConfidence / capturedSamples.length,
        perLetter,
        confusedPairs,
        predictions,
      }
    })
  }, [capturedSamples])

  // Export Real Webcam Evaluation Report
  const exportWebcamReport = React.useCallback(() => {
    if (!orientationEvaluation || capturedSamples.length === 0) return

    const activeEval = orientationEvaluation[0] // Condition A (Original)
    const report = {
      reportType: "Controlled Live Webcam Evaluation Report",
      generatedAt: new Date().toISOString(),
      model: "MLP Neural Network (63 -> 128 -> 64 -> 26)",
      totalCapturedSamples: capturedSamples.length,
      overallAccuracyPercent: activeEval.accuracy,
      top3AccuracyPercent: activeEval.top3Accuracy,
      averageConfidencePercent: activeEval.avgConfidence,
      rightHandMetrics: {
        totalSamples: activeEval.rightTotal,
        accuracyPercent: activeEval.rightAccuracy,
      },
      leftHandMetrics: {
        totalSamples: activeEval.leftTotal,
        accuracyPercent: activeEval.leftAccuracy,
      },
      perLetterBreakdown: activeEval.perLetter,
      topConfusedPairs: activeEval.confusedPairs.slice(0, 10),
      allOrientationVariantsComparison: orientationEvaluation.map((v) => ({
        variant: v.name,
        overallAccuracy: v.accuracy,
        rightAccuracy: v.rightAccuracy,
        leftAccuracy: v.leftAccuracy,
        top3Accuracy: v.top3Accuracy,
        avgConfidence: v.avgConfidence,
      })),
      capturedSamplesLog: capturedSamples.map((s, idx) => ({
        sampleIndex: idx + 1,
        groundTruth: s.groundTruth,
        hand: s.hand,
        detectedHandedness: s.detectedHandedness,
        variantAPrediction: activeEval.predictions[idx]?.predLetter,
        variantAConfidence: activeEval.predictions[idx]?.confidence,
        isMatch: activeEval.predictions[idx]?.isMatch,
        isInTop3: activeEval.predictions[idx]?.isInTop3,
        top3: activeEval.predictions[idx]?.topPredictions.map((tp) => `${tp.label} (${Math.round(tp.confidence * 100)}%)`),
      })),
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2))
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `webcam_evaluation_report_${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [orientationEvaluation, capturedSamples])

  // Canvas Hand Skeleton Renderer
  const drawHandsOnCanvas = React.useCallback(
    (
      ctx: CanvasRenderingContext2D,
      hands: MediaPipeLandmark[][],
      width: number,
      height: number,
      isMirrored: boolean = true
    ) => {
      ctx.clearRect(0, 0, width, height)

      if (!hands || hands.length === 0) {
        return
      }

      hands.forEach((landmarks, handIdx) => {
        if (!landmarks || landmarks.length !== 21) {
          return
        }

        const pts = landmarks.map((p) => ({
          x: isMirrored ? (1 - p.x) * width : p.x * width,
          y: p.y * height,
        }))

        const boneColor =
          handIdx === 0
            ? "rgba(59, 130, 246, 0.9)"
            : "rgba(16, 185, 129, 0.9)"

        const jointColor =
          handIdx === 0
            ? "rgba(251, 191, 36, 1)"
            : "rgba(52, 211, 153, 1)"

        ctx.strokeStyle = boneColor

        ctx.lineWidth = 3.5
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        MEDIAPIPE_HAND_CONNECTIONS.forEach(([start, end]) => {
          if (pts[start] && pts[end]) {
            ctx.beginPath()

            ctx.moveTo(pts[start].x, pts[start].y)

            ctx.lineTo(pts[end].x, pts[end].y)

            ctx.stroke()
          }
        })

        pts.forEach((p, idx) => {
          ctx.beginPath()

          ctx.arc(p.x, p.y, idx === 0 ? 5.5 : 4, 0, 2 * Math.PI)

          ctx.fillStyle = jointColor

          ctx.fill()

          ctx.strokeStyle = "rgba(255, 255, 255, 0.95)"

          ctx.lineWidth = 1.2

          ctx.stroke()
        })
      })
    },
    []
  )

  // Render Camera Overlay Canvas
  React.useEffect(() => {
    const canvas = overlayCanvasRef.current

    if (!canvas) return

    const ctx = canvas.getContext("2d")

    if (!ctx) return

    if (isWebcamOn && handTrackingResult.detectedHandsCount > 0) {
      const rect = canvas.getBoundingClientRect()

      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width
        canvas.height = rect.height
      }

      drawHandsOnCanvas(
        ctx,
        handTrackingResult.landmarks,
        canvas.width,
        canvas.height,
        true
      )
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [isWebcamOn, handTrackingResult, drawHandsOnCanvas])

  // Render FULL Hand Preview Canvas
  React.useEffect(() => {
    const canvas = sidebarCanvasRef.current

    if (!canvas) return

    const ctx = canvas.getContext("2d")

    if (!ctx) return

    const rect = canvas.getBoundingClientRect()

    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Subtle grid background
    ctx.strokeStyle = "rgba(176, 137, 104, 0.05)"

    ctx.lineWidth = 1

    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }

    for (let j = 0; j < canvas.height; j += 20) {
      ctx.beginPath()
      ctx.moveTo(0, j)
      ctx.lineTo(canvas.width, j)
      ctx.stroke()
    }

    // Draw actual live hand
    if (handTrackingResult.detectedHandsCount > 0) {
      drawHandsOnCanvas(
        ctx,
        handTrackingResult.landmarks,
        canvas.width,
        canvas.height,
        false
      )
    } else {
      // Fallback template
      drawHandsOnCanvas(
        ctx,
        [staticPreviewLandmarks],
        canvas.width,
        canvas.height,
        false
      )
    }
  }, [handTrackingResult, drawHandsOnCanvas])

  // Status Text Helper
  const getStatusText = () => {
    if (!isWebcamOn) return "Camera Off"

    if (!isModelLoaded) return "Loading ASL model..."

    if (modelError) return "Model unavailable"

    if (isMediaPipeLoading) return "Loading MediaPipe..."

    if (mediaPipeError) return "Vision error"

    if (handTrackingResult.detectedHandsCount === 0) {
      return "Waiting for hand"
    }

    if (prediction) {
      if (prediction.confidence < 60) {
        return `Waiting for 60% confidence (${prediction.confidence}%)`
      }
      if (stabilizerResult?.isDuplicateLocked) {
        return `Sign Locked: ${stabilizerResult.lastAcceptedLabel} (Change sign or release hand)`
      }
      if (stabilizerResult?.isStable && stabilizerResult.candidateLabel) {
        const sec = (stabilizerResult.stabilityProgressMs / 1000).toFixed(1)
        return `Holding ${stabilizerResult.candidateLabel} (${sec}s / 3.0s)`
      }
    }

    if (handTrackingResult.detectedHandsCount === 1) {
      return "Tracking 1 Hand"
    }

    return `Tracking ${handTrackingResult.detectedHandsCount} Hands`
  }

  return (
    <ProtectedRoute>
      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="flex flex-col gap-3 -mt-6 md:-mt-8 pb-4"
      >
        {/* CAMERA-FIRST MAIN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* LEFT: TALLER WEBCAM */}
          <div className="lg:col-span-9 flex flex-col">
            <Card className="h-[500px] md:h-[550px] overflow-hidden border border-foreground/5 shadow-md relative bg-black/10 dark:bg-black/40 flex items-center justify-center rounded-2xl">
              {isWebcamOn ? (
                <div className="w-full h-full relative aspect-video flex items-center justify-center">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    mirrored={true}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover rounded-2xl"
                  />

                  {/* Transparent Camera Hand Landmark Overlay */}
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl pointer-events-none z-10"
                  />

                  {/* Live Floating Status Indicators */}
                  <div className="absolute top-3 left-3 flex gap-2 z-20">
                    <Badge className="bg-red-500/20 text-red-500 border border-red-500/35 flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-semibold rounded-full animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      LIVE WEBCAM
                    </Badge>

                    <Badge className="bg-primary/20 text-accent border border-primary/30 rounded-full px-2.5 py-0.5 text-[10px] backdrop-blur-md">
                      MediaPipe Hands + ASL Net v1
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground/45 border border-foreground/5 shadow-inner">
                    <CameraOff className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      Webcam Workspace Offline
                    </h3>

                    <p className="text-xs text-foreground/50 max-w-xs mt-0.5 leading-normal">
                      Click below to start live MediaPipe hand tracking and real-time ASL fingerspelling recognition.
                    </p>
                  </div>

                  <Button
                    onClick={toggleWebcam}
                    disabled={isConnecting}
                    className="rounded-full bg-primary hover:bg-accent text-primary-foreground font-semibold px-6 h-9 text-xs transition-all duration-300 shadow-sm"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Initializing Vision...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-1.5 h-3.5 w-3.5" />
                        Start Camera Workspace
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Bottom Workspace Control Bar */}
              {isWebcamOn && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-foreground/10 z-20 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        stabilizerResult?.acceptedLetter
                          ? "bg-emerald-400 scale-125 animate-ping"
                          : stabilizerResult?.isDuplicateLocked
                          ? "bg-purple-500"
                          : stabilizerResult?.isStable
                          ? "bg-green-500 animate-pulse"
                          : prediction && prediction.confidence >= 60
                          ? "bg-amber-500 animate-pulse"
                          : prediction && prediction.confidence < 60
                          ? "bg-amber-400/80"
                          : "bg-blue-500"
                      }`}
                    />

                    <span className="text-[10.5px] font-semibold text-foreground/80 font-mono">
                      {getStatusText()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOrientationSuiteOpen(!isOrientationSuiteOpen)}
                      className={cn(
                        "h-6 px-2 text-[10px] font-mono rounded",
                        isOrientationSuiteOpen
                          ? "bg-primary/20 text-accent font-bold"
                          : "text-foreground/60 hover:text-foreground"
                      )}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Orientation Suite{capturedSamples.length > 0 ? ` (${capturedSamples.length})` : ""}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDebugOpen(!isDebugOpen)}
                      className="text-foreground/60 hover:text-foreground h-6 px-2 text-[10px] font-mono rounded"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      Debug Console
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleWebcam}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full h-6 px-2.5 font-semibold text-[10px]"
                    >
                      Turn Off
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-3 flex flex-col gap-3 h-[500px] md:h-[550px]">
            {/* HAND PREVIEW */}
            <Card className="flex-1 min-h-0 flex flex-col border border-foreground/5 shadow-sm bg-black/95 dark:bg-black/90 relative overflow-hidden rounded-2xl">
              <CardHeader className="p-2.5 pb-1 border-b border-white/10 shrink-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[9.5px] font-bold text-white/90 uppercase tracking-wider font-mono">
                    Hand Preview
                  </CardTitle>

                  <span
                    className={`text-[8.5px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                      handTrackingResult.detectedHandsCount > 0
                        ? "bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {handTrackingResult.detectedHandsCount > 0
                      ? `LIVE (${handTrackingResult.detectedHandsCount})`
                      : "TEMPLATE"}
                  </span>
                </div>
              </CardHeader>

              {/* FULL HAND PREVIEW */}
              <CardContent className="p-0 flex-1 min-h-0 relative bg-[#0b0c10] overflow-hidden">
                <canvas
                  ref={sidebarCanvasRef}
                  width={560}
                  height={300}
                  className="absolute inset-0 w-full h-full object-fill select-none"
                />

                {!isWebcamOn && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-3 pointer-events-none">
                    <span className="text-[9.5px] font-mono text-white/35">
                      Camera offline
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DETECTED SIGN & CONFIDENCE */}
            <Card className="border border-foreground/5 shadow-sm shrink-0 min-h-[200px] md:min-h-[225px] overflow-hidden">
              <CardContent className="p-3 flex flex-col gap-2 justify-between h-full">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-foreground/5 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-foreground/45">
                      Detected Sign
                    </span>

                    {stabilizerResult?.acceptedLetter ? (
                      <Badge className="bg-emerald-500 text-white border-none text-[7.5px] px-1.5 py-0 font-mono animate-bounce shadow-sm">
                        ACCEPTED!
                      </Badge>
                    ) : stabilizerResult?.isDuplicateLocked ? (
                      <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[7.5px] px-1.5 py-0 font-mono">
                        LOCKED
                      </Badge>
                    ) : stabilizerResult?.isStable ? (
                      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-none text-[7.5px] px-1 py-0 font-mono">
                        STABLE
                      </Badge>
                    ) : prediction && prediction.confidence < 60 ? (
                      <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[7.5px] px-1 py-0 font-mono">
                        WAITING (&lt;60%)
                      </Badge>
                    ) : null}
                  </div>

                  <span className="text-[9px] font-mono text-foreground/45">
                    Min 60% / 3.0s
                  </span>
                </div>

                {/* Primary Prediction Display */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl border font-heading text-2xl font-bold flex items-center justify-center shadow-inner transition-all duration-200 relative shrink-0",
                      prediction && prediction.confidence >= 60
                        ? "bg-primary/10 border-primary/30 text-accent"
                        : prediction
                        ? "bg-amber-500/10 border-amber-500/25 text-amber-600/80"
                        : "bg-foreground/5 border-foreground/10 text-foreground/40"
                    )}
                  >
                    {prediction ? prediction.label : "-"}
                    {stabilizerResult?.isDuplicateLocked && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-sm">
                        🔒
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    {/* Confidence percentage and status */}
                    <div className="flex justify-between items-baseline text-[9px] font-semibold">
                      <span className="text-foreground/55 truncate">
                        Confidence:{" "}
                        {prediction && prediction.confidence < 60 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-normal">
                            Waiting for ≥ 60%
                          </span>
                        ) : prediction ? (
                          <span className="text-green-600 dark:text-green-400 font-mono">
                            Sufficient
                          </span>
                        ) : (
                          <span className="text-foreground/40">-</span>
                        )}
                      </span>

                      <span
                        className={cn(
                          "font-mono font-bold shrink-0 ml-1",
                          (prediction?.confidence || 0) >= 60
                            ? "text-green-600 dark:text-green-400"
                            : "text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {prediction ? `${prediction.confidence}%` : "0%"}
                      </span>
                    </div>

                    {/* Confidence bar with 60% threshold indicator */}
                    <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
                        style={{ left: "60%" }}
                        title="60% Acceptance Threshold"
                      />
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-100",
                          (prediction?.confidence || 0) >= 60 ? "bg-green-500" : "bg-amber-500"
                        )}
                        style={{ width: `${prediction ? prediction.confidence : 0}%` }}
                      />
                    </div>

                    {/* Stability progress text (e.g. 2.1 / 3.0s) */}
                    <div className="flex justify-between items-baseline text-[9px] font-semibold mt-0.5">
                      <span className="text-foreground/60 flex items-center gap-1">
                        <span>Stability:</span>
                        <strong className="text-foreground font-mono">
                          {stabilizerResult
                            ? (stabilizerResult.stabilityProgressMs / 1000).toFixed(1)
                            : "0.0"} / 3.0s
                        </strong>
                      </span>

                      <span
                        className={cn(
                          "text-[8.5px] font-mono",
                          stabilizerResult?.isDuplicateLocked
                            ? "text-purple-600 dark:text-purple-400 font-semibold"
                            : (stabilizerResult?.progressPercentage || 0) >= 100
                            ? "text-emerald-600 font-bold"
                            : (prediction?.confidence || 0) < 60
                            ? "text-amber-600"
                            : "text-foreground/50"
                        )}
                      >
                        {stabilizerResult?.isDuplicateLocked
                          ? "LOCKED"
                          : (prediction?.confidence || 0) < 60
                          ? "Needs ≥ 60%"
                          : `${stabilizerResult?.progressPercentage || 0}%`}
                      </span>
                    </div>

                    {/* Stability progress bar that fills over 3 continuous seconds */}
                    <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden relative">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-100 ease-linear",
                          stabilizerResult?.isDuplicateLocked
                            ? "bg-purple-500"
                            : (stabilizerResult?.progressPercentage || 0) >= 100
                            ? "bg-emerald-500 shadow-sm"
                            : (prediction?.confidence || 0) < 60
                            ? "bg-foreground/20"
                            : "bg-green-500"
                        )}
                        style={{ width: `${stabilizerResult?.progressPercentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Accepted Token & State Row */}
                <div className="flex items-center justify-between border-t border-foreground/5 pt-1.5 text-[9px] font-mono">
                  <span className="text-foreground/60 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-green-500 shrink-0" />
                    Accepted:
                    <strong
                      className={cn(
                        "font-bold text-xs px-1.5 py-0.2 rounded transition-colors",
                        lastAcceptedToken
                          ? "bg-accent/15 text-accent border border-accent/25"
                          : "text-foreground/40"
                      )}
                    >
                      {lastAcceptedToken || "-"}
                    </strong>
                  </span>

                  {stabilizerResult?.isDuplicateLocked ? (
                    <span className="text-purple-600 dark:text-purple-400 text-[8px] font-semibold flex items-center gap-0.5">
                      <span>🔒 Locked while held</span>
                    </span>
                  ) : prediction && prediction.confidence < 60 ? (
                    <span className="text-amber-600 text-[8px]">
                      Requires ≥ 60%
                    </span>
                  ) : stabilizerResult?.isStable ? (
                    <span className="text-green-600 dark:text-green-400 text-[8px]">
                      Hold 3.0s to accept
                    </span>
                  ) : (
                    <span className="text-foreground/40 text-[8px]">
                      Waiting for sign
                    </span>
                  )}
                </div>

                {/* Diagnostic Information */}
                <div className="bg-foreground/[0.03] dark:bg-foreground/[0.05] rounded-lg p-2 border border-foreground/5 text-[9px] font-mono flex flex-col gap-1 mt-1">
                  <div className="flex items-center justify-between text-foreground/50 border-b border-foreground/5 pb-0.5">
                    <span className="font-bold uppercase tracking-wider text-[8px] text-foreground/60">Recognition Diagnostics</span>
                    <span>Handedness: <strong className="text-foreground">{handTrackingResult.handedness[0] || (handTrackingResult.detectedHandsCount > 0 ? "Detected" : "None")}</strong></span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <div>
                      <span className="text-foreground/50">Raw Pred: </span>
                      <strong className="text-foreground">{prediction?.label || "-"}</strong>
                      <span className="text-foreground/40 text-[8px] ml-1">({prediction?.confidence || 0}%)</span>
                    </div>
                    <div>
                      <span className="text-foreground/50">Stabilized: </span>
                      <strong className={cn(
                        stabilizerResult?.stableLabel ? "text-green-600 dark:text-green-400" : "text-amber-600/80"
                      )}>
                        {stabilizerResult?.stableLabel || (prediction && prediction.confidence >= 60 ? "Stabilizing" : "Unstable")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-foreground/50">Accepted: </span>
                      <strong className="text-accent">{lastAcceptedToken || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-foreground/50">Confidence: </span>
                      <strong className={(prediction?.confidence || 0) >= 60 ? "text-green-600 dark:text-green-400" : "text-amber-600"}>
                        {prediction ? `${prediction.confidence}%` : "-"}
                      </strong>
                    </div>
                  </div>
                  <div className="text-[8.5px] truncate pt-0.5 border-t border-foreground/5 text-foreground/60">
                    <span className="text-foreground/50">Top 3: </span>
                    {prediction?.topPredictions && prediction.topPredictions.length > 0 ? (
                      <span className="font-sans text-foreground/80">
                        {prediction.topPredictions.map((p, i) => `${i + 1}. ${p.label} (${Math.round(p.confidence * 100)}%)`).join("  •  ")}
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* DEBUG CONSOLE */}
        {isDebugOpen && (
          <Card className="border border-foreground/10 bg-black/90 text-green-400 font-mono text-[11px] p-3 rounded-xl shadow-lg">
            <div className="flex justify-between border-b border-green-500/20 pb-1 mb-2">
              <span className="font-bold text-white uppercase">
                Phase 4E Pause Space & Backspace Debug Console
              </span>

              <button
                onClick={() => setIsDebugOpen(false)}
                className="text-white/60 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <span className="text-white/50">Raw Predicted Letter:</span>{" "}
                <strong className="text-white">{prediction?.label || "NONE"}</strong>
              </div>

              <div>
                <span className="text-white/50">Confidence:</span>{" "}
                <strong className={(prediction?.confidence || 0) >= 60 ? "text-green-400" : "text-amber-400"}>
                  {prediction ? `${prediction.confidence}%` : "0%"}
                </strong>
              </div>

              <div>
                <span className="text-white/50">Stabilized Prediction:</span>{" "}
                <strong className={stabilizerResult?.stableLabel ? "text-green-400" : "text-amber-400"}>
                  {stabilizerResult?.stableLabel || "UNSTABLE"}
                </strong>
              </div>

              <div>
                <span className="text-white/50">Final Accepted Letter:</span>{" "}
                <strong className="text-white">{lastAcceptedToken || "NONE"}</strong>
              </div>

              <div>
                <span className="text-white/50">Handedness:</span>{" "}
                <strong className="text-cyan-400">{handTrackingResult.handedness[0] || (handTrackingResult.detectedHandsCount > 0 ? "Detected" : "NONE")}</strong>
              </div>

              <div>
                <span className="text-white/50">Candidate:</span>{" "}
                {stabilizerResult?.candidateLabel || "NONE"}
              </div>

              <div className="md:col-span-2">
                <span className="text-white/50">Top 3 Predictions:</span>{" "}
                <span className="text-white">
                  {prediction?.topPredictions && prediction.topPredictions.length > 0
                    ? prediction.topPredictions.map((p, i) => `${i + 1}. ${p.label} (${Math.round(p.confidence * 100)}%)`).join(" | ")
                    : "NONE"}
                </span>
              </div>

              <div>
                <span className="text-white/50">Stability:</span>{" "}
                <strong className="text-green-400">
                  {stabilizerResult ? (stabilizerResult.stabilityProgressMs / 1000).toFixed(1) : "0.0"}s / 3.0s ({stabilizerResult?.progressPercentage || 0}%)
                </strong>
              </div>

              <div>
                <span className="text-white/50">Confidence ≥ 60%:</span>{" "}
                <strong className={(prediction?.confidence || 0) >= 60 ? "text-green-400" : "text-amber-400"}>
                  {(prediction?.confidence || 0) >= 60 ? "YES" : "NO"}
                </strong>
              </div>

              <div>
                <span className="text-white/50">Duplicate Locked:</span>{" "}
                <strong className={stabilizerResult?.isDuplicateLocked ? "text-purple-400" : "text-white/80"}>
                  {stabilizerResult?.isDuplicateLocked ? `TRUE (${stabilizerResult.lastAcceptedLabel})` : "FALSE"}
                </strong>
              </div>

              <div>
                <span className="text-white/50">Sentence Length:</span>{" "}
                {sentence.length} chars
              </div>

              <div>
                <span className="text-white/50">Pause State:</span>{" "}
                <strong className="text-yellow-400">{pauseState}</strong>
              </div>

              <div>
                <span className="text-white/50">Elapsed Pause:</span>{" "}
                {elapsedPauseMs}ms / 1500ms
              </div>

              <div>
                <span className="text-white/50">Pause Threshold:</span> 1500ms
              </div>

              <div>
                <span className="text-white/50">Space Locked:</span>{" "}
                {sentence.endsWith(" ") ? "TRUE" : "FALSE"}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-green-500/20 flex items-center justify-between">
              <div>
                <span className="text-white/50">Rolling Window: </span>

                <span className="text-yellow-400 font-bold">
                  [{stabilizerResult?.rollingWindow.join(", ") || "-"}]
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  stabilizerRef.current.reset()
                  spaceDetectorRef.current.reset()
                  setStabilizerResult(null)
                  setLastAcceptedToken(null)
                  setPauseState("IDLE")
                  setElapsedPauseMs(0)
                }}
                className="h-5 text-[9px] border-green-500/40 text-green-400 hover:bg-green-500/20"
              >
                <RotateCcw className="h-2.5 w-2.5 mr-1" />
                Reset Pipeline State
              </Button>
            </div>
          </Card>
        )}

        {/* CONTROLLED WEBCAM ORIENTATION TESTING SUITE */}
        {isOrientationSuiteOpen && (
          <Card className="border border-primary/25 bg-background/95 backdrop-blur-md shadow-lg rounded-2xl p-4 flex flex-col gap-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-foreground/10 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="font-bold text-foreground text-sm uppercase tracking-wider font-heading">
                  Controlled Webcam Orientation & Validation Suite
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {capturedSamples.length} Samples Stored
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {capturedSamples.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportWebcamReport}
                    className="h-6 px-2.5 text-[10px] font-mono text-accent border-accent/30 hover:bg-accent/10"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export Report (JSON)
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOrientationSuiteOpen(false)}
                  className="h-6 px-2 text-foreground/60 hover:text-foreground text-xs"
                >
                  ✕ Close Suite
                </Button>
              </div>
            </div>

            {/* Workflow Step 1, 2, 3: Target Letter, Hand Selection, Capture */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-foreground/[0.02] dark:bg-foreground/[0.04] p-3 rounded-xl border border-foreground/5">
              {/* Ground Truth Letter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-foreground/70">
                  1. Ground-Truth Letter:
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={testGroundTruth}
                    onChange={(e) => setTestGroundTruth(e.target.value)}
                    className="bg-background border border-foreground/15 rounded-lg px-2.5 py-1 text-sm font-bold text-accent shadow-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
                      <option key={l} value={l}>
                        Letter {l}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-foreground/50">
                    Target: <strong className="text-foreground">{testGroundTruth}</strong>
                  </span>
                </div>
              </div>

              {/* Hand Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-foreground/70">
                  2. Signing Hand:
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={testHand === "Right" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTestHand("Right")}
                    className={cn(
                      "h-7 text-xs px-3 rounded-lg",
                      testHand === "Right" && "bg-accent text-accent-foreground"
                    )}
                  >
                    Right Hand
                  </Button>
                  <Button
                    type="button"
                    variant={testHand === "Left" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTestHand("Left")}
                    className={cn(
                      "h-7 text-xs px-3 rounded-lg",
                      testHand === "Left" && "bg-accent text-accent-foreground"
                    )}
                  >
                    Left Hand
                  </Button>
                  <span className="text-[9.5px] text-foreground/50 ml-1">
                    Live: <strong className="text-foreground">{handTrackingResult.handedness[0] || "None"}</strong>
                  </span>
                </div>
              </div>

              {/* Capture Actions */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-foreground/70">
                  3. Capture Landmarks:
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCaptureSample}
                    disabled={!isWebcamOn || handTrackingResult.detectedHandsCount === 0}
                    className="h-7 text-xs px-3 rounded-lg bg-primary hover:bg-accent text-primary-foreground"
                  >
                    Capture 1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCaptureBurst}
                    disabled={!isWebcamOn || handTrackingResult.detectedHandsCount === 0 || isCapturingBurst}
                    className="h-7 text-xs px-2.5 rounded-lg border-primary/30"
                  >
                    {isCapturingBurst ? "Recording..." : "Capture 5 (Burst)"}
                  </Button>
                  {capturedSamples.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCapturedSamples([])}
                      className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Workflow Step 4, 5, 6: Compare All Orientation Variants */}
            {orientationEvaluation && orientationEvaluation.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="text-[11px] font-semibold text-foreground/70 flex justify-between items-center">
                  <span>Orientation Variant Results (Evaluated on {capturedSamples.length} identical real samples):</span>
                  <span className="text-[10px] text-foreground/50">
                    Client-side landmark evaluation • No media uploaded
                  </span>
                </div>

                {/* Summary Table */}
                <div className="overflow-x-auto rounded-xl border border-foreground/10 bg-background">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-foreground/10 bg-foreground/[0.02]">
                        <th className="p-2 font-bold text-foreground">Condition / Variant</th>
                        <th className="p-2 font-bold text-foreground">Overall Accuracy</th>
                        <th className="p-2 font-bold text-foreground">Top-3 Acc</th>
                        <th className="p-2 font-bold text-foreground">Right Hand Acc</th>
                        <th className="p-2 font-bold text-foreground">Left Hand Acc</th>
                        <th className="p-2 font-bold text-foreground">Avg Confidence</th>
                        <th className="p-2 font-bold text-foreground">Result Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orientationEvaluation.map((stat) => (
                        <tr
                          key={stat.id}
                          className={cn(
                            "border-b border-foreground/5 transition-colors",
                            stat.id === "ORIGINAL" || stat.id === "NO_CANONICALIZATION"
                              ? "bg-green-500/[0.04]"
                              : stat.id === "INVERT_ALL_X"
                              ? "bg-red-500/[0.03]"
                              : ""
                          )}
                        >
                          <td className="p-2 font-semibold">
                            {stat.name}
                            {stat.id === "ORIGINAL" && (
                              <Badge className="ml-2 text-[9px] bg-green-500/20 text-green-700 dark:text-green-300 border-none">
                                Active Model Baseline
                              </Badge>
                            )}
                          </td>
                          <td className="p-2 font-bold text-foreground font-mono">
                            {stat.accuracy.toFixed(1)}%
                          </td>
                          <td className="p-2 font-bold text-accent font-mono">
                            {stat.top3Accuracy.toFixed(1)}%
                          </td>
                          <td className="p-2 font-mono">
                            {stat.rightAccuracy !== null
                              ? `${stat.rightAccuracy.toFixed(1)}% (${stat.rightTotal})`
                              : "No samples"}
                          </td>
                          <td className="p-2 font-mono">
                            {stat.leftAccuracy !== null
                              ? `${stat.leftAccuracy.toFixed(1)}% (${stat.leftTotal})`
                              : "No samples"}
                          </td>
                          <td className="p-2 font-mono">{stat.avgConfidence.toFixed(1)}%</td>
                          <td className="p-2 text-[10px]">
                            {stat.id === "ORIGINAL" || stat.id === "NO_CANONICALIZATION" ? (
                              <span className="text-green-600 dark:text-green-400 font-semibold">
                                ✓ Highest Accuracy (Matches Training Data)
                              </span>
                            ) : stat.id === "INVERT_ALL_X" ? (
                              <span className="text-red-500 font-semibold">
                                ✗ Significant degradation (Inverted X)
                              </span>
                            ) : (
                              <span className="text-amber-600 font-semibold">
                                ~ Inverts Left Hand coordinates
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Stored Samples Detail Table */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex justify-between items-center text-[10.5px] text-foreground/60">
                    <span>Recent Captured Samples ({capturedSamples.length}):</span>
                    <span>Click ✕ on any row to delete</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-foreground/10 bg-background divide-y divide-foreground/5">
                    {capturedSamples.map((sample, sIdx) => {
                      const condA = orientationEvaluation[0]?.predictions.find((p) => p.sampleId === sample.id)
                      const condB = orientationEvaluation[1]?.predictions.find((p) => p.sampleId === sample.id)
                      const condC = orientationEvaluation[2]?.predictions.find((p) => p.sampleId === sample.id)

                      return (
                        <div
                          key={sample.id}
                          className="p-2 flex items-center justify-between text-[10px] hover:bg-foreground/[0.02]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-foreground/40">#{sIdx + 1}</span>
                            <span className="font-bold text-foreground">
                              Target: <strong className="text-accent text-xs">{sample.groundTruth}</strong>
                            </span>
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-mono">
                              {sample.hand}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 font-mono">
                            <span className={cn(condA?.isMatch ? "text-green-600" : "text-red-500")}>
                              Orig: <strong>{condA?.predLetter}</strong> ({condA?.confidence}%) {condA?.isMatch ? "✓" : "✗"}
                            </span>
                            <span className={cn(condB?.isMatch ? "text-green-600" : "text-foreground/45")}>
                              Invert: <strong>{condB?.predLetter}</strong> ({condB?.confidence}%) {condB?.isMatch ? "✓" : "✗"}
                            </span>
                            <span className={cn(condC?.isMatch ? "text-green-600" : "text-foreground/45")}>
                              Canon: <strong>{condC?.predLetter}</strong> ({condC?.confidence}%) {condC?.isMatch ? "✓" : "✗"}
                            </span>

                            <button
                              onClick={() => setCapturedSamples((prev) => prev.filter((s) => s.id !== sample.id))}
                              className="text-foreground/40 hover:text-red-500 px-1"
                              title="Delete sample"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-foreground/50 border border-dashed border-foreground/15 rounded-xl bg-foreground/[0.01]">
                <p className="text-xs">No webcam samples captured yet.</p>
                <p className="text-[10.5px] mt-1 text-foreground/40">
                  Select a target letter and hand, turn on the webcam, and click{" "}
                  <strong>&quot;Capture 1&quot;</strong> or <strong>&quot;Capture 5 (Burst)&quot;</strong> to evaluate all 4 orientation conditions on real webcam landmarks!
                </p>
              </div>
            )}
          </Card>
        )}

        {/* SENTENCE BUILDER */}
        <Card className="border border-foreground/5 shadow-sm">
          <CardContent className="p-3.5 flex flex-col gap-2.5">
            <div className="flex justify-between items-center border-b border-foreground/5 pb-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Sentence Builder
                </span>

                <span className="text-[10px] text-foreground/45">
                  Accepted letter tokens auto-append | 1.5s pause adds space | Manual Backspace enabled
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {lastAcceptedToken && (
                  <KeyframeFlashBadge
                    key={tokenFlashKey}
                    token={lastAcceptedToken}
                  />
                )}

                {pauseState === "SPACE_INSERTED" && (
                  <Badge className="bg-blue-500/20 text-blue-500 border border-blue-500/30 text-[9.5px] font-mono px-2 py-0.5">
                    ␠ Space Added
                  </Badge>
                )}

                <div className="flex items-center gap-1 bg-primary/10 text-accent text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full border border-primary/20">
                  <Sparkles className="h-3 w-3" />

                  <span>Sign-to-Text</span>
                </div>
              </div>
            </div>

            <motion.div
              key={sentence}
              initial={{
                scale: 0.998,
              }}
              animate={{
                scale: 1,
              }}
              className="bg-foreground/[0.01] border border-foreground/5 rounded-xl px-4 py-2.5 min-h-[50px] flex items-center text-foreground font-heading text-xl font-bold tracking-wider relative overflow-hidden whitespace-pre"
            >
              {sentence ? (
                <span className="tracking-wide font-sans font-bold">
                  {sentence}
                </span>
              ) : (
                <span className="text-xs font-normal italic text-foreground/40 font-sans tracking-normal">
                  Perform ASL fingerspelling gestures in front of the camera feed...
                </span>
              )}
            </motion.div>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSentence}
                  disabled={!sentence && !lastAcceptedToken}
                  className="rounded-full border-foreground/15 text-foreground/75 h-7 text-xs px-3"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Clear Builder
                </Button>

                {/* Phase 4E Backspace Control Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackspace}
                  disabled={!sentence}
                  aria-label="Backspace"
                  className="rounded-full border-foreground/15 text-foreground/75 hover:bg-red-500/10 hover:text-red-600 h-7 text-xs px-3"
                >
                  <Delete className="mr-1 h-3.5 w-3.5" />
                  Backspace
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={!sentence}
                  className="rounded-full border-foreground/15 text-foreground/75 h-7 text-xs px-3"
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={speakSentence}
                  disabled={!sentence}
                  className="rounded-full border-foreground/15 text-foreground/75 h-7 text-xs px-3"
                >
                  <Volume2 className="mr-1 h-3.5 w-3.5" />
                  Speak
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadText}
                  disabled={!sentence}
                  className="rounded-full bg-primary/10 hover:bg-primary/20 text-accent font-semibold border-transparent h-7 text-xs px-3.5"
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  Download Data
                </Button>

                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveToHistory}
                    disabled={!sentence || isSaving}
                    className="rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-600 font-semibold border-transparent h-7 text-xs px-3.5"
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />

                    {isSaving ? "Saving..." : "Save History"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LIVE TRANSLATION OUTPUT */}
        <Card className="border border-foreground/5 shadow-sm">
          <CardContent className="p-3 flex flex-col gap-1">
            <span className="text-[9.5px] font-bold text-foreground/40 uppercase tracking-wider font-mono">
              Live Translation Output
            </span>

            <div className="text-sm font-bold text-accent font-sans">
              {isWebcamOn ? (
                sentence ? (
                  sentence
                ) : (
                  <span className="text-xs font-normal italic text-foreground/45">
                    Awaiting ASL letter tokens...
                  </span>
                )
              ) : (
                <span className="text-xs font-normal italic text-foreground/45">
                  Start camera workspace to initialize recognition.
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </ProtectedRoute>
  )
}

// Subtle visual flash badge component
function KeyframeFlashBadge({ token }: { token: string }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.8,
        y: -4,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
      }}
      className="bg-green-500/20 text-green-500 border border-green-500/30 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
    >
      <span>+ Added &apos;{token}&apos;</span>
    </motion.div>
  )
}