export type PauseState = "IDLE" | "ACTIVE" | "PAUSE_PENDING" | "SPACE_INSERTED"

export interface WordSpaceConfig {
  wordPauseMs: number    // Pause duration after last accepted letter to trigger space (default: 1500ms)
  gracePeriodMs: number  // Grace period for brief hand tracking loss (default: 300ms)
}

export class WordSpaceDetector {
  private config: WordSpaceConfig
  private state: PauseState = "IDLE"
  private lastTokenTimestamp: number = 0
  private spaceLocked: boolean = false
  private timerId: NodeJS.Timeout | null = null

  constructor(config?: Partial<WordSpaceConfig>) {
    this.config = {
      wordPauseMs: 1500,
      gracePeriodMs: 300,
      ...config,
    }
  }

  public updateConfig(newConfig: Partial<WordSpaceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Called when a new accepted letter token is produced by PredictionStabilizer.
   * Cancels any pending pause timer and sets state to ACTIVE.
   */
  public onTokenAccepted(): void {
    this.lastTokenTimestamp = Date.now()
    this.state = "ACTIVE"
    this.spaceLocked = false
  }

  /**
   * Called when the user manually deletes a character or space (e.g. Backspace button).
   * Locks space insertion until a new letter token is signed.
   */
  public onManualDelete(): void {
    this.spaceLocked = true
    this.state = "SPACE_INSERTED"
  }

  /**
   * Called on every frame or periodic tick to evaluate if the pause threshold has been reached.
   * Returns true if a space should be inserted into the sentence.
   */
  public evaluate(currentSentence: string): { shouldInsertSpace: boolean; state: PauseState; elapsedMs: number } {
    const now = Date.now()
    const elapsedMs = this.lastTokenTimestamp > 0 ? now - this.lastTokenTimestamp : 0

    // Condition 1: Empty sentence -> No space
    if (!currentSentence || currentSentence.length === 0) {
      this.state = "IDLE"
      return { shouldInsertSpace: false, state: this.state, elapsedMs: 0 }
    }

    // Condition 2: Already ends with a space -> Lock & No space
    if (currentSentence.endsWith(" ")) {
      this.state = "SPACE_INSERTED"
      this.spaceLocked = true
      return { shouldInsertSpace: false, state: this.state, elapsedMs }
    }

    // Condition 3: Space already locked for this pause -> No space
    if (this.spaceLocked) {
      return { shouldInsertSpace: false, state: this.state, elapsedMs }
    }

    // Condition 4: State is ACTIVE and elapsed time >= wordPauseMs -> Insert space!
    if (this.state === "ACTIVE" && elapsedMs >= this.config.wordPauseMs) {
      this.state = "SPACE_INSERTED"
      this.spaceLocked = true
      return { shouldInsertSpace: true, state: this.state, elapsedMs }
    }

    if (this.state === "ACTIVE" && elapsedMs >= (this.config.wordPauseMs - 300)) {
      this.state = "PAUSE_PENDING"
    }

    return { shouldInsertSpace: false, state: this.state, elapsedMs }
  }

  public reset(): void {
    this.state = "IDLE"
    this.lastTokenTimestamp = 0
    this.spaceLocked = false
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  public getState(): PauseState {
    return this.state
  }

  public getDebugInfo(): {
    state: PauseState
    elapsedMs: number
    thresholdMs: number
    spaceLocked: boolean
  } {
    const elapsed = this.lastTokenTimestamp > 0 ? Date.now() - this.lastTokenTimestamp : 0
    return {
      state: this.state,
      elapsedMs: elapsed,
      thresholdMs: this.config.wordPauseMs,
      spaceLocked: this.spaceLocked,
    }
  }
}
