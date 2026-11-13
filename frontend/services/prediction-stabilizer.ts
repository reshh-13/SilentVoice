import type { ASLPrediction } from "./fingerspelling-model"

export interface StabilizerConfig {
  windowSize: number           // Rolling window size (default: 5 frames)
  confidenceThreshold: number  // Minimum confidence threshold: 60 (%)
  majorityCount: number        // Minimum matching frames in window to achieve majority (default: 3)
  stabilityDurationMs: number  // Continuous stability duration required to accept letter (default: 3000 ms)
  handLossGraceMs: number      // Time without hand before rearming duplicate lock (default: 400 ms)
}

export interface StabilizerResult {
  rawPrediction: ASLPrediction | null
  stableLabel: string | null            // Currently stable gesture label (or null if unstable/below threshold)
  candidateLabel: string | null         // Letter currently accumulating stability time
  acceptedLetter: string | null         // Newly accepted letter token (triggers once on the exact frame condition is met)
  isStable: boolean                     // True if stable label exists and confidence >= 60%
  isDuplicateLocked: boolean            // True if currently holding an already-accepted letter
  rollingWindow: string[]               // Last N prediction labels in window
  stabilityProgressMs: number           // Elapsed continuous stability time in ms (0 to 3000)
  targetStabilityMs: number             // Target stability time in ms (3000)
  progressPercentage: number            // 0 to 100
  isConfidenceSufficient: boolean       // True if current confidence >= 60%
  lastAcceptedLabel: string | null      // The last accepted letter currently locked while held
}

export class PredictionStabilizer {
  private config: StabilizerConfig
  private window: ASLPrediction[] = []
  private lastAcceptedLabel: string | null = null
  private currentStableLabel: string | null = null
  private candidateLetter: string | null = null
  private candidateStartTime: number | null = null
  private lastHandSeenTime: number | null = null

  constructor(config?: Partial<StabilizerConfig>) {
    this.config = {
      windowSize: 5,
      confidenceThreshold: 60,
      majorityCount: 3,
      stabilityDurationMs: 3000,
      handLossGraceMs: 400,
      ...config,
    }
  }

