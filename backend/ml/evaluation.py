"""
SENTINEL ML Model Evaluation Module.

Computes comprehensive evaluation metrics (Accuracy, Precision, Recall, F1,
Confusion Matrix, ROC-AUC) across train, validation, and test chronological splits.
"""

import numpy as np

try:
    from sklearn.metrics import (
        accuracy_score,
        precision_score,
        recall_score,
        f1_score,
        confusion_matrix,
        roc_auc_score,
        average_precision_score,
    )
except ImportError:
    accuracy_score = None

from .training import train_model
from .model import SentinelModelWrapper, DEFAULT_MODEL_PATH


def evaluate_split(model, X, y, split_name="Test"):
    """
    Evaluates model on a specific split (X, y) and returns a metrics dictionary.
    """
    if len(X) == 0:
        return {"error": f"Empty split {split_name}"}

    y_pred_proba = model.predict_proba(X)
    y_pred = (y_pred_proba >= 0.5).astype(int)

    acc = float(accuracy_score(y, y_pred))
    prec = float(precision_score(y, y_pred, zero_division=0))
    rec = float(recall_score(y, y_pred, zero_division=0))
    f1 = float(f1_score(y, y_pred, zero_division=0))

    cm = confusion_matrix(y, y_pred, labels=[0, 1])
    tn, fp, fn, tp = [int(val) for val in cm.ravel()]

    roc_auc = None
    pr_auc = None
    if len(np.unique(y)) > 1:
        try:
            roc_auc = float(roc_auc_score(y, y_pred_proba))
            pr_auc = float(average_precision_score(y, y_pred_proba))
        except Exception:
            pass

    return {
        "split": split_name,
        "sample_count": len(X),
        "attack_count": int(np.sum(y)),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "pr_auc": round(pr_auc, 4) if pr_auc is not None else None,
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp,
        },
    }


def run_evaluation(data_dir=None):
    """
    Trains (or loads) the model and executes evaluation across Train, Val, and Test splits.
    """
    model, splits = train_model(data_dir)

    train_metrics = evaluate_split(model, splits["X_train"], splits["y_train"], "Train")
    val_metrics = evaluate_split(model, splits["X_val"], splits["y_val"], "Validation")
    test_metrics = evaluate_split(model, splits["X_test"], splits["y_test"], "Test")

    print("\n" + "=" * 60)
    print("SENTINEL ML EVALUATION RESULTS")
    print("=" * 60)
    for m in [train_metrics, val_metrics, test_metrics]:
        print(f"\n--- {m['split']} Split ({m['sample_count']} samples, {m['attack_count']} attacks) ---")
        print(f"Accuracy:        {m['accuracy'] * 100:.2f}%")
        print(f"Precision:       {m['precision'] * 100:.2f}%")
        print(f"Recall:          {m['recall'] * 100:.2f}%")
        print(f"F1 Score:        {m['f1_score'] * 100:.2f}%")
        if m['roc_auc'] is not None:
            print(f"ROC-AUC:         {m['roc_auc']:.4f}")
        cm = m['confusion_matrix']
        print(f"Confusion Matrix: TP={cm['true_positives']}, FP={cm['false_positives']}, TN={cm['true_negatives']}, FN={cm['false_negatives']}")

    print("\n" + "=" * 60)
    print("DATASET LIMITATIONS & GOVERNANCE NOTES")
    print("=" * 60)
    print("1. Dataset Size: The current dataset contains a controlled sample of synthetic insider scenarios.")
    print("2. Generalization Note: High benchmark performance reflects consistent scenario patterns; real-world production requires continuous retraining on streaming enterprise SIEM logs.")
    print("3. Deterministic Safety: The deterministic behavioral engine acts as an always-on safety baseline regardless of ML confidence.")
    print("=" * 60 + "\n")

    return {
        "model_name": model.model_name,
        "model_version": model.version,
        "trained_at": model.trained_at,
        "splits": {
            "train": train_metrics,
            "validation": val_metrics,
            "test": test_metrics,
        },
    }


if __name__ == "__main__":
    run_evaluation()
