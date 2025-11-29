"""
Pydantic Models for FastAPI
Real-Time Fraud Detection System

Objective: Define input and output data structures for API
"""

from pydantic import BaseModel, Field
from typing import Optional
import numpy as np

class TransactionInput(BaseModel):
    """
    Model for transaction input to be predicted

    Features:
    - Time: Transaction time (in seconds)
    - V1-V28: PCA transformation features
    - Amount: Transaction amount
    """

    # Time and amount features (can be scaled or unscaled values)
    Time: float = Field(..., description="Transaction time in seconds (can be negative if already scaled)")
    Amount: float = Field(..., description="Transaction amount (can be negative if already scaled)")

    # V1-V28 features (PCA results, already normalized)
    V1: float = Field(..., description="PCA feature V1")
    V2: float = Field(..., description="PCA feature V2")
    V3: float = Field(..., description="PCA feature V3")
    V4: float = Field(..., description="PCA feature V4")
    V5: float = Field(..., description="PCA feature V5")
    V6: float = Field(..., description="PCA feature V6")
    V7: float = Field(..., description="PCA feature V7")
    V8: float = Field(..., description="PCA feature V8")
    V9: float = Field(..., description="PCA feature V9")
    V10: float = Field(..., description="PCA feature V10")
    V11: float = Field(..., description="PCA feature V11")
    V12: float = Field(..., description="PCA feature V12")
    V13: float = Field(..., description="PCA feature V13")
    V14: float = Field(..., description="PCA feature V14")
    V15: float = Field(..., description="PCA feature V15")
    V16: float = Field(..., description="PCA feature V16")
    V17: float = Field(..., description="PCA feature V17")
    V18: float = Field(..., description="PCA feature V18")
    V19: float = Field(..., description="PCA feature V19")
    V20: float = Field(..., description="PCA feature V20")
    V21: float = Field(..., description="PCA feature V21")
    V22: float = Field(..., description="PCA feature V22")
    V23: float = Field(..., description="PCA feature V23")
    V24: float = Field(..., description="PCA feature V24")
    V25: float = Field(..., description="PCA feature V25")
    V26: float = Field(..., description="PCA feature V26")
    V27: float = Field(..., description="PCA feature V27")
    V28: float = Field(..., description="PCA feature V28")
    
    class Config:
        # Allow both str and float to handle JSON number parsing issues
        # Pydantic will coerce strings to floats automatically
        validate_assignment = True

        schema_extra = {
            "example": {
                "Time": 406.0,
                "V1": -1.3598071336738,
                "V2": -0.0727811733098497,
                "V3": 2.53634673796914,
                "V4": 1.37815522427443,
                "V5": -0.338320769942518,
                "V6": 0.462387777762292,
                "V7": 0.239598554061257,
                "V8": 0.0986979012610507,
                "V9": 0.363786969611213,
                "V10": 0.0907941719789316,
                "V11": -0.551599533260813,
                "V12": -0.617800855762348,
                "V13": -0.991389847235408,
                "V14": -0.311169353699879,
                "V15": 1.46817697209427,
                "V16": -0.470400525259478,
                "V17": 0.207971241929242,
                "V18": 0.0257905801985591,
                "V19": 0.403992960255733,
                "V20": 0.251412098239705,
                "V21": -0.018306777944153,
                "V22": 0.277837575558899,
                "V23": -0.110473910188767,
                "V24": 0.0669280749146731,
                "V25": 0.128539358273528,
                "V26": -0.189114843888824,
                "V27": 0.133558376740387,
                "V28": -0.0210530534538215,
                "Amount": 149.62
            }
        }

class PredictionResponse(BaseModel):
    """
    Model for prediction response
    """
    prediction: str = Field(..., description="Prediction result: 'Normal' or 'Fraud'")
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    probability_fraud: float = Field(..., ge=0, le=1, description="Fraud probability (0-1)")
    probability_normal: float = Field(..., ge=0, le=1, description="Normal probability (0-1)")
    risk_level: str = Field(..., description="Risk level: 'Low', 'Medium', 'High'")
    
    class Config:
        schema_extra = {
            "example": {
                "prediction": "Normal",
                "confidence_score": 0.9876,
                "probability_fraud": 0.0124,
                "probability_normal": 0.9876,
                "risk_level": "Low"
            }
        }

class HealthResponse(BaseModel):
    """
    Model for health check response
    """
    status: str = Field(..., description="Application status")
    message: str = Field(..., description="Status message")
    model_loaded: bool = Field(..., description="Whether model is loaded")
    scaler_loaded: bool = Field(..., description="Whether scaler is loaded")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "message": "Fraud Detection API is running",
                "model_loaded": True,
                "scaler_loaded": True
            }
        }

class ErrorResponse(BaseModel):
    """
    Model for error response
    """
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Error detail (optional)")
    
    class Config:
        schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid input data",
                "detail": "Amount must be a positive number"
            }
        }