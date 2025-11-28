'use client';

/**
 * Confusion Matrix Component
 * Displays model performance metrics in a 2x2 matrix
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ConfusionMatrix as ConfusionMatrixType } from '@/types/transaction';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ConfusionMatrixProps {
  data: ConfusionMatrixType;
  showMetrics?: boolean;
  className?: string;
}

interface MetricCardProps {
  label: string;
  value: number;
  description: string;
  color: 'green' | 'blue' | 'yellow' | 'purple';
}

// ============================================================================
// METRIC CARD
// ============================================================================

function MetricCard({ label, value, description, color }: MetricCardProps) {
  const colorClasses = {
    green: 'border-green-500/50 bg-green-500/10 text-green-600',
    blue: 'border-blue-500/50 bg-blue-500/10 text-blue-600',
    yellow: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600',
    purple: 'border-purple-500/50 bg-purple-500/10 text-purple-600',
  };

  return (
    <div className={cn('rounded-lg border-2 p-4 text-center', colorClasses[color])}>
      <p className="mb-1 text-xs font-medium opacity-80">{label}</p>
      <p className="mb-1 text-2xl font-bold">{(value * 100).toFixed(1)}%</p>
      <p className="text-xs opacity-70">{description}</p>
    </div>
  );
}

// ============================================================================
// CONFUSION MATRIX CELL
// ============================================================================

interface MatrixCellProps {
  value: number;
  total: number;
  label: string;
  sublabel: string;
  type: 'TP' | 'TN' | 'FP' | 'FN';
}

function MatrixCell({ value, total, label, sublabel, type }: MatrixCellProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  const typeStyles = {
    TP: 'border-green-500 bg-green-500/20 hover:bg-green-500/30',
    TN: 'border-blue-500 bg-blue-500/20 hover:bg-blue-500/30',
    FP: 'border-red-500 bg-red-500/20 hover:bg-red-500/30',
    FN: 'border-orange-500 bg-orange-500/20 hover:bg-orange-500/30',
  };

  const typeLabels = {
    TP: 'True Positive',
    TN: 'True Negative',
    FP: 'False Positive',
    FN: 'False Negative',
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center justify-center rounded-lg border-2 p-6 transition-all',
        typeStyles[type]
      )}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">
        {typeLabels[type]}
      </div>
      <div className="mb-1 text-4xl font-bold">{value}</div>
      <div className="mb-2 text-sm opacity-80">{percentage.toFixed(1)}%</div>
      <div className="text-center text-xs">
        <div className="font-medium">{label}</div>
        <div className="opacity-70">{sublabel}</div>
      </div>

      {/* Hover tooltip */}
      <div className="absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 rounded-md border bg-background px-3 py-2 text-xs shadow-lg group-hover:block">
        <strong>{typeLabels[type]}</strong>
        <br />
        {label} {sublabel}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConfusionMatrix({
  data,
  showMetrics = true,
  className,
}: ConfusionMatrixProps) {
  const { tp: TP, tn: TN, fp: FP, fn: FN } = data;
  const total = TP + TN + FP + FN;

  // Calculate metrics
  const accuracy = total > 0 ? (TP + TN) / total : 0;
  const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
  const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  if (total === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Confusion Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No predictions yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Confusion Matrix</CardTitle>
        <p className="text-sm text-muted-foreground">
          Model performance breakdown ({total} predictions)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Matrix Grid */}
        <div>
          <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
            <div></div>
            <div className="text-center font-semibold">Predicted: Fraud</div>
            <div className="text-center font-semibold">Predicted: Normal</div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Row 1: Actual Fraud */}
            <div className="flex items-center justify-end pr-2 text-sm font-semibold">
              Actual: Fraud
            </div>
            <MatrixCell
              value={TP}
              total={total}
              label="Correctly identified"
              sublabel="fraud transactions"
              type="TP"
            />
            <MatrixCell
              value={FN}
              total={total}
              label="Missed fraud"
              sublabel="(false negative)"
              type="FN"
            />

            {/* Row 2: Actual Normal */}
            <div className="flex items-center justify-end pr-2 text-sm font-semibold">
              Actual: Normal
            </div>
            <MatrixCell
              value={FP}
              total={total}
              label="False alarm"
              sublabel="(false positive)"
              type="FP"
            />
            <MatrixCell
              value={TN}
              total={total}
              label="Correctly identified"
              sublabel="normal transactions"
              type="TN"
            />
          </div>
        </div>

        {/* Performance Metrics */}
        {showMetrics && (
          <div className="space-y-3">
            <h4 className="font-semibold">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard
                label="Accuracy"
                value={accuracy}
                description="Overall correctness"
                color="green"
              />
              <MetricCard
                label="Precision"
                value={precision}
                description="Fraud prediction accuracy"
                color="blue"
              />
              <MetricCard
                label="Recall"
                value={recall}
                description="Fraud detection rate"
                color="yellow"
              />
              <MetricCard
                label="F1-Score"
                value={f1Score}
                description="Harmonic mean"
                color="purple"
              />
            </div>

            {/* Detailed Explanation */}
            <div className="mt-4 rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <strong className="text-foreground">Accuracy:</strong> {(accuracy * 100).toFixed(1)}% of all predictions were correct
                </div>
                <div>
                  <strong className="text-foreground">Precision:</strong> {(precision * 100).toFixed(1)}% of fraud predictions were actual fraud
                </div>
                <div>
                  <strong className="text-foreground">Recall:</strong> {(recall * 100).toFixed(1)}% of actual fraud cases were detected
                </div>
                <div>
                  <strong className="text-foreground">F1-Score:</strong> {(f1Score * 100).toFixed(1)}% balanced performance metric
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate sample confusion matrix data
 */
export function generateSampleConfusionMatrix(): ConfusionMatrixType {
  const tp = Math.floor(Math.random() * 50) + 40; // 40-90 true positives
  const tn = Math.floor(Math.random() * 200) + 100; // 100-300 true negatives
  const fp = Math.floor(Math.random() * 20) + 5; // 5-25 false positives
  const fn = Math.floor(Math.random() * 10) + 2; // 2-12 false negatives

  return { tp, tn, fp, fn };
}

export default ConfusionMatrix;
