import os
import json
import numpy as np
import pandas as pd

def validate_dataset():
    dataset_dir = os.path.join("ml", "datasets", "aslnow")
    parquet_path = os.path.join(dataset_dir, "raw_aslnow.parquet")

    print("=" * 60, flush=True)
    print("STEP 2B: VALIDATING DATASET INTEGRITY & SANITY CHECKS...", flush=True)
    print("=" * 60, flush=True)

    if not os.path.exists(parquet_path):
        from ml.scripts.download_dataset import download_aslnow_dataset
        download_aslnow_dataset()

    df = pd.read_parquet(parquet_path)
    total_samples = len(df)

    coord_cols = [f"{c}_{i}" for i in range(21) for c in ['x', 'y', 'z']]

    valid_samples = 0
    invalid_samples = 0
    rejected_reasons = {
        "missing_label": 0,
        "landmark_count_mismatch": 0,
        "nan_or_inf": 0,
        "zero_variance": 0
    }

    for idx, row in df.iterrows():
        label = row.get("label")
        if pd.isna(label) or not str(label).strip():
            invalid_samples += 1
            rejected_reasons["missing_label"] += 1
            continue

        coords = row[coord_cols].values.astype(np.float32)
        if len(coords) != 63:
            invalid_samples += 1
            rejected_reasons["landmark_count_mismatch"] += 1
            continue

        if np.isnan(coords).any() or np.isinf(coords).any():
            invalid_samples += 1
            rejected_reasons["nan_or_inf"] += 1
            continue

        if np.max(coords) == np.min(coords):
            invalid_samples += 1
            rejected_reasons["zero_variance"] += 1
            continue

        valid_samples += 1

    validation_summary = {
        "total_samples": total_samples,
        "valid_samples": valid_samples,
        "invalid_samples": invalid_samples,
        "rejected_reasons": rejected_reasons,
        "validation_passed": invalid_samples == 0
    }

    print(f"Total Samples Inspected:  {total_samples}", flush=True)
    print(f"Valid Samples:            {valid_samples}", flush=True)
    print(f"Invalid / Rejected:       {invalid_samples}", flush=True)
    print(f"Validation Status:        {'PASSED (100% Valid Data)' if invalid_samples == 0 else 'WARNING (Corrupted Data Found)'}", flush=True)

    val_path = os.path.join(dataset_dir, "validation_report.json")
    with open(val_path, "w", encoding="utf-8") as f:
        json.dump(validation_summary, f, indent=2)

    print(f"[OK] Validation report saved to '{val_path}'", flush=True)
    return validation_summary

if __name__ == "__main__":
    validate_dataset()
