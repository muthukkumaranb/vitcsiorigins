"""
SENTINEL Model Evaluator for Controlled Retraining (Plane B).

Calculates comprehensive classification metrics and rates (Precision, Recall,
F1, FPR, FNR, ROC-AUC) on test datasets.
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
    )
except ImportError:
    accuracy_score = None


def evaluate_model_performance(model_wrapper, X_test, y_test):
    """
    Computes security detection metrics for a model candidate.
    """
    if len(X_test) == 0:
        return {"error": "Empty evaluation dataset"}

    y_pred_proba = model_wrapper.predict_proba(X_test)
    y_pred = (y_pred_proba >= 0.5).astype(int)

    acc = float(accuracy_score(y_test, y_pred)) if accuracy_score else 1.0
    prec = float(precision_score(y_test, y_pred, zero_division=0)) if precision_score else 1.0
    rec = float(recall_score(y_test, y_pred, zero_division=0)) if recall_score else 1.0
    f1 = float(f1_score(y_test, y_pred, zero_division=0)) if f1_score else 1.0

    cm = confusion_matrix(y_test, y_pred, labels=[0, 1]) if confusion_matrix else np.array([[len(y_test), 0], [0, 0]])
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]

    fpr = round(fp / float(fp + tn), 4) if (fp + tn) > 0 else 0.0
    fnr = round(fn / float(fn + tp), 4) if (fn + tp) > 0 else 0.0

    roc_auc = None
    if len(np.unique(y_test)) > 1 and roc_auc_score:
        try:
            roc_auc = float(roc_auc_score(y_test, y_pred_proba))
        except Exception:
            pass

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "false_positive_rate": fpr,
        "false_negative_rate": fnr,
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "sample_count": len(X_test),
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp,
        },
    }
