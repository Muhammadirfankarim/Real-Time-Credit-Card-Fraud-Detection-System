"""
Model Loader - Environment-Aware Model Loading
================================================

Supports two modes:
1. Development (local): Load from MLflow
2. Production: Load from Hugging Face Hub

Set via environment variable: MODEL_SOURCE=mlflow|huggingface
"""

import os
import joblib
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Try to import optional dependencies
try:
    from huggingface_hub import hf_hub_download
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False
    logger.warning("huggingface_hub not installed. HF loading disabled.")

try:
    import mlflow
    import mlflow.lightgbm
    from mlflow.tracking import MlflowClient
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False
    logger.warning("MLflow not installed. MLflow loading disabled.")


# Configuration
MODEL_SOURCE = os.getenv("MODEL_SOURCE", "mlflow")  # "mlflow" or "huggingface"
HF_MODEL_REPO = os.getenv("HF_MODEL_REPO", "irfankarim/fraud-detection-lightgbm-v1")
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "file:./mlruns")
MODEL_NAME = "fraud-detector"
MODEL_STAGE = "Production"


def load_model_from_huggingface() -> Optional[Dict[str, Any]]:
    """
    Load model from Hugging Face Hub
    
    Environment variables:
        HF_MODEL_REPO: Repository ID (e.g., "username/model-name")
    
    Returns:
        Dict with model, scaler, and metadata, or None if failed
    """
    if not HF_AVAILABLE:
        logger.error("huggingface_hub not installed. Install with: pip install huggingface_hub")
        return None
    
    try:
        logger.info(f"📦 Loading model from Hugging Face: {HF_MODEL_REPO}")
        
        # Download model files from HF Hub
        model_path = hf_hub_download(
            repo_id=HF_MODEL_REPO,
            filename="model.pkl",
            cache_dir="./hf_cache"
        )
        
        # Try different scaler filenames (compatibility)
        scaler_path = None
        for scaler_filename in ["scaler.joblib", "scaler_lgbm.joblib", "scaler.pkl"]:
            try:
                scaler_path = hf_hub_download(
                    repo_id=HF_MODEL_REPO,
                    filename=scaler_filename,
                    cache_dir="./hf_cache"
                )
                logger.info(f"Found scaler: {scaler_filename}")
                break
            except Exception:
                continue
        
        if not scaler_path:
            logger.warning("No scaler found in HF repo, proceeding without scaler")
        
        # Load model and scaler
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path) if scaler_path else None
        
        logger.info("✅ Model loaded successfully from Hugging Face")
        
        return {
            'model': model,
            'scaler': scaler,
            'name': HF_MODEL_REPO.split('/')[-1],
            'version': 'latest',
            'stage': 'Production',
            'source': 'huggingface',
            'repo': HF_MODEL_REPO
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to load from Hugging Face: {e}")
        return None


def load_model_from_mlflow() -> Optional[Dict[str, Any]]:
    """
    Load model from MLflow Model Registry
    
    Environment variables:
        MLFLOW_TRACKING_URI: MLflow tracking server URI
        MODEL_NAME: Registered model name
        MODEL_STAGE: Model stage (Production, Staging, None)
    
    Returns:
        Dict with model, scaler, and metadata, or None if failed
    """
    if not MLFLOW_AVAILABLE:
        logger.error("MLflow not installed. Install with: pip install mlflow")
        return None
    
    try:
        logger.info(f"📦 Loading model from MLflow Registry: {MODEL_NAME}/{MODEL_STAGE}")
        
        # Set tracking URI
        mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
        client = MlflowClient()
        
        # Get model version from stage
        try:
            model_versions = client.get_latest_versions(MODEL_NAME, stages=[MODEL_STAGE])
            if not model_versions:
                raise ValueError(f"No model found in '{MODEL_STAGE}' stage")
            
            model_version = model_versions[0]
            model_uri = f"models:/{MODEL_NAME}/{MODEL_STAGE}"
            
        except Exception as e:
            # Fallback: Try to get latest version regardless of stage
            logger.warning(f"Failed to load from stage '{MODEL_STAGE}': {e}")
            logger.info("Trying to load latest version...")
            
            versions = client.search_model_versions(f"name='{MODEL_NAME}'")
            if not versions:
                raise ValueError(f"No versions found for model '{MODEL_NAME}'")
            
            # Get latest by version number
            model_version = max(versions, key=lambda v: int(v.version))
            model_uri = f"models:/{MODEL_NAME}/{model_version.version}"
        
        # Load model
        model = mlflow.lightgbm.load_model(model_uri)
        
        # Load scaler from artifacts
        run_id = model_version.run_id
        artifact_path = client.download_artifacts(run_id, "scaler.joblib")
        scaler = joblib.load(artifact_path)
        
        logger.info(f"✅ Model loaded successfully from MLflow (version {model_version.version})")
        
        return {
            'model': model,
            'scaler': scaler,
            'name': MODEL_NAME,
            'version': model_version.version,
            'stage': model_version.current_stage,
            'source': 'mlflow',
            'run_id': run_id
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to load from MLflow: {e}")
        return None


def load_model_from_local_files() -> Optional[Dict[str, Any]]:
    """
    Load model from local files (last resort fallback)
    
    Returns:
        Dict with model, scaler, and metadata, or None if failed
    """
    try:
        logger.info("📦 Loading model from local files...")
        
        # Try common locations
        possible_paths = [
            Path("models/model.pkl"),
            Path("artifacts/model/model.pkl"),
            Path("mlruns/models/model.pkl"),
        ]
        
        model_path = None
        for path in possible_paths:
            if path.exists():
                model_path = path
                break
        
        if not model_path:
            logger.error("No local model file found")
            return None
        
        # Load model
        model = joblib.load(model_path)
        
        # Try to find scaler
        scaler_path = model_path.parent / "scaler.joblib"
        if not scaler_path.exists():
            scaler_path = model_path.parent / "scaler.pkl"
        
        scaler = joblib.load(scaler_path) if scaler_path.exists() else None
        
        logger.info("✅ Model loaded from local files")
        
        return {
            'model': model,
            'scaler': scaler,
            'name': 'fraud-detector',
            'version': 'local',
            'stage': 'Development',
            'source': 'local',
            'path': str(model_path)
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to load from local files: {e}")
        return None


def load_model() -> Dict[str, Any]:
    """
    Load model from the configured source with intelligent fallback
    
    Priority:
    1. Use MODEL_SOURCE env var (mlflow or huggingface)
    2. Fallback to alternative source if primary fails
    3. Last resort: local files
    
    Returns:
        Dict with model, scaler, and metadata
    
    Raises:
        RuntimeError: If model cannot be loaded from any source
    """
    logger.info(f"🚀 Model loading strategy: {MODEL_SOURCE}")
    
    model_data = None
    
    # Try primary source
    if MODEL_SOURCE.lower() == "huggingface":
        model_data = load_model_from_huggingface()
        
        # Fallback to MLflow if HF fails
        if not model_data:
            logger.warning("Hugging Face loading failed, trying MLflow...")
            model_data = load_model_from_mlflow()
            
    else:  # Default to MLflow
        model_data = load_model_from_mlflow()
        
        # Fallback to HF if MLflow fails
        if not model_data:
            logger.warning("MLflow loading failed, trying Hugging Face...")
            model_data = load_model_from_huggingface()
    
    # Last resort: local files
    if not model_data:
        logger.warning("All cloud sources failed, trying local files...")
        model_data = load_model_from_local_files()
    
    # If still no model, raise error
    if not model_data:
        raise RuntimeError(
            "Failed to load model from any source! "
            "Check your MODEL_SOURCE, MLFLOW_TRACKING_URI, or HF_MODEL_REPO configuration."
        )
    
    logger.info(f"✅ Model loaded successfully from: {model_data['source']}")
    return model_data
