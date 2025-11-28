'use client';

/**
 * Risk Distribution Component
 * Displays risk level distribution using Pie/Donut chart
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RiskLevel } from '@/types/transaction';

// ============================================================================
// TYPES
// ============================================================================

export interface RiskDistributionData {
  riskLevel: RiskLevel;
  count: number;
  percentage: number;
}

interface RiskDistributionProps {
  data: Record<RiskLevel, number>;
  type?: 'pie' | 'donut';
  showLegend?: boolean;
  height?: number;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RISK_COLORS: Record<RiskLevel, string> = {
  VERY_LOW: 'hsl(142 76% 36%)', // Green
  LOW: 'hsl(142 70% 45%)', // Light green
  MEDIUM: 'hsl(48 96% 53%)', // Yellow
  HIGH: 'hsl(25 95% 53%)', // Orange
  VERY_HIGH: 'hsl(var(--destructive))', // Red
};

const RISK_LABELS: Record<RiskLevel, string> = {
  VERY_LOW: 'Very Low',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  VERY_HIGH: 'Very High',
};

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as RiskDistributionData;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <div className="mb-2 flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: RISK_COLORS[data.riskLevel] }}
        />
        <span className="font-semibold text-foreground">
          {RISK_LABELS[data.riskLevel]} Risk
        </span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Count:</span>
          <span className="font-medium text-foreground">{data.count}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Percentage:</span>
          <span className="font-medium text-foreground">
            {data.percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CUSTOM LABEL
// ============================================================================

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percentage,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percentage: number;
}) => {
  if (percentage < 5) return null; // Don't show label for small slices

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${percentage.toFixed(1)}%`}
    </text>
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

export function RiskDistribution({
  data,
  type = 'donut',
  showLegend = true,
  height = 300,
  className,
}: RiskDistributionProps) {
  // Transform data
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  const chartData: RiskDistributionData[] = (
    Object.entries(data) as [RiskLevel, number][]
  )
    .map(([riskLevel, count]) => ({
      riskLevel,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .filter((item) => item.count > 0) // Only show non-zero slices
    .sort((a, b) => {
      // Sort by risk level order
      const order: RiskLevel[] = ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW'];
      return order.indexOf(a.riskLevel) - order.indexOf(b.riskLevel);
    });

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
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

  const innerRadius = type === 'donut' ? 60 : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Risk Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Breakdown of transactions by risk level
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={innerRadius}
                fill="#8884d8"
                dataKey="count"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={RISK_COLORS[entry.riskLevel]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          {showLegend && (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              {chartData.map((item) => (
                <div
                  key={item.riskLevel}
                  className="flex items-center gap-2"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: RISK_COLORS[item.riskLevel] }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      {RISK_LABELS[item.riskLevel]}
                    </span>
                    <span className="font-medium">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 grid w-full grid-cols-3 gap-4 rounded-lg border p-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{total}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">High Risk</p>
              <p className="text-lg font-bold text-destructive">
                {data.HIGH + data.VERY_HIGH}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Low Risk</p>
              <p className="text-lg font-bold text-green-600">
                {data.LOW + data.VERY_LOW}
              </p>
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
 * Generate sample risk distribution data
 */
export function generateSampleRiskData(): Record<RiskLevel, number> {
  return {
    VERY_LOW: Math.floor(Math.random() * 100) + 50,
    LOW: Math.floor(Math.random() * 80) + 40,
    MEDIUM: Math.floor(Math.random() * 50) + 20,
    HIGH: Math.floor(Math.random() * 30) + 10,
    VERY_HIGH: Math.floor(Math.random() * 20) + 5,
  };
}

export default RiskDistribution;
