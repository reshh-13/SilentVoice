import os
import json
import pandas as pd

def inspect_dataset():
    dataset_dir = os.path.join("ml", "datasets", "aslnow")
    parquet_path = os.path.join(dataset_dir, "raw_aslnow.parquet")

    print("=" * 60, flush=True)
    print("STEP 2: INSPECTING & AUDITING ASLNOW! DATASET...", flush=True)
    print("=" * 60, flush=True)

    if not os.path.exists(parquet_path):
        from ml.scripts.download_dataset import download_aslnow_dataset
        download_aslnow_dataset()

    df = pd.read_parquet(parquet_path)
    total_samples = len(df)
    unique_labels = sorted(df["label"].unique())

    alphabet_az = [chr(c) for c in range(ord('A'), ord('Z') + 1)]
    missing_az = [c for c in alphabet_az if c not in unique_labels]

    class_counts = df["label"].value_counts().to_dict()
    coord_cols = [f"{c}_{i}" for i in range(21) for c in ['x', 'y', 'z']]
    
    null_count = int(df[coord_cols].isnull().sum().sum())
    duplicate_count = int(df.duplicated(subset=coord_cols).sum())

    print(f"Total Valid Dataset Samples: {total_samples}", flush=True)
    print(f"Total Classes Found:          {len(unique_labels)}", flush=True)
    print(f"All A-Z Classes Present:     {'YES' if not missing_az else 'NO (Missing: ' + str(missing_az) + ')'}", flush=True)
    print(f"Total Missing/NaN Values:    {null_count}", flush=True)
    print(f"Duplicate Feature Vectors:   {duplicate_count}", flush=True)

    print("\nSamples Per Class:", flush=True)
    for lbl in alphabet_az:
        cnt = class_counts.get(lbl, 0)
        print(f"  Class '{lbl}': {cnt} samples", flush=True)

    # Temporal Information Analysis for J/Z
    j_count = class_counts.get('J', 0)
    z_count = class_counts.get('Z', 0)
    
    temporal_note = (
        f"ASLNow dataset contains static 21-landmark frames for J ({j_count} samples) and Z ({z_count} samples). "
        "While static landmark postures can be classified, true trajectory motion (J hook, Z zigzag) "
        "requires temporal sequence modeling (LSTM/GRU or sliding buffers) in a future phase."
    )
    print(f"\nJ/Z Temporal Analysis:\n  {temporal_note}", flush=True)

    audit_summary = {
        "dataset_name": "sid220/asl-now-fingerspelling",
        "total_samples": total_samples,
        "num_classes": len(unique_labels),
        "classes": unique_labels,
        "all_az_present": len(missing_az) == 0,
        "missing_az_classes": missing_az,
        "samples_per_class": class_counts,
        "landmark_topology": "21 3D MediaPipe Hand Landmarks (63 numerical values)",
        "null_values": null_count,
        "duplicate_samples": duplicate_count,
        "temporal_analysis_jz": temporal_note
    }

    audit_path = os.path.join(dataset_dir, "dataset_audit.json")
    with open(audit_path, "w", encoding="utf-8") as f:
        json.dump(audit_summary, f, indent=2)

    print(f"\n[OK] Dataset audit saved to '{audit_path}'", flush=True)
    return audit_summary

if __name__ == "__main__":
    inspect_dataset()
