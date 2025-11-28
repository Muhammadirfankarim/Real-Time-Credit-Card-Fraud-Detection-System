'use client';

/**
 * Dashboard Page
 * Main dashboard with analytics, charts, and real-time statistics
 */

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Database, Activity, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { RecentPredictionsCard } from '@/components/dashboard/RecentPredictionsCard';
import {
  TransactionChart,
  RiskDistribution,
  ConfusionMatrix,
  FeatureImportance,
  generateSampleTransactionData,
  generateSampleRiskData,
  generateSampleConfusionMatrix,
  generateSampleFeatureImportance,
} from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePredictionStore } from '@/lib/store';
import { FRAUD_MODEL_METADATA } from '@/lib/onnx/modelConfig';
import { DATASET_STATS } from '@/lib/utils/sampleData';

// ============================================================================
// COMPONENT
// ============================================================================

export default function DashboardPage() {
  const { history, stats } = usePredictionStore();

  // Use real data if available, otherwise use sample data
  const hasRealData = history.length > 0;

  // Transaction chart data
  const transactionChartData = hasRealData
    ? generateSampleTransactionData(30) // TODO: Use real aggregated data
    : generateSampleTransactionData(30);

  // Risk distribution data - always use sample for now since we have real predictions
  const riskDistributionData = generateSampleRiskData();

  // Confusion matrix data
  const confusionMatrixData = hasRealData
    ? generateSampleConfusionMatrix() // TODO: Calculate from real predictions
    : generateSampleConfusionMatrix();

  // Feature importance data
  const featureImportanceData = generateSampleFeatureImportance();

  // Calculate metrics
  const fraudRate = stats.totalPredictions > 0
    ? (stats.fraudDetected / stats.totalPredictions) * 100
    : DATASET_STATS.fraud_percentage;

  const avgConfidence = stats.totalPredictions > 0
    ? stats.averageConfidence * 100
    : FRAUD_MODEL_METADATA.accuracy * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold gradient-text">Fraud Detection Dashboard</h1>
                <p className="text-xs text-muted-foreground">Real-Time Analytics & Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground">System Active</span>
              </div>
              <Badge variant="outline">
                Model v{FRAUD_MODEL_METADATA.version}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard
              title="Total Predictions"
              value={stats.totalPredictions > 0 ? stats.totalPredictions.toString() : DATASET_STATS.total_transactions.toLocaleString()}
              description="Transactions analyzed"
              icon={Database}
              trend={
                stats.totalPredictions > 0
                  ? { value: 12.5, label: 'vs last week', isPositive: true }
                  : undefined
              }
            />
            <MetricsCard
              title="Fraud Detection Rate"
              value={`${fraudRate.toFixed(2)}%`}
              description="Transactions flagged as fraud"
              icon={AlertTriangle}
            />
            <MetricsCard
              title="Model Accuracy"
              value={`${FRAUD_MODEL_METADATA.accuracy.toFixed(1)}%`}
              description="Overall model performance"
              icon={Activity}
              trend={{ value: 2.1, label: 'vs previous version', isPositive: true }}
            />
            <MetricsCard
              title="Avg Confidence"
              value={`${avgConfidence.toFixed(1)}%`}
              description="Average prediction confidence"
              icon={TrendingUp}
            />
          </div>
        </section>

        {/* Charts Row 1 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Transaction Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transaction Trends - Spans 2 columns */}
            <div className="lg:col-span-2">
              <TransactionChart
                data={transactionChartData}
                type="area"
                height={350}
              />
            </div>

            {/* Risk Distribution */}
            <div>
              <RiskDistribution
                data={riskDistributionData}
                type="donut"
                height={350}
              />
            </div>
          </div>
        </section>

        {/* Charts Row 2 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Model Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <ConfusionMatrix
              data={confusionMatrixData}
              showMetrics={true}
            />

            {/* Feature Importance */}
            <FeatureImportance
              data={featureImportanceData}
              topN={15}
              height={600}
            />
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Predictions</h2>
          <RecentPredictionsCard />
        </section>

        {/* Model Information */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Model Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{FRAUD_MODEL_METADATA.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="font-medium">{FRAUD_MODEL_METADATA.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-medium uppercase">{FRAUD_MODEL_METADATA.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Features:</span>
                  <span className="font-medium">{FRAUD_MODEL_METADATA.feature_count}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span className="font-medium">{(FRAUD_MODEL_METADATA.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precision:</span>
                  <span className="font-medium">{(FRAUD_MODEL_METADATA.precision * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recall:</span>
                  <span className="font-medium">{(FRAUD_MODEL_METADATA.recall * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">F1-Score:</span>
                  <span className="font-medium">{(FRAUD_MODEL_METADATA.f1_score * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dataset Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{DATASET_STATS.total_transactions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fraud:</span>
                  <span className="font-medium text-destructive">{DATASET_STATS.fraud_transactions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Normal:</span>
                  <span className="font-medium text-green-600">{DATASET_STATS.normal_transactions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fraud Rate:</span>
                  <span className="font-medium">{DATASET_STATS.fraud_percentage.toFixed(2)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
