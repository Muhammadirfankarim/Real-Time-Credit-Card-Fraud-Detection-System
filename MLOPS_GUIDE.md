# MLOps Guide: Fraud Detection System

Complete guide for ML Operations (MLOps) implementation using **MLflow** and **GitHub Actions**.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MLOps Pipeline                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │              │    │              │
│   Training   │───▶│    MLflow    │───▶│  FastAPI     │
│   Script     │    │   Registry   │    │   Backend    │
│              │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   GitHub     │    │   Model      │    │   Next.js    │
│   Actions    │    │   Versioning │    │   Frontend   │
└──────────────┘    └──────────────┘    └──────────────┘
```

**Components:**
1. **Training Script** (`04_train_with_mlflow.py`) - Trains model with MLflow tracking
2. **MLflow Registry** - Stores models, metrics, and artifacts
3. **FastAPI Backend** - Loads models from MLflow, serves predictions
4. **GitHub Actions** - Automates training, testing, and deployment
5. **Frontend** - Consumes API for real-time predictions

---

## 🚀 Quick Start

### 1. Train Model with MLflow

```bash
# Install dependencies
pip install mlflow pandas numpy scikit-learn lightgbm matplotlib

# Run training script
cd notebooks
python 04_train_with_mlflow.py

# View results in MLflow UI
mlflow ui --port 5001
# Open: http://localhost:5001
```

### 2. Start FastAPI with MLflow Integration

```bash
# Install API dependencies
cd api
pip install fastapi uvicorn mlflow lightgbm joblib

# Run API server
python main_mlflow.py

# API will be available at: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### 3. Test Predictions

```bash
# Health check
curl http://localhost:8000/health

# Make prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Time": 1.39,
    "V1": -0.67, "V2": 1.41, "V3": -0.36, "V4": 1.27,
    "V5": -0.18, "V6": 0.49, "V7": -0.58, "V8": -0.03,
    "V9": -0.47, "V10": -0.43, "V11": 0.89, "V12": -0.63,
    "V13": -0.16, "V14": -1.07, "V15": 0.29, "V16": -0.22,
    "V17": -0.26, "V18": 0.15, "V19": -0.03, "V20": 0.07,
    "V21": 0.17, "V22": 0.29, "V23": 0.06, "V24": -0.03,
    "V25": 0.36, "V26": -0.10, "V27": 0.06, "V28": -0.03,
    "Amount": 149.62
  }'
```

---

## 📊 MLflow Features

### Experiment Tracking

**What gets logged:**
- ✅ Training parameters (learning rate, num_leaves, etc.)
- ✅ Metrics (accuracy, precision, recall, F1, AUC)
- ✅ Artifacts (model, scaler, feature importance plot)
- ✅ Dataset info (size, fraud rate, splits)

**View experiments:**
```bash
mlflow ui --port 5001
```

Navigate to:
- **Experiments** → See all training runs
- **Compare** → Compare multiple runs side-by-side
- **Charts** → Visualize metrics over time

### Model Registry

**Model versioning:**
- Each training run creates a new model version
- Models can be transitioned through stages: `None` → `Staging` → `Production`
- FastAPI automatically loads the `Production` model

**Promote model to production:**
```bash
# Via Python
import mlflow
client = mlflow.tracking.MlflowClient()
client.transition_model_version_stage(
    name="fraud-detector",
    version="2",
    stage="Production"
)

# Via MLflow UI
# 1. Go to Models tab
# 2. Click on "fraud-detector"
# 3. Select version
# 4. Click "Stage" → "Transition to Production"
```

### Model Serving

FastAPI loads models from MLflow with:
- Automatic version management
- Fallback to local files if MLflow unavailable
- Health checks with model info

---

## 🤖 GitHub Actions Automation

### Workflow: `model-training.yml`

**Triggers:**
1. **Manual** - Run from Actions tab
2. **Scheduled** - Weekly on Sunday at 00:00 UTC
3. **On push** - When data or training script changes (optional)

**What it does:**
1. ✅ Sets up Python environment
2. ✅ Downloads dataset (if not in repo)
3. ✅ Trains model with MLflow
4. ✅ Checks performance (accuracy > 95%)
5. ✅ Creates Pull Request if model improves
6. ✅ Uploads artifacts

**Setup GitHub Secrets:**

For Kaggle dataset download (optional):
```
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_api_key
```

Get Kaggle API key:
1. Go to https://www.kaggle.com/settings
2. Click "Create New API Token"
3. Add to GitHub Secrets

**Manual trigger:**
1. Go to **Actions** tab
2. Select "Model Training & Deployment"
3. Click "Run workflow"
4. Choose options

---

## 📈 Monitoring & Observability

### Key Metrics to Track

**Model Performance:**
- Accuracy (overall correctness)
- Precision (fraud prediction accuracy)
- Recall (fraud detection rate)
- F1-Score (balanced metric)
- AUC-ROC (discrimination ability)

**Production Metrics:**
- Prediction latency
- Request throughput
- Error rate
- Model version in use

### Health Checks

```bash
# Check API health
curl http://localhost:8000/health

Response:
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "fraud-detector",
  "model_version": "2",
  "model_stage": "Production",
  "mlflow_tracking_uri": "file:./mlruns",
  "timestamp": "2025-11-28T14:00:00"
}
```

