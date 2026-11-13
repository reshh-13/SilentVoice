# 🤟 SilentVoice ML Workspace — ASL Fingerspelling Classifier

This directory contains the machine learning pipeline for SilentVoice's ASL Fingerspelling Recognition model (`fingerspelling-v1`).

---

## 📂 Workspace Structure

```
ml/
├── datasets/             # Raw and preprocessed dataset storage
│   └── aslnow/           # ASLNow dataset snapshot & numpy matrices (X.npy, y.npy)
├── preprocessing/        # Standardized landmark normalization module
│   └── landmark_processor.py
├── training/             # Training routines for Random Forest & MLP
├── evaluation/           # Metrics reports & confusion matrices
│   └── evaluation_results.json
├── models/               # Saved trained model checkpoints (.joblib)
├── scripts/              # Modular pipeline execution scripts
│   ├── download_dataset.py
│   ├── inspect_dataset.py
│   ├── preprocess_dataset.py
│   ├── train.py
│   ├── evaluate.py
│   ├── export_model.py
│   ├── verify_inference.py
│   └── run_pipeline.py
├── requirements.txt      # Minimal Python ML dependencies
└── README.md             # Pipeline documentation
```

---

## ⚙️ Installation & Setup

Install the required ML dependencies in your Python 3.12+ environment:

```bash
pip install -r ml/requirements.txt
```

---

## 🚀 Execution Pipeline

You can run the end-to-end ML pipeline with a single command:

```bash
python ml/scripts/run_pipeline.py
```

### Or run each modular step individually:

#### 1. Download Dataset
Downloads the public ASLNow! dataset from HuggingFace (`sid220/asl-now-fingerspelling`):
```bash
python ml/scripts/download_dataset.py
```

#### 2. Inspect & Audit Dataset
Audits sample counts, class distributions, missing values, duplicates, and J/Z temporal limits:
```bash
python ml/scripts/inspect_dataset.py
```

#### 3. Preprocess Landmark Features
Translates 21 MediaPipe hand landmarks relative to the wrist (landmark 0) and normalizes hand scale:
```bash
python ml/scripts/preprocess_dataset.py
```

#### 4. Train Baseline Models
Trains Random Forest (120 trees) and MLP Neural Network (128x64) on preprocessed features:
```bash
python ml/scripts/train.py
```

#### 5. Evaluate Models
Computes Accuracy, Precision, Recall, F1 score, latency, and confusion matrix:
```bash
python ml/scripts/evaluate.py
```

#### 6. Export Browser Artifacts
Exports trained model weights, `labels.json`, `preprocessing.json`, and `VERSION` to `frontend/public/models/fingerspelling/`:
```bash
python ml/scripts/export_model.py
```

#### 7. Verify Browser Inference
Runs a simulated forward-pass test on exported model artifacts:
```bash
python ml/scripts/verify_inference.py
```

---

## 📐 Preprocessing Formula

The preprocessing transformation in `ml/preprocessing/landmark_processor.py` performs:

1. **Wrist Centering:** `p_centered[i] = landmark[i] - wrist (landmark 0)`
2. **Scale Normalization:** `p_norm[i] = p_centered[i] / max(distance(p_centered))`
3. **Feature Vector:** Flattened `[x0_norm, y0_norm, z0_norm, ..., x20_norm, y20_norm, z20_norm]` (63 floats).

This exact formula is reproduced 1:1 in TypeScript for browser inference.
