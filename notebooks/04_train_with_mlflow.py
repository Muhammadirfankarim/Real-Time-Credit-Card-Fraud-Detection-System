"""
Train LightGBM Model with MLflow Tracking
==========================================

This script trains a fraud detection model with full MLflow integration:
- Experiment tracking (parameters, metrics, artifacts)
- Model registry (versioning, staging, production)
- Auto-logging for LightGBM

Run this script to train and register a new model version.
"""

import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
import joblib
import json
import os
from pathlib import Path
from datetime import datetime

# MLflow imports
import mlflow
import mlflow.lightgbm
from mlflow.models import infer_signature

# ============================================================================
# CONFIGURATION
# ============================================================================

# MLflow settings
MLFLOW_TRACKING_URI = "file:../mlruns"  # Track in root mlruns directory
EXPERIMENT_NAME = "fraud-detection-lightgbm"
MODEL_NAME = "fraud-detector"

# Data paths
DATA_PATH = Path("../data/creditcard.csv")
MODELS_DIR = Path("../models")

# Training parameters
TRAIN_PARAMS = {
    'objective': 'binary',
    'metric': 'auc',
    'boosting_type': 'gbdt',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'feature_fraction': 0.9,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
    'verbose': -1,
    'random_state': 42
}

NUM_BOOST_ROUND = 100
EARLY_STOPPING_ROUNDS = 10

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def load_and_preprocess_data(data_path: Path):
    """Load and preprocess the fraud detection dataset."""
    print(f"📥 Loading dataset from: {data_path}")

    if not data_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {data_path}\n"
            "Download from: https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud"
        )

    # Load data
    df = pd.read_csv(data_path)
    print(f"✅ Loaded {len(df):,} transactions with {df.shape[1]} features")

    # Separate features and target
    X = df.drop('Class', axis=1)
    y = df['Class']

    # Scale Time and Amount only (V1-V28 already PCA-transformed)
    scaler = StandardScaler()
    X[['Time', 'Amount']] = scaler.fit_transform(X[['Time', 'Amount']])

    print(f"✅ Preprocessed features")
    print(f"   Fraud rate: {(y.sum() / len(y) * 100):.3f}%")

    return X, y, scaler