---

## 🔄 Model Retraining Workflow

### When to Retrain?

1. **Scheduled** - Weekly/monthly automatic retraining
2. **Performance degradation** - Accuracy drops below threshold
3. **Data drift** - New fraud patterns detected
4. **Manual trigger** - After investigating new fraud cases

### Retraining Steps

```bash
# 1. Update dataset (if needed)
# Place new data in data/creditcard.csv

# 2. Run training script
cd notebooks
python 04_train_with_mlflow.py

# 3. Compare with previous version
mlflow ui --port 5001
# Navigate to Experiments → Compare runs

# 4. If better, promote to staging
import mlflow
client = mlflow.tracking.MlflowClient()
client.transition_model_version_stage(
    name="fraud-detector",
    version="3",  # new version
    stage="Staging"
)

# 5. Test in staging environment
cd api
MLFLOW_MODEL_STAGE=Staging python main_mlflow.py

# 6. If tests pass, promote to production
client.transition_model_version_stage(
    name="fraud-detector",
    version="3",
    stage="Production"
)

# 7. Restart production API
# It will automatically load the new Production model
```

---

## 🚢 Deployment Options

### Option 1: Hugging Face Spaces (FREE ✅)

**Backend deployment:**

1. Create `requirements.txt`:
```txt
fastapi==0.104.1
uvicorn==0.24.0
mlflow==2.9.0
lightgbm==4.1.0
pandas==2.1.3
numpy==1.26.2
scikit-learn==1.3.2
joblib==1.3.2
```

2. Create `Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ ./api/
COPY models/ ./models/
COPY mlruns/ ./mlruns/

WORKDIR /app/api

CMD ["uvicorn", "main_mlflow:app", "--host", "0.0.0.0", "--port", "7860"]
```

3. Push to Hugging Face:
```bash
# Install Hugging Face CLI
pip install huggingface_hub

# Login
huggingface-cli login

# Create Space
# Go to https://huggingface.co/new-space
# Choose Docker, Python 3.10

# Push code
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/fraud-detection-api
git push hf main
```

**Frontend deployment (Vercel):**
```bash
# Push to GitHub
git push origin main

# Go to vercel.com
# Import repository
# Deploy!

# Set environment variable:
NEXT_PUBLIC_API_URL=https://YOUR_USERNAME-fraud-detection-api.hf.space
```

### Option 2: Railway (FREE tier)

1. Connect GitHub repo
2. Select `api` directory
3. Set environment variables
4. Deploy!

### Option 3: Local with Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: ./api
    ports:
      - "8000:8000"
    volumes:
      - ./mlruns:/app/mlruns
      - ./models:/app/models
    environment:
      - MLFLOW_TRACKING_URI=file:./mlruns

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - api
```

Run:
```bash
docker-compose up
```

---

## 🛠️ Troubleshooting

### Model Not Loading

**Error:** `Model not loaded. Please check server logs.`

**Solution:**
```bash
# Check MLflow tracking URI
export MLFLOW_TRACKING_URI=file:./mlruns

# Verify model exists
mlflow models list

# Check model versions
import mlflow
client = mlflow.tracking.MlflowClient()
versions = client.search_model_versions("name='fraud-detector'")
for v in versions:
    print(f"Version {v.version}: {v.current_stage}")
```

### MLflow UI Not Starting

**Error:** `Address already in use`

**Solution:**
```bash
# Use different port
mlflow ui --port 5002

# Or kill existing process
lsof -ti:5001 | xargs kill -9
```

### GitHub Actions Failing

**Common issues:**
1. Dataset not found → Add KAGGLE credentials or commit dataset
2. Python version mismatch → Check Python version in workflow
3. Dependencies not installed → Update requirements in workflow

---

## 📚 Best Practices

### 1. Version Control
- ✅ Track model versions in MLflow
- ✅ Use semantic versioning (1.0.0, 1.1.0, 2.0.0)
- ✅ Document changes in commit messages

### 2. Testing
- ✅ Test models in Staging before Production
- ✅ Set performance thresholds (e.g., accuracy > 95%)
- ✅ Monitor for data drift

### 3. Monitoring
- ✅ Track prediction latency
- ✅ Log all predictions for audit trail
- ✅ Set up alerts for performance drops

### 4. Documentation
- ✅ Document model parameters
- ✅ Explain feature engineering steps
- ✅ Keep training logs in MLflow

---

## 📞 Support & Resources

**MLflow Documentation:**
- https://mlflow.org/docs/latest/

**GitHub Actions:**
- https://docs.github.com/en/actions

**FastAPI:**
- https://fastapi.tiangolo.com/

**Hugging Face Spaces:**
- https://huggingface.co/docs/hub/spaces

---

## 🎯 Next Steps

1. ✅ Train your first model with MLflow
2. ✅ View results in MLflow UI
3. ✅ Test FastAPI with MLflow integration
4. ✅ Set up GitHub Actions (optional)
5. ✅ Deploy to Hugging Face Spaces (free!)

**Questions?** Check the documentation or create an issue on GitHub.

---

*Last updated: November 28, 2025*
*Version: 1.0.0*
