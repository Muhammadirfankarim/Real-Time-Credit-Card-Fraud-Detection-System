# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-Time Fraud Detection System - An end-to-end credit card fraud detection system with ML model, FastAPI backend, and Streamlit frontend for portfolio demonstration.

## Running the Application

### Local Development

**Start the FastAPI backend:**
```bash
cd api
python main.py
# Or using uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Start the Streamlit frontend:**
```bash
streamlit run streamlit_app.py
# The app uses streamlit_app.py in the root, NOT streamlit_app/app.py
```

**Access points:**
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Streamlit: http://localhost:8501

### Install Dependencies

```bash
# API dependencies
pip install -r api/requirements.txt

# Streamlit dependencies
pip install -r streamlit_app/requirements.txt
```

## Architecture

### Three-Tier Architecture

1. **ML Model Layer** (`models/`)
   - `fraud_model.joblib`: Trained RandomForest classifier (scikit-learn 1.7.2)
   - `scaler.joblib`: StandardScaler for Time and Amount features
   - Model expects 30 features: Time, V1-V28 (PCA-transformed), Amount

2. **API Layer** (`api/`)
   - FastAPI service that loads model on startup
   - Provides `/predict` endpoint for single transaction predictions
   - Handles preprocessing: scales Time/Amount, keeps V1-V28 unchanged
   - Returns prediction, confidence score, probabilities, and risk level

3. **Frontend Layer** (`streamlit_app.py`)
   - Streamlit app with three input modes:
     - Sample Data (pre-loaded normal/fraud examples)
     - Manual Input (user-entered values)
     - Upload CSV (batch analysis of datasets)
   - Batch mode processes multiple transactions and displays:
     - Confusion matrix (TP, TN, FP, FN)
     - Performance metrics (Accuracy, Precision, Recall, F1)
     - Filterable results table
     - CSV export functionality

### Critical Integration Points

**API-Frontend Communication:**
- Frontend calls `http://localhost:8000/predict` with POST requests
- `LOCAL_API_URL` constant in `streamlit_app.py` defines backend endpoint
- Both single and batch predictions use the same `/predict` endpoint

**Data Flow:**
- Raw transaction → Streamlit UI
- JSON payload → FastAPI `/predict`
- Model preprocessing → Prediction
- JSON response → Streamlit display with visualizations

## Key Implementation Details

### Model Input Requirements

**CRITICAL:** The model was trained with scikit-learn **1.7.2**. Version mismatch causes incorrect predictions.

**Feature format:**
- Time: Can be negative (if scaled) or positive (seconds since first transaction)
- V1-V28: PCA-transformed features (already normalized, typically between -5 and 5)
- Amount: Can be negative (if scaled) or positive (transaction amount)

**Sample data location:**
- `models/sample_data.json` contains correctly scaled examples
- These are used as defaults in `streamlit_app.py` (SAMPLE_NORMAL, SAMPLE_FRAUD)

### API Validation

The Pydantic `TransactionInput` model in `api/models.py` accepts negative values for Time and Amount to support pre-scaled data. Do NOT add `ge=0` constraints.

### Streamlit State Management

Batch analysis uses `st.session_state` to store:
- `batch_df`: DataFrame of transactions to analyze
- `max_rows`: Limit for batch processing

### Progress Tracking

For long-running batch analysis, the app uses:
- `st.progress()` for visual progress bar
- `st.empty()` for status text updates
- Both cleared after completion

## Dataset Information

**Source:** Kaggle Credit Card Fraud Detection dataset
- 284,807 total transactions
- 492 fraud cases (0.17% - highly imbalanced)
- Features Time, V1-V28 (anonymized via PCA), Amount, Class (0=normal, 1=fraud)

**Location:** `data/creditcard.csv` (not included in repo, download separately)

## Common Modifications

### Adding New Input Modes

Edit `streamlit_app.py`:
1. Add mode to radio button list (line ~589)
2. Add `elif input_mode == "Your Mode":` block in main content area
3. Set `transaction_data` variable appropriately

### Changing Risk Thresholds

Edit `get_risk_level()` in `api/main.py` (line ~90) and `streamlit_app.py` (line ~408) to adjust probability boundaries for Low/Medium/High risk levels.

### Modifying Model

If retraining the model:
1. Update notebooks in `notebooks/`
2. Save new model/scaler to `models/`
3. Ensure scikit-learn version matches training environment
4. Update `api/requirements.txt` with correct sklearn version

## Testing API

**Manual testing:**
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"Time": 1.39, "V1": -0.67, "V2": 1.41, ..., "Amount": -0.26}'
```

**Health check:**
```bash
curl http://localhost:8000/health
```

## Deployment Notes

- API expects models at `../models/` relative path when running from `api/` directory
- Frontend expects API at `LOCAL_API_URL` constant
- CORS is set to allow all origins (`["*"]`) - restrict in production
- Both services run independently and communicate via HTTP

## Known Constraints

- Model requires exactly 30 features in specific order
- Batch analysis limited to 10,000 rows by default for performance
- No authentication/rate limiting implemented
- Single model only (no A/B testing or versioning)
