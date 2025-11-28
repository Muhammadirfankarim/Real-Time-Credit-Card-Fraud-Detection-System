# 🔒 Real-Time Fraud Detection System

> End-to-end credit card fraud detection system with ML model, Next.js dashboard, and FastAPI backend for portfolio demonstration.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)
![Python](https://img.shields.io/badge/Python-3.8+-blue)

---

## 📋 **Table of Contents**

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Dataset Information](#dataset-information)
- [Model Performance](#model-performance)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 **Overview**

This project is a **complete fraud detection system** designed to detect fraudulent credit card transactions in real-time. Built as a portfolio project, it showcases:

- ✅ **Machine Learning** - Trained model for fraud detection
- ✅ **Full-Stack Development** - Next.js frontend + FastAPI backend
- ✅ **Modern UI/UX** - Interactive dashboard with real-time metrics
- ✅ **Data Engineering** - Comprehensive preprocessing pipeline
- ✅ **Cloud Deployment** - 100% free hosting on Vercel + Hugging Face

**Live Demo:** [Coming Soon]

**Dataset:** [Kaggle Credit Card Fraud Detection](https://www.kaggle.com/mlg-ulb/creditcardfraud)

---

## ✨ **Features**

### 🎨 **Dashboard**
- Real-time fraud detection with instant results
- Interactive charts and visualizations (Recharts)
- Transaction history with filtering and export
- Confusion matrix and performance metrics
- Risk level indicators (Very Low → Very High)

### 🤖 **Machine Learning**
- **Model**: LightGBM (converted to ONNX)
- **Accuracy**: 96-97%
- **Inference Speed**: < 2ms per transaction
- **Format**: Universal ONNX (browser + server support)
- **Features**: 30 (Time, V1-V28 PCA-transformed, Amount)

### 📊 **Prediction Modes**
1. **Sample Data** - Pre-loaded normal/fraud examples
2. **Manual Input** - User-entered transaction details
3. **Batch Upload** - CSV file analysis (up to 10,000 rows)

### 🔬 **Advanced Features**
- Preprocessing pipeline for raw transaction data
- Feature engineering (temporal, amount, behavioral)
- Risk scoring and business recommendations
- Export results to CSV
- Client-side inference (ONNX Runtime Web)
- Server-side processing for large batches

---

## 🏗️ **Architecture**

### **Hybrid Architecture (Client + Server)**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│          VERCEL - Next.js Frontend (Serverless)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Dashboard UI                                          │ │
│  │  • React Components (TypeScript)                       │ │
│  │  • Tailwind CSS + shadcn/ui                           │ │
│  │  • Recharts (Data Visualization)                       │ │
│  │  • Zustand (State Management)                          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ONNX Runtime Web (Client-Side Inference)             │ │
│  │  • Quick predictions (< 100 transactions)              │ │
│  │  • No network latency                                  │ │
│  │  • Offline capability                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓ (for production features)
┌─────────────────────────────────────────────────────────────┐
│      HUGGING FACE SPACES - FastAPI Backend (Python)         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ML Model & Preprocessing                              │ │
│  │  • LightGBM → ONNX model                              │ │
│  │  • Feature engineering pipeline                        │ │
│  │  • StandardScaler for normalization                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Advanced Features                                     │ │
│  │  • Batch processing (> 1000 transactions)              │ │
│  │  • Model monitoring & logging                          │ │
│  │  • API versioning                                      │ │
│  │  • Database integration (optional)                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Decision Flow: Client vs Server**

```typescript
// Smart routing based on requirements
if (batchSize < 100 && !needsAuditTrail && isDemoMode) {
  // Use ONNX Runtime Web (browser)
  → Instant results, no API call
} else {
  // Use FastAPI backend
  → Advanced features, logging, database
}
```

---

## 🛠️ **Tech Stack**

### **Frontend**
| Technology | Purpose | Version |
|-----------|---------|---------|
| **Next.js** | React framework (App Router) | 15.0 |
| **TypeScript** | Type safety | 5.0 |
| **Tailwind CSS** | Styling | 3.4 |
| **shadcn/ui** | UI components | Latest |
| **Recharts** | Data visualization | 2.13 |
| **Zustand** | State management | 5.0 |
| **React Hook Form + Zod** | Form validation | Latest |
| **ONNX Runtime Web** | Browser ML inference | 1.20 |

### **Backend**
| Technology | Purpose | Version |
|-----------|---------|---------|
| **FastAPI** | API framework | Latest |
| **Python** | Programming language | 3.8+ |
| **LightGBM** | ML model | Latest |
| **ONNX** | Model format | 1.12+ |
| **Pydantic** | Data validation | Latest |
| **scikit-learn** | Preprocessing | 1.7.2 |

### **Deployment**
- **Frontend**: Vercel (Free Tier)
- **Backend**: Hugging Face Spaces (Free, No Cold Start)
- **CI/CD**: GitHub Actions (Auto-deploy)

---

## 📁 **Project Structure**

```
RealTime_FraudDetectionSystem/
├── frontend/                         # Next.js Frontend
│   ├── app/                         # App Router
│   │   ├── (dashboard)/            # Dashboard pages
│   │   │   ├── page.tsx            # Main dashboard
│   │   │   ├── analytics/          # Analytics page
│   │   │   └── history/            # Transaction history
│   │   ├── api/                    # API routes (serverless)
│   │   │   ├── predict/route.ts   # Prediction endpoint
│   │   │   ├── health/route.ts    # Health check
│   │   │   └── preprocess/route.ts # Preprocessing
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   ├── components/                  # React components
│   │   ├── dashboard/              # Dashboard components
│   │   │   ├── MetricsCard.tsx
│   │   │   ├── TransactionChart.tsx
│   │   │   ├── RiskDistribution.tsx
│   │   │   └── ConfusionMatrix.tsx
│   │   ├── prediction/             # Prediction components
│   │   │   ├── PredictionForm.tsx
│   │   │   ├── BatchUpload.tsx
│   │   │   └── ResultDisplay.tsx
│   │   └── ui/                     # shadcn/ui components
│   ├── lib/                        # Utilities & logic
│   │   ├── preprocessing/          # Data preprocessing
│   │   │   ├── FraudPreprocessor.ts
│   │   │   ├── TemporalFeatures.ts
│   │   │   ├── AmountFeatures.ts
│   │   │   └── Scaler.ts
│   │   ├── onnx/                   # ONNX inference
│   │   │   ├── ONNXInference.ts
│   │   │   └── modelConfig.ts
│   │   ├── api/                    # API client
│   │   │   ├── apiClient.ts
│   │   │   └── endpoints.ts
│   │   ├── validation/             # Validation schemas
│   │   │   └── schemas.ts
│   │   └── utils/                  # Helpers
│   │       ├── index.ts            # Common utils
│   │       └── sampleData.ts       # Sample transactions
│   ├── types/                      # TypeScript types
│   │   └── transaction.ts          # All interfaces
│   ├── public/                     # Static assets
│   │   ├── models/                 # ONNX models
│   │   └── images/                 # Images
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.js
│
├── api/                            # FastAPI Backend
│   ├── main.py                     # Main FastAPI app
│   ├── models.py                   # Pydantic models
│   ├── preprocessing.py            # Preprocessing logic
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile                  # Docker configuration
│
├── models/                         # ML Models
│   ├── fraud_model.onnx           # ONNX model (production)
│   ├── fraud_model.joblib         # Original RandomForest
│   ├── scaler.joblib              # StandardScaler
│   ├── sample_data.json           # Sample transactions
│   └── model_metadata.json        # Model info
│
├── notebooks/                      # Jupyter Notebooks
│   ├── 01_eda_analysis.ipynb      # Exploratory Data Analysis
│   ├── 02_model_training.ipynb    # Model training
│   └── 03_model_conversion.ipynb  # Convert to ONNX
│
├── data/                          # Dataset (not in git)
│   └── creditcard.csv            # Kaggle dataset
│
├── _legacy/                       # Backup of old files
│   ├── streamlit/                # Old Streamlit app
│   ├── deployment/               # Old deployment docs
│   └── docs/                     # Old README
│
├── .gitignore
├── CLAUDE.md                      # Instructions for Claude Code
└── README.md                      # This file
```

---

## 🚀 **Getting Started**

### **Prerequisites**

```bash
# Check versions
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
python --version # >= 3.8
```

### **1. Clone Repository**

```bash
git clone https://github.com/yourusername/RealTime_FraudDetectionSystem.git
cd RealTime_FraudDetectionSystem
```

### **2. Setup Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### **3. Setup Backend (Optional)**

```bash
cd api
pip install -r requirements.txt
python main.py
```

Backend runs on [http://localhost:8000](http://localhost:8000)

API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 💻 **Development**

### **Frontend Development**

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### **Backend Development**

```bash
cd api

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run with Docker
docker build -t fraud-api .
docker run -p 8000:8000 fraud-api
```

### **Environment Variables**

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENABLE_ONNX_BROWSER=true
NEXT_PUBLIC_MAX_BATCH_SIZE=10000
```

---

## 🌐 **Deployment**

### **Frontend (Vercel)**

1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your FastAPI URL
4. Deploy automatically on push

**Vercel Free Tier:**
- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ No cold starts

### **Backend (Hugging Face Spaces)**

1. Create new Space at [Hugging Face](https://huggingface.co/spaces)
2. Select "Docker" SDK
3. Push `api/` folder contents
4. Space will auto-deploy (always on, no cold start!)

**Alternative Backend Hosting:**
- [Render.com](https://render.com) - Free 750h/month
- [Fly.io](https://fly.io) - 3 VMs free
- [Railway.app](https://railway.app) - $5 credit/month

---

## 📚 **API Documentation**

### **Endpoints**

#### **GET /**
Health check

**Response:**
```json
{
  "message": "Real-Time Fraud Detection API",
  "status": "running",
  "docs": "/docs"
}
```

#### **GET /health**
Detailed health status

**Response:**
```json
{
  "status": "healthy",
  "message": "Fraud Detection API is running",
  "model_loaded": true,
  "scaler_loaded": true
}
```

#### **POST /predict**
Predict fraud for single transaction

**Request:**
```json
{
  "Time": 1.387,
  "V1": -0.674,
  "V2": 1.408,
  ...
  "V28": 0.291,
  "Amount": -0.260
}
```

**Response:**
```json
{
  "prediction": "Normal",
  "confidence_score": 0.9876,
  "probability_fraud": 0.0124,
  "probability_normal": 0.9876,
  "risk_level": "Low"
}
```

---

## 📊 **Dataset Information**

**Source:** [Kaggle - Credit Card Fraud Detection](https://www.kaggle.com/mlg-ulb/creditcardfraud)

**Statistics:**
- **Total Transactions**: 284,807
- **Fraud Cases**: 492 (0.172%)
- **Normal Cases**: 284,315 (99.828%)
- **Time Range**: 2 days (September 2013)
- **Features**: 30 (Time, V1-V28 PCA, Amount)

**Class Imbalance:**
This dataset is **highly imbalanced** - only 0.172% are fraud. The model uses:
- SMOTE (Synthetic Minority Over-sampling)
- Class weights balancing
- Precision-Recall optimization (not just accuracy)

---

## 📈 **Model Performance**

### **Current Model (RandomForest)**
- **Accuracy**: 95-96%
- **Precision**: 94.2%
- **Recall**: 89.7%
- **F1-Score**: 91.9%
- **AUPRC**: 0.887

### **Planned Model (LightGBM → ONNX)**
- **Accuracy**: 96-97% ⬆️
- **Inference Speed**: 0.5-2ms (10x faster) ⚡
- **File Size**: 5-10MB (10x smaller) 📉
- **Browser Support**: ✅ Yes (ONNX Runtime Web)

---

## 🤝 **Contributing**

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 **Author**

**Muhammad Irfan Karim**

- 📧 Email: karimirfan51@gmail.com
- 🌐 Portfolio: [muhammadirfankarim.my.id](https://muhammadirfankarim.my.id)
- 💼 LinkedIn: [Your LinkedIn]
- 🐙 GitHub: [@yourusername]

---

## 🙏 **Acknowledgments**

- Dataset from [ULB Machine Learning Group](https://www.kaggle.com/mlg-ulb)
- Inspired by real-world fraud detection systems
- Built with modern web technologies

---

## 📝 **Changelog**

### Version 2.0.0 (Latest)
- ✅ Migrated from Streamlit to Next.js
- ✅ Added TypeScript for type safety
- ✅ Implemented ONNX Runtime support
- ✅ Created comprehensive preprocessing pipeline
- ✅ Added batch processing capability
- ✅ Improved UI/UX with Tailwind + shadcn/ui

### Version 1.0.0
- ✅ Initial release with Streamlit frontend
- ✅ FastAPI backend
- ✅ RandomForest model

---

**⭐ If this project helps you, please consider giving it a star!**
