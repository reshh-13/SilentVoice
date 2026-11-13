import os
import sys
import json
import numpy as np
import pandas as pd
from huggingface_hub import snapshot_download

def download_and_audit():
    dataset_dir = os.path.join("ml", "datasets", "aslnow")
    os.makedirs(dataset_dir, exist_ok=True)
    parquet_path = os.path.join(dataset_dir, "raw_aslnow.parquet")

    print("=" * 60, flush=True)
    print("1. DOWNLOADING ASLNOW! FINGERSPELLING DATASET VIA REPO SNAPSHOT...", flush=True)
    print("=" * 60, flush=True)

    repo_id = "sid220/asl-now-fingerspelling"

    print(f"Downloading snapshot of HuggingFace dataset '{repo_id}'...", flush=True)
    # snapshot_download gets all files efficiently in a single bulk download pass
    repo_local_dir = snapshot_download(repo_id=repo_id, repo_type="dataset")
    print(f"Dataset snapshot downloaded to: {repo_local_dir}", flush=True)

    # Traverse local snapshot directory and parse all JSON files
    parsed_samples = []
    invalid_samples_count = 0

    print("Parsing local landmark JSON files...", flush=True)
    for root, dirs, files in os.walk(repo_local_dir):
        for fname in files:
            if fname.endswith(".json") and not fname.startswith("."):
                file_path = os.path.join(root, fname)
                rel_path = os.path.relpath(file_path, repo_local_dir)
                
                # Folder name corresponds to class label (e.g. A/guid.json -> "A")
                parts = rel_path.replace("\\", "/").split("/")
                if len(parts) >= 2:
                    letter = parts[0].upper()
                else:
                    letter = fname.split("_")[0].upper()

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    if isinstance(data, list) and len(data) == 21:
                        raw_63 = []
                        for pt in data:
                            raw_63.extend([float(pt.get("x", 0.0)), float(pt.get("y", 0.0)), float(pt.get("z", 0.0))])
                        
                        parsed_samples.append({
                            "filename": rel_path,
                            "label": letter,
                            "landmarks": raw_63
                        })
                    else:
                        invalid_samples_count += 1
                except Exception:
                    invalid_samples_count += 1

    print(f"Successfully parsed {len(parsed_samples)} valid landmark JSON samples.", flush=True)

    # Build Pandas DataFrame
    records = []
    for item in parsed_samples:
        rec = {"filename": item["filename"], "label": item["label"]}
        for i in range(21):
            rec[f"x_{i}"] = item["landmarks"][i * 3]
            rec[f"y_{i}"] = item["landmarks"][i * 3 + 1]
            rec[f"z_{i}"] = item["landmarks"][i * 3 + 2]
        records.append(rec)

    df = pd.DataFrame(records)
    df.to_parquet(parquet_path, index=False)
    print(f"[OK] Saved processed dataset dataframe with {len(df)} samples to '{parquet_path}'", flush=True)

    print("\n" + "=" * 60, flush=True)
    print("2. AUDITING DATASET STRUCTURE & QUALITY...", flush=True)
    print("=" * 60, flush=True)

    total_samples = len(df)
    print(f"Total Valid Samples Loaded: {total_samples}", flush=True)
    print(f"Total Invalid / Corrupted Samples Filtered: {invalid_samples_count}", flush=True)

    unique_labels = sorted(df["label"].unique())
    print(f"Unique Labels Count: {len(unique_labels)}", flush=True)
    print(f"Labels: {unique_labels}", flush=True)

    alphabet_az = [chr(c) for c in range(ord('A'), ord('Z') + 1)]
    missing_az_classes = [c for c in alphabet_az if c not in unique_labels]

    print("\nA-Z Class Verification:", flush=True)
    if not missing_az_classes:
        print("  [OK] ALL 26 ALPHABET CLASSES (A-Z) ARE PRESENT IN THE DATASET!", flush=True)
    else:
        print(f"  [WARNING] MISSING A-Z CLASSES: {missing_az_classes}", flush=True)

    class_counts = df["label"].value_counts().to_dict()
    print("\nSamples Per Class Distribution:", flush=True)
    for label, count in sorted(class_counts.items()):
        print(f"  Class {label}: {count} samples", flush=True)

    coord_cols = [f"{c}_{i}" for i in range(21) for c in ['x', 'y', 'z']]
    null_count = int(df[coord_cols].isnull().sum().sum())
    print(f"\nTotal Missing/NaN Values in Coordinates: {null_count}", flush=True)

    duplicate_count = int(df.duplicated(subset=coord_cols).sum())
    print(f"Duplicate Feature Vector Count: {duplicate_count}", flush=True)

    audit_summary = {
        "dataset_name": repo_id,
        "total_samples": total_samples,
        "invalid_samples": invalid_samples_count,
        "num_classes": len(unique_labels),
        "classes": unique_labels,
        "all_az_present": len(missing_az_classes) == 0,
        "missing_az_classes": missing_az_classes,
        "samples_per_class": class_counts,
        "landmark_topology": "21 3D MediaPipe Hand Landmarks (63 numerical values)",
        "null_values": null_count,
        "duplicate_samples": duplicate_count
    }

    audit_path = os.path.join(dataset_dir, "dataset_audit.json")
    with open(audit_path, "w") as f:
        json.dump(audit_summary, f, indent=2)

    print(f"\n[OK] Dataset audit complete. Audit summary saved to '{audit_path}'", flush=True)
    return audit_summary

if __name__ == "__main__":
    download_and_audit()
