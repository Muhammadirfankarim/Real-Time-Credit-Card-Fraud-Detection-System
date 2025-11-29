"""
FastAPI Backend with MLflow Integration
========================================

Real-Time Fraud Detection API with MLflow model serving:
- Load models from MLflow Model Registry
- Health checks with model version info
- Preprocessing and prediction
- Performance monitoring

Endpoints:
- GET /: Root endpoint
- GET /health: System health and model info
- POST /predict: Fraud prediction for transactions
- GET /models: List available models in registry
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import joblib
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import os

# MLflow imports
import mlflow
import mlflow.lightgbm
from mlflow.tracking import MlflowClient

# Pydantic models
from pydantic import BaseModel, Field

# ============================================================================
# CONFIGURATION
# ============================================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MLflow configuration
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "file:./mlruns")
MODEL_NAME = "fraud-detector"
MODEL_STAGE = "Production"  # or "Staging" or "None" for latest

# Feature names (must match training data)
FEATURE_NAMES = [
    'Time', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10',
    'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20',
    'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28', 'Amount'
]

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class TransactionInput(BaseModel):
    """Input schema for transaction data."""
    Time: float = Field(..., description="Time elapsed since first transaction")
    V1: float = Field(..., description="PCA component 1")
    V2: float
    V3: float
    V4: float
    V5: float
    V6: float
    V7: float
    V8: float
    V9: float
    V10: float
    V11: float
    V12: float
    V13: float
    V14: float
    V15: float
    V16: float
    V17: float
    V18: float
    V19: float
    V20: float
    V21: float
    V22: float
    V23: float
    V24: float
    V25: float
    V26: float
    V27: float
    V28: float
    Amount: float = Field(..., description="Transaction amount (can be negative if already scaled)")

    class Config:
        json_schema_extra = {
            "example": {
                "Time": 1.39,
                "V1": -0.67, "V2": 1.41, "V3": -0.36, "V4": 1.27,
                "V5": -0.18, "V6": 0.49, "V7": -0.58, "V8": -0.03,
                "V9": -0.47, "V10": -0.43, "V11": 0.89, "V12": -0.63,
                "V13": -0.16, "V14": -1.07, "V15": 0.29, "V16": -0.22,
                "V17": -0.26, "V18": 0.15, "V19": -0.03, "V20": 0.07,
                "V21": 0.17, "V22": 0.29, "V23": 0.06, "V24": -0.03,
                "V25": 0.36, "V26": -0.10, "V27": 0.06, "V28": -0.03,
                "Amount": 149.62
            }
        }


class PredictionResponse(BaseModel):
    """Response schema for predictions."""
    prediction: str = Field(..., description="'Fraud' or 'Normal'")
    probability_fraud: float = Field(..., ge=0, le=1)
    probability_normal: float = Field(..., ge=0, le=1)
    confidence_score: float = Field(..., ge=0, le=1)
    risk_level: str
    model_version: str
    timestamp: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    model_name: str
    model_version: str
    model_stage: str
    mlflow_tracking_uri: str
    timestamp: str


class ModelInfo(BaseModel):
    """Model information from registry."""
    name: str
    version: str
    stage: str
    run_id: Optional[str]
    description: Optional[str]


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Fraud Detection API with MLflow",
    description="Real-time credit card fraud detection powered by MLflow",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
# Allow frontend to access API from different origins
allowed_origins = [
    "http://localhost:3000",  # Local development
    "http://localhost:3001",
    # Add your Vercel deployment URLs
    # "https://your-app.vercel.app",
    # "https://your-custom-domain.com",
]

# Add environment variable support for additional origins
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    allowed_origins.extend([origin.strip() for origin in env_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# GLOBAL VARIABLES
# ============================================================================

model = None
scaler = None
model_info = {}
mlflow_client = None

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_risk_level(probability: float) -> str:
    """Determine risk level based on fraud probability."""
    if probability >= 0.8:
        return "VERY_HIGH"
    elif probability >= 0.6:
        return "HIGH"
    elif probability >= 0.4:
        return "MEDIUM"
    elif probability >= 0.2:
        return "LOW"
    else:
        return "VERY_LOW"




def preprocess_transaction(transaction: Dict[str, float]) -> np.ndarray:
    """Preprocess transaction data."""
    # Convert to DataFrame
    df = pd.DataFrame([transaction])

    # Ensure correct order
    df = df[FEATURE_NAMES]

    # Scale Time and Amount if scaler is available
    if scaler is not None:
        df[['Time', 'Amount']] = scaler.transform(df[['Time', 'Amount']])

    return df.values


# ============================================================================
# STARTUP EVENT
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    global model, scaler, model_metadata
    logger.info("Starting Fraud Detection API with MLflow...")
    
    # Use intelligent model loader
    from model_loader import load_model
    loaded_data = load_model()
    
    if loaded_data:
        model = loaded_data.get("model")
        scaler = loaded_data.get("scaler")
        model_metadata = loaded_data.get("metadata", {})
        logger.info(f"✅ API ready to serve predictions (Source: {model_metadata.get('source', 'unknown')})")
    else:
        logger.error("⚠️  API started but model loading failed!")


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Fraud Detection API with MLflow",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with model info."""
    return HealthResponse(
        status="healthy" if model is not None else "degraded",
        model_loaded=model is not None,
        model_name=model_info.get('name', 'N/A'),
        model_version=model_info.get('version', 'N/A'),
        model_stage=model_info.get('stage', 'N/A'),
        mlflow_tracking_uri=MLFLOW_TRACKING_URI,
        timestamp=datetime.now().isoformat()
    )


@app.get("/models", response_model=List[ModelInfo])
async def list_models():
    """List all models in the registry."""
    if mlflow_client is None:
        raise HTTPException(
            status_code=503,
            detail="MLflow client not initialized"
        )

    try:
        versions = mlflow_client.search_model_versions(f"name='{MODEL_NAME}'")
        return [
            ModelInfo(
                name=v.name,
                version=v.version,
                stage=v.current_stage,
                run_id=v.run_id,
                description=v.description
            )
            for v in versions
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list models: {str(e)}"
        )


@app.post("/predict", response_model=PredictionResponse)
async def predict_fraud(transaction: TransactionInput):
    """Predict fraud for a transaction."""
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please check server logs."
        )

    try:
        # Preprocess
        transaction_dict = transaction.model_dump()
        features = preprocess_transaction(transaction_dict)

        # Predict
        prediction_proba = model.predict(features)[0]
        prediction = 1 if prediction_proba > 0.5 else 0

        # Calculate probabilities
        prob_fraud = float(prediction_proba)
        prob_normal = float(1 - prediction_proba)

        # Determine risk level
        risk = get_risk_level(prob_fraud)

        return PredictionResponse(
            prediction="Fraud" if prediction == 1 else "Normal",
            probability_fraud=prob_fraud,
            probability_normal=prob_normal,
            confidence_score=max(prob_fraud, prob_normal),
            risk_level=risk,
            model_version=model_info.get('version', 'Unknown'),
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_mlflow:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
