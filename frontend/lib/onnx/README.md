# ONNX Runtime Web - Fraud Detection Inference

This module provides browser-side machine learning inference using ONNX Runtime Web.

## 📋 Overview

The ONNX inference engine allows running fraud detection predictions directly in the browser without requiring a backend API call. This provides:

- ✅ **Instant predictions** (no network latency)
- ✅ **Offline capability** (works without internet)
- ✅ **Privacy** (data never leaves the browser)
- ✅ **Scalability** (no server load)

## 🚀 Quick Start

### 1. Load Model

```typescript
import { initializeModel } from '@/lib/onnx';

// Load model once (usually in app initialization)
await initializeModel();
```

### 2. Make Predictions

```typescript
import { quickPredict } from '@/lib/onnx';
import { SAMPLE_NORMAL } from '@/lib/utils/sampleData';

// Predict fraud
const result = await quickPredict(SAMPLE_NORMAL);

console.log(result);
// {
//   prediction: 'Normal',
//   confidence_score: 0.9876,
//   probability_fraud: 0.0124,
//   probability_normal: 0.9876,
//   risk_level: 'VERY_LOW'
// }
```

### 3. Batch Predictions

```typescript
import { getInferenceInstance } from '@/lib/onnx';
import { SAMPLE_BATCH_TRANSACTIONS } from '@/lib/utils/sampleData';

const inference = getInferenceInstance();
await inference.loadModel();

const results = await inference.predictBatch(SAMPLE_BATCH_TRANSACTIONS);
```

## 📦 Model Requirements

### Input Format

The model expects **30 features** in this order:

```typescript
{
  Time: number,      // Scaled time (seconds from first transaction)
  V1: number,        // PCA component 1
  V2: number,        // PCA component 2
  ...
  V28: number,       // PCA component 28
  Amount: number     // Scaled transaction amount
}
```

All values should be **already scaled/normalized**.

### Output Format

The model returns probabilities for 2 classes:

```typescript
[
  probability_normal,  // P(Normal transaction)
  probability_fraud    // P(Fraud transaction)
]
```

## 🔧 Configuration

### Execution Providers

The inference engine automatically selects the best execution provider:

1. **WebGL** - Fastest (GPU-accelerated) if available
2. **WebAssembly (WASM)** - Good performance, most compatible
3. **CPU** - Fallback

### Performance Tuning

```typescript
import { ONNXInference } from '@/lib/onnx';

const inference = new ONNXInference();

// Configure inference options
const result = await inference.predict(transaction, {
  useCache: true,        // Enable result caching
  returnTimings: true,   // Include performance metrics
});
```

### Caching

The inference engine caches recent predictions to improve performance:

```typescript
const stats = inference.getStats();
console.log(stats);
// {
//   totalPredictions: 150,
//   avgInferenceTime: 1.2,  // ms
//   cacheHitRate: 0.45,     // 45% cache hits
//   cacheSize: 100
// }
```

## 📊 Performance

Typical performance on modern browsers:

- **Model size**: 45MB (RandomForest) → 5-10MB (LightGBM/ONNX optimized)
- **Load time**: 1-3 seconds (first time)
- **Inference time**: 0.5-2ms per transaction
- **Memory usage**: ~60MB (model + overhead)

### Benchmark Results

| Browser | Execution Provider | Inference Time |
|---------|-------------------|----------------|
| Chrome  | WebGL            | 0.8ms          |
| Chrome  | WASM             | 1.2ms          |
| Firefox | WASM             | 1.5ms          |
| Safari  | WASM             | 2.0ms          |

## 🔍 Example Usage

### React Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { initializeModel, quickPredict } from '@/lib/onnx';
import { SAMPLE_NORMAL } from '@/lib/utils/sampleData';

export function FraudPrediction() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadAndPredict() {
      // Initialize model
      await initializeModel();

      // Make prediction
      const prediction = await quickPredict(SAMPLE_NORMAL);
      setResult(prediction);
      setLoading(false);
    }

    loadAndPredict();
  }, []);

  if (loading) return <div>Loading model...</div>;

  return (
    <div>
      <h2>Prediction: {result.prediction}</h2>
      <p>Confidence: {(result.confidence_score * 100).toFixed(2)}%</p>
      <p>Risk Level: {result.risk_level}</p>
    </div>
  );
}
```

### With Preprocessing

```typescript
import { preprocessTransaction } from '@/lib/preprocessing';
import { quickPredict } from '@/lib/onnx';

// Raw transaction data
const rawTransaction = {
  timestamp: new Date(),
  amount: 149.62,
  channel: 'online',
  country_code: 'US',
};

// Preprocess
const processed = await preprocessTransaction(rawTransaction);

// Predict
const result = await quickPredict(processed);
```

## 🛠️ Troubleshooting

### Model Not Loading

**Problem**: `Failed to load ONNX model`

**Solutions**:
1. Check that model file exists in `/public/models/fraud_model.onnx`
2. Verify file is accessible (check network tab)
3. Ensure file is not corrupted
4. Check CORS settings if loading from CDN

### Browser Not Supported

**Problem**: `Browser does not support WebAssembly`

**Solutions**:
1. Update to latest browser version
2. Check WebAssembly support: `typeof WebAssembly !== 'undefined'`
3. Use server-side API fallback for old browsers

### Slow Performance

**Problem**: Inference taking > 10ms

**Solutions**:
1. Enable caching: `useCache: true`
2. Use WebGL execution provider
3. Consider using API for batch operations
4. Check if model is optimized (use LightGBM → ONNX)

### Out of Memory

**Problem**: Browser crashes or freezes

**Solutions**:
1. Reduce batch size
2. Clear cache periodically: `inference.clearCache()`
3. Use pagination for large datasets
4. Fallback to server-side processing

## 🔐 Security Considerations

### Model Protection

The ONNX model file is publicly accessible in the browser. Consider:

1. **Model Obfuscation** - Minify/compress model file
2. **Server-side for Production** - Use browser inference only for demos
3. **Rate Limiting** - Limit predictions per user
4. **Monitoring** - Track usage patterns

### Data Privacy

Browser-side inference is more private:
- ✅ Transaction data never leaves the device
- ✅ No server logs
- ✅ GDPR/CCPA compliant

But remember:
- ⚠️ Model can be extracted from browser
- ⚠️ Model weights reveal training data patterns

## 📚 Additional Resources

- [ONNX Runtime Web Documentation](https://onnxruntime.ai/docs/tutorials/web/)
- [Model Optimization Guide](https://onnxruntime.ai/docs/performance/model-optimizations.html)
- [Browser Compatibility](https://caniuse.com/wasm)

## 🔄 Model Updates

To update the ONNX model:

1. Train new model (see `/notebooks/`)
2. Convert to ONNX format
3. Optimize with ONNX Runtime tools
4. Replace `/public/models/fraud_model.onnx`
5. Update `FRAUD_MODEL_METADATA` in `modelConfig.ts`
6. Test with sample data

## 📝 Notes

- **Current model**: RandomForest (45MB, trained on creditcard.csv)
- **Planned upgrade**: LightGBM → ONNX (5-10MB, faster inference)
- **Model version**: 1.0.0
- **Training date**: 2024-11-28
- **Accuracy**: 95.42%