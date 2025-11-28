'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { SAMPLE_NORMAL, SAMPLE_FRAUD } from '@/lib/utils/sampleData';
import { ProcessedTransaction, PredictionResult } from '@/types/transaction';
import { apiClient } from '@/lib/api';
import { usePredictionStore } from '@/lib/store/usePredictionStore';
import { PredictionResultDisplay } from './PredictionResult';
import { Loader2, Sparkles, AlertCircle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type InputMode = 'sample' | 'manual';

export function PredictionForm() {
  const [mode, setMode] = React.useState<InputMode>('sample');
  const [sampleType, setSampleType] = React.useState<'normal' | 'fraud'>('normal');
  const [manualInput, setManualInput] = React.useState<Partial<ProcessedTransaction>>({
    Time: 0,
    Amount: 0,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isApiConnected, setIsApiConnected] = React.useState(false);
  const [isCheckingApi, setIsCheckingApi] = React.useState(true);
  const [result, setResult] = React.useState<PredictionResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Store for saving prediction history
  const setPrediction = usePredictionStore((state) => state.setPrediction);

  // Check API health on mount
  React.useEffect(() => {
    async function checkApiHealth() {
      try {
        setIsCheckingApi(true);
        await apiClient.healthCheck();
        setIsApiConnected(true);
      } catch (err) {
        setError('Unable to connect to API. Please make sure the backend server is running.');
        setIsApiConnected(false);
      } finally {
        setIsCheckingApi(false);
      }
    }
    checkApiHealth();
  }, []);

  const handlePredict = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      let transaction: ProcessedTransaction;

      if (mode === 'sample') {
        transaction = sampleType === 'normal' ? SAMPLE_NORMAL : SAMPLE_FRAUD;
      } else {
        // For manual mode, use the selected sample type as base and override Time/Amount
        const baseSample = sampleType === 'normal' ? SAMPLE_NORMAL : SAMPLE_FRAUD;
        transaction = {
          ...baseSample,
          Time: manualInput.Time || 0,
          Amount: manualInput.Amount || 0,
        };
      }

      // Make prediction using FastAPI backend
      const prediction = await apiClient.predictSingle(transaction);
      setResult(prediction);

      // Save to history store
      setPrediction(transaction, prediction);
    } catch (err: any) {
      const errorMessage = err.message || 'Prediction failed. Please try again.';
      setError(errorMessage);
      // If API connection failed, update connection status
      if (errorMessage.includes('Network') || errorMessage.includes('connect')) {
        setIsApiConnected(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = (type: 'normal' | 'fraud') => {
    setSampleType(type);
    const sample = type === 'normal' ? SAMPLE_NORMAL : SAMPLE_FRAUD;
    setManualInput({
      Time: sample.Time,
      Amount: sample.Amount,
    });
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Input</CardTitle>
          <CardDescription>Choose how you want to input transaction data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={mode === 'sample' ? 'default' : 'outline'}
              onClick={() => setMode('sample')}
              className="flex-1"
            >
              Sample Data
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => setMode('manual')}
              className="flex-1"
            >
              Manual Input
            </Button>
          </div>

          {mode === 'sample' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a pre-loaded transaction sample for testing
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSampleType('normal')}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                    sampleType === 'normal'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border hover:border-green-500/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="success" className="mb-2">
                      Normal
                    </Badge>
                    {sampleType === 'normal' && <Sparkles className="h-4 w-4 text-green-500" />}
                  </div>
                  <h4 className="font-semibold mb-1">Safe Transaction</h4>
                  <p className="text-xs text-muted-foreground">
                    Example of a legitimate transaction
                  </p>
                </button>

                <button
                  onClick={() => setSampleType('fraud')}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                    sampleType === 'fraud'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-border hover:border-red-500/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="destructive" className="mb-2">
                      Fraud
                    </Badge>
                    {sampleType === 'fraud' && <Sparkles className="h-4 w-4 text-red-500" />}
                  </div>
                  <h4 className="font-semibold mb-1">Fraudulent Transaction</h4>
                  <p className="text-xs text-muted-foreground">
                    Example of a suspicious transaction
                  </p>
                </button>
              </div>
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  For demo purposes, enter Time and Amount values. Other features (V1-V28) will use
                  default values.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Time (scaled)
                    <span className="text-muted-foreground ml-2">(-5 to 5)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.0"
                    value={manualInput.Time || ''}
                    onChange={(e) =>
                      setManualInput({ ...manualInput, Time: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Amount (scaled)
                    <span className="text-muted-foreground ml-2">(-5 to 10)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.0"
                    value={manualInput.Amount || ''}
                    onChange={(e) =>
                      setManualInput({ ...manualInput, Amount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSampleData('normal')}
                  className="flex-1"
                >
                  Load Normal Sample
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSampleData('fraud')}
                  className="flex-1"
                >
                  Load Fraud Sample
                </Button>
              </div>
            </div>
          )}

          {/* Predict Button */}
          <Button
            onClick={handlePredict}
            disabled={isLoading || isCheckingApi || !isApiConnected}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : isCheckingApi ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to API...
              </>
            ) : !isApiConnected ? (
              <>
                <WifiOff className="mr-2 h-4 w-4" />
                API Disconnected
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Predict Fraud
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result Display */}
      {result && <PredictionResultDisplay result={result} />}
    </div>
  );
}
