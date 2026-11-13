import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"

export interface MediaPipeLandmark {
  x: number
  y: number
  z: number
}

export interface HandTrackingResult {
  detectedHandsCount: number
  landmarks: MediaPipeLandmark[][]
  handedness: string[]
}

// Official MediaPipe 21-landmark hand connections (20 bone segments)
export const MEDIAPIPE_HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky & Palm Base
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
]

let landmarkerInstance: HandLandmarker | null = null
let isInitializing = false

/**
 * Initializes and returns a singleton instance of MediaPipe HandLandmarker.
 * Configured for GPU delegate, VIDEO running mode, and detection of up to 2 hands.
 */
export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (landmarkerInstance) return landmarkerInstance
  
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (landmarkerInstance) return landmarkerInstance
  }

  isInitializing = true
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
    )
    landmarkerInstance = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    })
    return landmarkerInstance
  } catch (error) {
    console.error("Failed to initialize MediaPipe HandLandmarker:", error)
    throw error
  } finally {
    isInitializing = false
  }
}

/**
 * Safely releases MediaPipe HandLandmarker resources.
 */
export function closeHandLandmarker() {
  if (landmarkerInstance) {
    try {
      landmarkerInstance.close()
    } catch (e) {
      console.warn("Error closing HandLandmarker instance:", e)
    }
    landmarkerInstance = null
  }
}