  public updateConfig(newConfig: Partial<StabilizerConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  public getConfig(): Readonly<StabilizerConfig> {
    return this.config
  }

  /**
   * Process a single video frame prediction.
   * Calculates continuous stability duration based on timestamps (Date.now() or explicit `now`).
   *
   * Rules:
   * 1. Requires confidence >= 60% and same stable prediction for 3 continuous seconds (3000ms).
   * 2. If confidence drops below 60%, stability timer is reset.
   * 3. If stable letter changes, stability timer restarts for the new letter.
   * 4. If hand is lost, pending stability timer resets immediately.
   * 5. Once accepted, that letter is locked until user switches to a different sign or removes hand.
   */
  public processFrame(pred: ASLPrediction | null, now: number = Date.now()): StabilizerResult {
    let acceptedLetter: string | null = null

    // 1. Hand tracking lost or null prediction
    if (!pred) {
      // Pending stability timer resets immediately
      this.candidateLetter = null
      this.candidateStartTime = null
      this.currentStableLabel = null

      this.window.push({
        label: "-",
        confidence: 0,
        topPredictions: [],
        timestamp: now,
        featureVectorLength: 63,
      })
      if (this.window.length > this.config.windowSize) {
        this.window.shift()
      }

      // Rearm duplicate lock after hand loss grace period
      if (this.lastHandSeenTime !== null && now - this.lastHandSeenTime >= this.config.handLossGraceMs) {
        this.lastAcceptedLabel = null
      }

      return {
        rawPrediction: null,
        stableLabel: null,
        candidateLabel: null,
        acceptedLetter: null,
        isStable: false,
        isDuplicateLocked: this.lastAcceptedLabel !== null,
        rollingWindow: this.window.map((p) => p.label),
        stabilityProgressMs: 0,
        targetStabilityMs: this.config.stabilityDurationMs,
        progressPercentage: 0,
        isConfidenceSufficient: false,
        lastAcceptedLabel: this.lastAcceptedLabel,
      }
    }

    // Hand is actively detected
    this.lastHandSeenTime = now

    // 2. Check confidence threshold (< 60%)
    const isConfidenceSufficient = pred.confidence >= this.config.confidenceThreshold
    if (!isConfidenceSufficient) {
      // If confidence drops below 60%, reset the stability timer immediately
      this.candidateLetter = null
      this.candidateStartTime = null
      this.currentStableLabel = null

      this.window.push({
        label: "-",
        confidence: pred.confidence,
        topPredictions: pred.topPredictions,
        timestamp: now,
        featureVectorLength: pred.featureVectorLength,
      })
      if (this.window.length > this.config.windowSize) {
        this.window.shift()
      }

      return {
        rawPrediction: pred,
        stableLabel: null,
        candidateLabel: null,
        acceptedLetter: null,
        isStable: false,
        isDuplicateLocked: this.lastAcceptedLabel !== null,
        rollingWindow: this.window.map((p) => p.label),
        stabilityProgressMs: 0,
        targetStabilityMs: this.config.stabilityDurationMs,
        progressPercentage: 0,
        isConfidenceSufficient: false,
        lastAcceptedLabel: this.lastAcceptedLabel,
      }
    }

    // 3. Valid prediction with confidence >= 60%
    this.window.push(pred)
    if (this.window.length > this.config.windowSize) {
      this.window.shift()
    }

    // Count label frequencies in rolling window
    const counts: Record<string, number> = {}
    for (const p of this.window) {
      if (p.label !== "-") {
        counts[p.label] = (counts[p.label] || 0) + 1
      }
    }

    let topLabel: string | null = null
    let maxCount = 0
    for (const [lbl, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count
        topLabel = lbl
      }
    }

    const isWindowMajority = topLabel !== null && maxCount >= this.config.majorityCount
    this.currentStableLabel = isWindowMajority ? topLabel : null

    // Window hasn't reached majority yet
    if (!this.currentStableLabel) {
      this.candidateLetter = null
      this.candidateStartTime = null

      return {
        rawPrediction: pred,
        stableLabel: null,
        candidateLabel: null,
        acceptedLetter: null,
        isStable: false,
        isDuplicateLocked: this.lastAcceptedLabel !== null,
        rollingWindow: this.window.map((p) => p.label),
        stabilityProgressMs: 0,
        targetStabilityMs: this.config.stabilityDurationMs,
        progressPercentage: 0,
        isConfidenceSufficient: true,
        lastAcceptedLabel: this.lastAcceptedLabel,
      }
    }

    const activeLabel = this.currentStableLabel

    // 4. Duplicate Lock: If user is still holding the same accepted sign, lock and do not re-accept
    if (activeLabel === this.lastAcceptedLabel) {
      return {
        rawPrediction: pred,
        stableLabel: activeLabel,
        candidateLabel: activeLabel,
        acceptedLetter: null,
        isStable: true,
        isDuplicateLocked: true,
        rollingWindow: this.window.map((p) => p.label),
        stabilityProgressMs: this.config.stabilityDurationMs,
        targetStabilityMs: this.config.stabilityDurationMs,
        progressPercentage: 100,
        isConfidenceSufficient: true,
        lastAcceptedLabel: this.lastAcceptedLabel,
      }
    }

    // 5. User transitioned to a different letter -> Rearm recognition
    if (this.lastAcceptedLabel !== null) {
      this.lastAcceptedLabel = null
    }

    // 6. Stability timing logic
    if (activeLabel !== this.candidateLetter) {
      // A different letter became the stable prediction -> restart the timer for that letter
      this.candidateLetter = activeLabel
      this.candidateStartTime = now
    } else if (this.candidateStartTime === null) {
      this.candidateStartTime = now
    }

    const elapsedMs = Math.min(now - this.candidateStartTime, this.config.stabilityDurationMs)
    const progressPercentage = Math.min(
      100,
      Math.round((elapsedMs / this.config.stabilityDurationMs) * 100)
    )

    // 7. Check 3 continuous seconds threshold
    if (elapsedMs >= this.config.stabilityDurationMs) {
      // 3 Continuous seconds achieved -> ACCEPT LETTER
      acceptedLetter = this.candidateLetter
      this.lastAcceptedLabel = this.candidateLetter
      this.candidateLetter = null
      this.candidateStartTime = null

      return {
        rawPrediction: pred,
        stableLabel: activeLabel,
        candidateLabel: activeLabel,
        acceptedLetter,
        isStable: true,
        isDuplicateLocked: true,
        rollingWindow: this.window.map((p) => p.label),
        stabilityProgressMs: this.config.stabilityDurationMs,
        targetStabilityMs: this.config.stabilityDurationMs,
        progressPercentage: 100,
        isConfidenceSufficient: true,
        lastAcceptedLabel: this.lastAcceptedLabel,
      }
    }

    return {
      rawPrediction: pred,
      stableLabel: activeLabel,
      candidateLabel: this.candidateLetter,
      acceptedLetter: null,
      isStable: true,
      isDuplicateLocked: false,
      rollingWindow: this.window.map((p) => p.label),
      stabilityProgressMs: elapsedMs,
      targetStabilityMs: this.config.stabilityDurationMs,
      progressPercentage,
      isConfidenceSufficient: true,
      lastAcceptedLabel: this.lastAcceptedLabel,
    }
  }

  public reset(): void {
    this.window = []
    this.lastAcceptedLabel = null
    this.currentStableLabel = null
    this.candidateLetter = null
    this.candidateStartTime = null
    this.lastHandSeenTime = null
  }

  public resetTimer(): void {
    this.candidateLetter = null
    this.candidateStartTime = null
  }

  public rearm(): void {
    this.lastAcceptedLabel = null
  }

  public getLastAcceptedLabel(): string | null {
    return this.lastAcceptedLabel
  }
}

