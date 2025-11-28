'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PredictionResult, RISK_LEVEL_CONFIG, RiskLevel } from '@/types/transaction';
import { RiskLevelBadge } from './RiskLevelBadge';
import { formatPercentage } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  Shield,
} from 'lucide-react';

export interface PredictionResultDisplayProps {
  result: PredictionResult;
  showDetails?: boolean;
  className?: string;
}

export function PredictionResultDisplay({
  result,
  showDetails = true,
  className,
}: PredictionResultDisplayProps) {
  const isFraud = result.prediction === 'Fraud';

  // Defensive: Fallback to Medium if risk_level is undefined
  const normalizedRiskLevel = result.risk_level || 'Medium';
  const riskConfig = RISK_LEVEL_CONFIG[normalizedRiskLevel] || RISK_LEVEL_CONFIG['Medium'];

  // Debug: Log the result to see what API returns
  React.useEffect(() => {
    console.log('Prediction Result:', result);
    console.log('Normalized Risk Level:', normalizedRiskLevel);
  }, [result, normalizedRiskLevel]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Prediction Alert */}
      <Alert variant={isFraud ? 'destructive' : 'success'} className="border-2">
        {isFraud ? (
          <XCircle className="h-5 w-5" />
        ) : (
          <CheckCircle2 className="h-5 w-5" />
        )}
        <AlertTitle className="text-lg font-bold">
          {isFraud ? '🚨 FRAUD DETECTED' : '✅ TRANSACTION SAFE'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-2">
            <p className="text-base">
              This transaction has been classified as{' '}
              <span className="font-bold">{result.prediction}</span> with{' '}
              <span className="font-bold">{formatPercentage(result.confidence_score)}</span>{' '}
              confidence.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">Risk Level:</span>
              <RiskLevelBadge riskLevel={normalizedRiskLevel} />
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {showDetails && (
        <>
          {/* Probabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Prediction Probabilities
              </CardTitle>
              <CardDescription>Detailed probability breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Normal Probability */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    Normal Transaction
                  </span>
                  <span className="text-sm font-bold">
                    {formatPercentage(result.probability_normal)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${result.probability_normal * 100}%` }}
                  />
                </div>
              </div>

              {/* Fraud Probability */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Fraudulent Transaction
                  </span>
                  <span className="text-sm font-bold">
                    {formatPercentage(result.probability_fraud)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${result.probability_fraud * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment & Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Assessment</CardTitle>
              <CardDescription>Recommended action for this transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="p-4 rounded-lg border-l-4"
                style={{ borderLeftColor: riskConfig.color }}
              >
                <h4 className="font-semibold mb-2" style={{ color: riskConfig.color }}>
                  {riskConfig.message}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Recommended Action: <span className="font-medium">{riskConfig.action}</span>
                </p>

                {/* Action Items */}
                <div className="space-y-2 text-sm">
                  {isFraud ? (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>Block transaction immediately</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>Contact customer for verification</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>Flag account for review</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>Investigate transaction patterns</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        <span>Process transaction normally</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        <span>Record in transaction log</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        <span>Continue with standard procedures</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          {result.processing_time_ms && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Processing Time
              </span>
              <span className="font-medium">{result.processing_time_ms.toFixed(2)}ms</span>
            </div>
          )}

          {result.model_version && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Model Version</span>
              <Badge variant="outline" className="text-xs">
                v{result.model_version}
              </Badge>
            </div>
          )}
        </>
      )}
    </div>
  );
}
