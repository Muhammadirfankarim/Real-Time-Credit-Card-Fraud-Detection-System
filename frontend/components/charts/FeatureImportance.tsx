'use client';

/**
 * Feature Importance Component
 * Displays feature importance using horizontal bar chart
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureImportanceData {
  feature: string;
  importance: number;
  category?: 'temporal' | 'amount' | 'pca' | 'other';
}

interface FeatureImportanceProps {
  data: FeatureImportanceData[];
  topN?: number;
  showCategory?: boolean;
  height?: number;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_COLORS = {
  temporal: 'hsl(221 83% 53%)', // Blue
  amount: 'hsl(142 76% 36%)', // Green
  pca: 'hsl(280 100% 70%)', // Purple
  other: 'hsl(var(--muted-foreground))', // Gray
};

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as FeatureImportanceData;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="mb-1 font-semibold text-foreground">{data.feature}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Importance:</span>
          <span className="font-medium text-foreground">
            {(data.importance * 100).toFixed(2)}%
          </span>
        </div>
        {data.category && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium capitalize text-foreground">
              {data.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

export function FeatureImportance({
  data,
  topN = 15,
  showCategory = true,
  height = 400,
  className,
}: FeatureImportanceProps) {
  // Sort by importance and take top N
  const sortedData = [...data]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, topN);

  if (sortedData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Feature Importance</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Feature Importance</CardTitle>
        <p className="text-sm text-muted-foreground">
          Top {topN} most important features for fraud detection
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-xs text-muted-foreground"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <YAxis
              type="category"
              dataKey="feature"
              className="text-xs text-muted-foreground"
              tick={{ fill: 'currentColor' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    showCategory && entry.category
                      ? CATEGORY_COLORS[entry.category]
                      : 'hsl(var(--primary))'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        {showCategory && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS.temporal }}
              />
              <span>Temporal Features</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS.amount }}
              />
              <span>Amount Features</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: CATEGORY_COLORS.pca }}
              />
              <span>PCA Features (V1-V28)</span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 rounded-lg border bg-muted/50 p-4 text-sm">
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">Total Features:</span>{' '}
              <strong>{data.length}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Showing Top:</span>{' '}
              <strong>{sortedData.length}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Cumulative Importance:</span>{' '}
              <strong>
                {(
                  sortedData.reduce((sum, d) => sum + d.importance, 0) * 100
                ).toFixed(1)}
                %
              </strong>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate sample feature importance data
 */
export function generateSampleFeatureImportance(): FeatureImportanceData[] {
  const features: FeatureImportanceData[] = [];

  // Add Time and Amount
  features.push(
    { feature: 'Time', importance: Math.random() * 0.05, category: 'temporal' },
    { feature: 'Amount', importance: Math.random() * 0.15, category: 'amount' }
  );

  // Add V1-V28 (PCA features)
  for (let i = 1; i <= 28; i++) {
    features.push({
      feature: `V${i}`,
      importance: Math.random() * 0.1,
      category: 'pca',
    });
  }

  // Normalize importances to sum to 1
  const total = features.reduce((sum, f) => sum + f.importance, 0);
  features.forEach((f) => {
    f.importance = f.importance / total;
  });

  return features;
}

export default FeatureImportance;
