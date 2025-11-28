'use client';

/**
 * Transaction Chart Component
 * Displays transaction trends over time using Recharts
 */

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface TransactionDataPoint {
  timestamp: string | Date;
  amount: number;
  isFraud: boolean;
  risk?: number;
}

export interface AggregatedDataPoint {
  date: string;
  total: number;
  fraud: number;
  normal: number;
  avgAmount: number;
  fraudRate: number;
}

interface TransactionChartProps {
  data: AggregatedDataPoint[];
  type?: 'line' | 'area';
  showLegend?: boolean;
  height?: number;
  className?: string;
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      <div className="space-y-1 text-sm">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {entry.name === 'Fraud Rate'
                ? `${entry.value?.toFixed(1)}%`
                : formatNumber(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

export function TransactionChart({
  data,
  type = 'line',
  showLegend = true,
  height = 300,
  className,
}: TransactionChartProps) {
  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transaction Trends</CardTitle>
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
        <CardTitle>Transaction Trends</CardTitle>
        <p className="text-sm text-muted-foreground">
          Daily transaction volume and fraud detection rates
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {type === 'area' ? (
            <AreaChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs text-muted-foreground"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                yAxisId="left"
                className="text-xs text-muted-foreground"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                className="text-xs text-muted-foreground"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
              )}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={2}
                name="Total Transactions"
                dot={false}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="fraud"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.2}
                strokeWidth={2}
                name="Fraud Detected"
                dot={false}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="normal"
                stroke="hsl(142 76% 36%)"
                fill="hsl(142 76% 36%)"
                fillOpacity={0.2}
                strokeWidth={2}
                name="Normal Transactions"
                dot={false}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="fraudRate"
                stroke="hsl(var(--chart-5))"
                fill="hsl(var(--chart-5))"
                fillOpacity={0.1}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Fraud Rate"
                dot={false}
              />
            </AreaChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs text-muted-foreground"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                yAxisId="left"
                className="text-xs text-muted-foreground"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                className="text-xs text-muted-foreground"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
              )}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Total Transactions"
                dot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="fraud"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="Fraud Detected"
                dot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="normal"
                stroke="hsl(142 76% 36%)"
                strokeWidth={2}
                name="Normal Transactions"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="fraudRate"
                stroke="hsl(var(--chart-5))"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Fraud Rate"
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Aggregate raw transaction data by date
 */
export function aggregateTransactionsByDate(
  transactions: TransactionDataPoint[]
): AggregatedDataPoint[] {
  const grouped = new Map<string, TransactionDataPoint[]>();

  transactions.forEach((tx) => {
    const date = new Date(tx.timestamp).toISOString().split('T')[0];
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(tx);
  });

  const aggregated: AggregatedDataPoint[] = [];

  grouped.forEach((txs, date) => {
    const total = txs.length;
    const fraud = txs.filter((tx) => tx.isFraud).length;
    const normal = total - fraud;
    const avgAmount = txs.reduce((sum, tx) => sum + tx.amount, 0) / total;
    const fraudRate = (fraud / total) * 100;

    aggregated.push({
      date,
      total,
      fraud,
      normal,
      avgAmount,
      fraudRate,
    });
  });

  return aggregated.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate sample data for testing
 */
export function generateSampleTransactionData(days: number = 30): AggregatedDataPoint[] {
  const data: AggregatedDataPoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const total = Math.floor(Math.random() * 500) + 100;
    const fraudRate = Math.random() * 2 + 0.1; // 0.1% - 2.1%
    const fraud = Math.floor((total * fraudRate) / 100);
    const normal = total - fraud;
    const avgAmount = Math.random() * 500 + 50;

    data.push({
      date: dateStr,
      total,
      fraud,
      normal,
      avgAmount,
      fraudRate,
    });
  }

  return data;
}

export default TransactionChart;