def split_data(X, y, test_size=0.2, random_state=42):
    """Split data with stratification."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=y
    )

    print(f"\n📊 Train-test split:")
    print(f"   Training: {len(X_train):,} samples ({(y_train==1).sum()} fraud)")
    print(f"   Testing:  {len(X_test):,} samples ({(y_test==1).sum()} fraud)")

    return X_train, X_test, y_train, y_test


def calculate_metrics(y_true, y_pred, y_pred_proba):
    """Calculate comprehensive evaluation metrics."""
    metrics = {
        'accuracy': accuracy_score(y_true, y_pred),
        'precision': precision_score(y_true, y_pred, zero_division=0),
        'recall': recall_score(y_true, y_pred, zero_division=0),
        'f1_score': f1_score(y_true, y_pred, zero_division=0),
        'auc': roc_auc_score(y_true, y_pred_proba)
    }

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    metrics.update({
        'tn': int(cm[0][0]),
        'fp': int(cm[0][1]),
        'fn': int(cm[1][0]),
        'tp': int(cm[1][1])
    })

    return metrics


# ============================================================================
# MAIN TRAINING FUNCTION
# ============================================================================

def train_model_with_mlflow():
    """Train LightGBM model with full MLflow tracking."""

    # Setup MLflow
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    mlflow.set_experiment(EXPERIMENT_NAME)

    print("="*70)
    print("🚀 FRAUD DETECTION MODEL TRAINING WITH MLFLOW")
    print("="*70)
    print(f"📊 Experiment: {EXPERIMENT_NAME}")
    print(f"📁 Tracking URI: {MLFLOW_TRACKING_URI}")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)

    # Load and preprocess data
    X, y, scaler = load_and_preprocess_data(DATA_PATH)
    X_train, X_test, y_train, y_test = split_data(X, y)

    # Calculate scale_pos_weight for imbalanced data
    scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
    TRAIN_PARAMS['scale_pos_weight'] = scale_pos_weight

    print(f"\n⚖️  Scale pos weight: {scale_pos_weight:.2f}")

    # Start MLflow run
    with mlflow.start_run(run_name=f"lightgbm_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):

        # Log parameters
        print("\n📝 Logging parameters to MLflow...")
        mlflow.log_params(TRAIN_PARAMS)
        mlflow.log_param("num_boost_round", NUM_BOOST_ROUND)
        mlflow.log_param("early_stopping_rounds", EARLY_STOPPING_ROUNDS)
        mlflow.log_param("test_size", 0.2)
        mlflow.log_param("feature_count", X.shape[1])

        # Log dataset info
        mlflow.log_param("total_samples", len(X))
        mlflow.log_param("fraud_samples", int(y.sum()))
        mlflow.log_param("fraud_rate", float(y.sum() / len(y)))

        # Create LightGBM datasets
        print("\n🏋️  Training LightGBM model...")
        train_data = lgb.Dataset(X_train, label=y_train)
        test_data = lgb.Dataset(X_test, label=y_test, reference=train_data)

        # Train model with callbacks
        callbacks = [
            lgb.early_stopping(stopping_rounds=EARLY_STOPPING_ROUNDS),
            lgb.log_evaluation(period=10)
        ]

        model = lgb.train(
            TRAIN_PARAMS,
            train_data,
            num_boost_round=NUM_BOOST_ROUND,
            valid_sets=[train_data, test_data],
            valid_names=['train', 'test'],
            callbacks=callbacks
        )

        print(f"\n✅ Training complete!")
        print(f"   Best iteration: {model.best_iteration}")
        print(f"   Best score: {model.best_score}")

        # Make predictions
        print("\n📊 Evaluating model...")
        y_pred_proba = model.predict(X_test, num_iteration=model.best_iteration)
        y_pred = (y_pred_proba > 0.5).astype(int)

        # Calculate metrics
        metrics = calculate_metrics(y_test, y_pred, y_pred_proba)

        # Log metrics to MLflow
        print("\n📈 Logging metrics to MLflow...")
        for metric_name, metric_value in metrics.items():
            mlflow.log_metric(metric_name, metric_value)

        # Print metrics
        print("\n" + "="*70)
        print("📊 MODEL PERFORMANCE METRICS")
        print("="*70)
        print(f"Accuracy:  {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
        print(f"Precision: {metrics['precision']:.4f} ({metrics['precision']*100:.2f}%)")
        print(f"Recall:    {metrics['recall']:.4f} ({metrics['recall']*100:.2f}%)")
        print(f"F1-Score:  {metrics['f1_score']:.4f} ({metrics['f1_score']*100:.2f}%)")
        print(f"AUC-ROC:   {metrics['auc']:.4f}")
        print("\n📊 Confusion Matrix:")
        print(f"   TN: {metrics['tn']:,} | FP: {metrics['fp']:,}")
        print(f"   FN: {metrics['fn']:,} | TP: {metrics['tp']:,}")
        print("="*70)

        # Log feature importance
        print("\n🎯 Logging feature importance...")
        feature_importance = pd.DataFrame({
            'feature': X.columns,
            'importance': model.feature_importance(importance_type='gain')
        }).sort_values('importance', ascending=False)

        # Save and log feature importance plot
        import matplotlib.pyplot as plt
        plt.figure(figsize=(10, 8))
        top_features = feature_importance.head(15)
        plt.barh(top_features['feature'], top_features['importance'])
        plt.xlabel('Importance (Gain)')
        plt.title('Top 15 Feature Importance')
        plt.gca().invert_yaxis()
        plt.tight_layout()

        feature_plot_path = "feature_importance.png"
        plt.savefig(feature_plot_path)
        mlflow.log_artifact(feature_plot_path)
        plt.close()
        os.remove(feature_plot_path)

        # Create signature for model
        signature = infer_signature(X_train, y_pred_proba)

        # Log model to MLflow
        print("\n💾 Logging model to MLflow Model Registry...")
        mlflow.lightgbm.log_model(
            model,
            artifact_path="model",
            registered_model_name=MODEL_NAME,
            signature=signature,
            input_example=X_test.head(1)
        )

        # Save scaler as artifact
        print("\n💾 Saving scaler artifact...")
        scaler_path = "scaler.joblib"
        joblib.dump(scaler, scaler_path)
        mlflow.log_artifact(scaler_path)
        os.remove(scaler_path)

        # Save model locally for backup
        print("\n💾 Saving model locally...")
        MODELS_DIR.mkdir(exist_ok=True)

        # Save LightGBM model
        lgbm_path = MODELS_DIR / "fraud_model_lgbm.txt"
        model.save_model(str(lgbm_path))

        # Save scaler
        scaler_path = MODELS_DIR / "scaler_lgbm.joblib"
        joblib.dump(scaler, scaler_path)

        # Save metadata
        metadata = {
            'model_type': 'lightgbm',
            'model_version': '1.0.0',
            'created_at': datetime.now().isoformat(),
            'framework': 'lightgbm',
            'framework_version': lgb.__version__,
            'mlflow_run_id': mlflow.active_run().info.run_id,
            'mlflow_experiment_id': mlflow.active_run().info.experiment_id,
            'feature_count': int(X.shape[1]),
            'features': list(X.columns),
            'best_iteration': int(model.best_iteration),
            'parameters': TRAIN_PARAMS,
            'performance': {k: float(v) if not isinstance(v, int) else v
                          for k, v in metrics.items()},
            'training_data': {
                'total_samples': int(len(X_train)),
                'fraud_samples': int((y_train == 1).sum()),
                'normal_samples': int((y_train == 0).sum())
            },
            'test_data': {
                'total_samples': int(len(X_test)),
                'fraud_samples': int((y_test == 1).sum()),
                'normal_samples': int((y_test == 0).sum())
            },
            'feature_importance': feature_importance.head(15).to_dict('records')
        }

        metadata_path = MODELS_DIR / 'model_metadata_mlflow.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        mlflow.log_artifact(str(metadata_path))

        print(f"\n✅ Model saved locally:")
        print(f"   📁 {lgbm_path}")
        print(f"   📁 {scaler_path}")
        print(f"   📁 {metadata_path}")

        # Get run info
        run_id = mlflow.active_run().info.run_id
        print("\n" + "="*70)
        print("🎉 TRAINING COMPLETE!")
        print("="*70)
        print(f"📊 MLflow Run ID: {run_id}")
        print(f"📁 Model registered as: {MODEL_NAME}")
        print(f"🌐 View in MLflow UI: mlflow ui --port 5001")
        print(f"   Then open: http://localhost:5001")
        print("="*70)

        return model, metrics, run_id


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    try:
        model, metrics, run_id = train_model_with_mlflow()
        print("\n✨ Success! Model is ready for deployment.")

    except Exception as e:
        print(f"\n❌ Error during training: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)
