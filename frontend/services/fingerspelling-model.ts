import { MediaPipeLandmark } from "./mediapipe"

export interface ClassProbability {
  label: string
  confidence: number // Normalized 0.0 to 1.0
}

export interface ASLPrediction {
  label: string
  confidence: number // Percentage 0 - 100
  topPredictions: ClassProbability[]
  timestamp: number
  featureVectorLength: number
}

export interface ModelWeightsData {
  version: string
  architecture: number[]
  activation: string
  output_activation: string
  weights: number[][][]
  biases: number[][]
  classes: (string | number)[]
}

let cachedModelData: ModelWeightsData | null = null
let cachedLabels: string[] | null = null
let isModelLoading = false

/**
 * 1:1 MATHEMATICAL EQUIVALENT PREPROCESSING
 * Matches Python implementation in `ml/preprocessing/landmark_processor.py`:
 * 1. Wrist Centering: Subtract wrist coordinate (landmark 0) from all 21 points.
 * 2. Scale Normalization: Divide coordinates by maximum Euclidean distance from wrist.
 * 3. Flattening: Output 63-element float array [x0, y0, z0, ..., x20, y20, z20].
 */
export function preprocessLandmarks(rawLandmarks: MediaPipeLandmark[]): number[] {
  if (!rawLandmarks || rawLandmarks.length !== 21) {
    throw new Error(`Invalid landmark count: expected 21, received ${rawLandmarks?.length ?? 0}`)
  }

  const wrist = rawLandmarks[0]

  // Step 1: Center coordinates relative to wrist (landmark 0)
  const centered = rawLandmarks.map((lm) => ({
    x: lm.x - wrist.x,
    y: lm.y - wrist.y,
    z: lm.z - wrist.z,
  }))

  // Step 2: Compute Euclidean distance from wrist for each landmark
  const distances = centered.map((p) => Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z))
  let maxDist = Math.max(...distances)
  if (maxDist < 1e-6) {
    maxDist = 1.0
  }

  // Step 3: Scale normalize and flatten into 63-element vector
  const featureVector: number[] = []
  centered.forEach((p) => {
    featureVector.push(p.x / maxDist)
    featureVector.push(p.y / maxDist)
    featureVector.push(p.z / maxDist)
  })

  return featureVector
}

/**
 * Singleton model loader - loads weights & labels once from /models/fingerspelling/
 */
export async function loadFingerspellingModel(): Promise<{ model: ModelWeightsData; labels: string[] }> {
  if (cachedModelData && cachedLabels) {
    return { model: cachedModelData, labels: cachedLabels }
  }

  if (isModelLoading) {
    // Wait briefly if currently loading
    while (isModelLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    if (cachedModelData && cachedLabels) {
      return { model: cachedModelData, labels: cachedLabels }
    }
  }

  isModelLoading = true
  try {
    const [weightsRes, labelsRes] = await Promise.all([
      fetch("/models/fingerspelling/model/model_weights.json"),
      fetch("/models/fingerspelling/labels.json"),
    ])

    if (!weightsRes.ok) {
      throw new Error(`Failed to load model weights: ${weightsRes.statusText}`)
    }
    if (!labelsRes.ok) {
      throw new Error(`Failed to load labels metadata: ${labelsRes.statusText}`)
    }

    const weightsData: ModelWeightsData = await weightsRes.json()
    const labelsData = await labelsRes.json()

    cachedModelData = weightsData
    cachedLabels = labelsData.classes || [
      "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"
    ]

    if (!cachedModelData || !cachedLabels) {
      throw new Error("Failed to load ASL fingerspelling model weights or labels.")
    }

    return { model: cachedModelData, labels: cachedLabels }
  } finally {
    isModelLoading = false
  }
}

/**
 * Orientation test variants for empirical webcam validation
 */
export type OrientationVariant =
  | "ORIGINAL"
  | "INVERT_ALL_X"
  | "CANONICALIZE_LEFT"
  | "NO_CANONICALIZATION"

/**
 * Evaluates a preprocessed 63-element feature vector through the MLP model
 */
export function predictFeatureVector(
  featureVector: number[],
  modelData: ModelWeightsData,
  labels: string[]
): ASLPrediction {
  const { weights, biases } = modelData
  let activation = featureVector

  // Dense Hidden Layers (ReLU)
  for (let layerIdx = 0; layerIdx < weights.length - 1; layerIdx++) {
    const layerW = weights[layerIdx] // Shape: [inputDim, outputDim]
    const layerB = biases[layerIdx]  // Shape: [outputDim]
    const nextActivation: number[] = new Array(layerB.length).fill(0)

    for (let outCol = 0; outCol < layerB.length; outCol++) {
      let sum = layerB[outCol]
      for (let inRow = 0; inRow < activation.length; inRow++) {
        sum += activation[inRow] * layerW[inRow][outCol]
      }
      // ReLU activation
      nextActivation[outCol] = Math.max(0, sum)
    }
    activation = nextActivation
  }

  // Final Output Layer (Logits + Softmax)
  const finalW = weights[weights.length - 1]
  const finalB = biases[biases.length - 1]
  const logits: number[] = new Array(finalB.length).fill(0)

  for (let outCol = 0; outCol < finalB.length; outCol++) {
    let sum = finalB[outCol]
    for (let inRow = 0; inRow < activation.length; inRow++) {
      sum += activation[inRow] * finalW[inRow][outCol]
    }
    logits[outCol] = sum
  }

  // Softmax
  const maxLogit = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - maxLogit))
  const sumExps = exps.reduce((acc, val) => acc + val, 0)
  const probs = exps.map((val) => val / sumExps)

  // Map to class labels
  const classProbs: ClassProbability[] = probs.map((prob, idx) => ({
    label: String(labels[idx] ?? idx),
    confidence: prob,
  }))

  // Sort descending by confidence
  classProbs.sort((a, b) => b.confidence - a.confidence)

  const top1 = classProbs[0]
  const confidencePercent = Math.round(top1.confidence * 100)

  return {
    label: top1.label,
    confidence: confidencePercent,
    topPredictions: classProbs.slice(0, 3),
    timestamp: Date.now(),
    featureVectorLength: featureVector.length,
  }
}

/**
 * Matrix multiplication forward pass using loaded model weights
 */
export function predictLandmarks(
  rawLandmarks: MediaPipeLandmark[],
  modelData: ModelWeightsData,
  labels: string[]
): ASLPrediction {
  const x = preprocessLandmarks(rawLandmarks)
  return predictFeatureVector(x, modelData, labels)
}

/**
 * Evaluates raw landmarks under a specific orientation condition for comparison testing
 */
export function predictLandmarksWithVariant(
  rawLandmarks: MediaPipeLandmark[],
  modelData: ModelWeightsData,
  labels: string[],
  variant: OrientationVariant = "ORIGINAL",
  handedness: string = "Right"
): ASLPrediction {
  const x = preprocessLandmarks(rawLandmarks)

  if (variant === "INVERT_ALL_X") {
    // Condition B: Invert all X coordinates relative to wrist
    for (let i = 0; i < x.length; i += 3) {
      x[i] = -x[i]
    }
  } else if (variant === "CANONICALIZE_LEFT") {
    // Condition C: If Left hand, invert X so it matches Right hand orientation
    if (handedness.toLowerCase().includes("left")) {
      for (let i = 0; i < x.length; i += 3) {
        x[i] = -x[i]
      }
    }
  }
  // Condition A and D: Original landmarks / No canonicalization

  return predictFeatureVector(x, modelData, labels)
}
