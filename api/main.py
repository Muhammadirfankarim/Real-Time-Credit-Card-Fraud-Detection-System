"""
FastAPI Backend untuk Real-Time Fraud Detection System

Objektif: 
- Menyediakan API endpoint untuk prediksi fraud real-time
- Load model dan scaler saat startup
- Menangani preprocessing dan prediksi
- Memberikan response yang informatif

Endpoint:
- GET /: Health check
- POST /predict: Prediksi fraud untuk transaksi baru
- GET /health: Status aplikasi dan model
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import joblib
import pandas as pd
import numpy as np
import logging
from pathlib import Path
import os
from typing import Dict, Any

# Import Pydantic models
from models import TransactionInput, PredictionResponse, HealthResponse, ErrorResponse

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inisialisasi FastAPI app
app = FastAPI(
    title="Real-Time Fraud Detection API",
    description="API untuk deteksi penipuan kartu kredit secara real-time menggunakan Machine Learning",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware untuk mengizinkan akses dari frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Dalam production, ganti dengan domain spesifik
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables untuk model dan scaler
model = None
scaler = None
model_loaded = False
scaler_loaded = False

# Path ke model files
MODEL_PATH = Path("../models/fraud_model.joblib")
SCALER_PATH = Path("../models/scaler.joblib")

def load_model_and_scaler():
    """
    Load model dan scaler saat aplikasi startup
    """
    global model, scaler, model_loaded, scaler_loaded
    
    try:
        # Load model
        if MODEL_PATH.exists():
            model = joblib.load(MODEL_PATH)
            model_loaded = True
            logger.info("✅ Model berhasil dimuat")
        else:
            logger.error(f"❌ Model file tidak ditemukan: {MODEL_PATH}")
            
        # Load scaler
        if SCALER_PATH.exists():
            scaler = joblib.load(SCALER_PATH)
            scaler_loaded = True
            logger.info("✅ Scaler berhasil dimuat")
        else:
            logger.error(f"❌ Scaler file tidak ditemukan: {SCALER_PATH}")
            
    except Exception as e:
        logger.error(f"❌ Error loading model/scaler: {str(e)}")
        model_loaded = False
        scaler_loaded = False

def get_risk_level(fraud_probability: float) -> str:
    """
    Menentukan level risiko berdasarkan probabilitas fraud
    """
    if fraud_probability < 0.3:
        return "Low"
    elif fraud_probability < 0.7:
        return "Medium"
    else:
        return "High"

def preprocess_transaction(transaction: TransactionInput) -> pd.DataFrame:
    """
    Preprocessing data transaksi sebelum prediksi
    
    Steps:
    1. Convert Pydantic model ke DataFrame
    2. Scale fitur Time dan Amount menggunakan scaler
    3. Return DataFrame yang siap untuk prediksi
    """
    try:
        # Convert ke dictionary
        transaction_dict = transaction.dict()
        
        # Buat DataFrame
        df = pd.DataFrame([transaction_dict])
        
        # Pastikan urutan kolom sesuai dengan training data
        expected_columns = [
            'Time', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10',
            'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20',
            'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28', 'Amount'
        ]
        
        df = df[expected_columns]
        
        # Scale fitur Time dan Amount
        if scaler is not None:
            features_to_scale = ['Time', 'Amount']
            df[features_to_scale] = scaler.transform(df[features_to_scale])
        
        return df
        
    except Exception as e:
        logger.error(f"Error in preprocessing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error preprocessing data: {str(e)}"
        )

@app.on_event("startup")
async def startup_event():
    """
    Event yang dijalankan saat aplikasi startup
    """
    logger.info("🚀 Starting Fraud Detection API...")
    load_model_and_scaler()
    
    if model_loaded and scaler_loaded:
        logger.info("✅ API siap digunakan!")
    else:
        logger.warning("⚠️ API berjalan tapi model/scaler tidak dimuat dengan benar")

@app.get("/", response_model=Dict[str, str])
async def root():
    """
    Root endpoint - Health check sederhana
    """
    return {
        "message": "Real-Time Fraud Detection API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint yang lebih detail
    """
    status_msg = "healthy" if (model_loaded and scaler_loaded) else "unhealthy"
    message = "Fraud Detection API is running" if (model_loaded and scaler_loaded) else "Model or scaler not loaded"
    
    return HealthResponse(
        status=status_msg,
        message=message,
        model_loaded=model_loaded,
        scaler_loaded=scaler_loaded
    )

@app.post("/predict", response_model=PredictionResponse)
async def predict_fraud(transaction: TransactionInput):
    """
    Endpoint utama untuk prediksi fraud
    
    Input: TransactionInput (data transaksi)
    Output: PredictionResponse (hasil prediksi + confidence score)
    
    Process:
    1. Validasi input (otomatis oleh Pydantic)
    2. Preprocessing data (scaling)
    3. Prediksi menggunakan model
    4. Format response
    """
    
    # Cek apakah model dan scaler sudah dimuat
    if not model_loaded or not scaler_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model atau scaler belum dimuat. Silakan coba lagi nanti."
        )
    
    try:
        # Preprocessing
        processed_data = preprocess_transaction(transaction)
        
        # Prediksi
        prediction = model.predict(processed_data)[0]
        probabilities = model.predict_proba(processed_data)[0]
        
        # Extract probabilities
        prob_normal = float(probabilities[0])
        prob_fraud = float(probabilities[1])
        
        # Tentukan hasil prediksi dan confidence
        prediction_label = "Fraud" if prediction == 1 else "Normal"
        confidence_score = prob_fraud if prediction == 1 else prob_normal
        
        # Tentukan risk level
        risk_level = get_risk_level(prob_fraud)
        
        # Log prediksi untuk monitoring
        logger.info(f"Prediction: {prediction_label}, Confidence: {confidence_score:.4f}, Risk: {risk_level}")
        
        return PredictionResponse(
            prediction=prediction_label,
            confidence_score=float(confidence_score),
            probability_fraud=prob_fraud,
            probability_normal=prob_normal,
            risk_level=risk_level
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error dalam prediksi: {str(e)}"
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """
    Custom exception handler untuk HTTP errors
    """
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="HTTPException",
            message=exc.detail,
            detail=f"Status code: {exc.status_code}"
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """
    General exception handler untuk unexpected errors
    """
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="InternalServerError",
            message="Terjadi kesalahan internal server",
            detail=str(exc)
        ).dict()
    )

if __name__ == "__main__":
    import uvicorn
    
    # Jalankan server untuk development
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )