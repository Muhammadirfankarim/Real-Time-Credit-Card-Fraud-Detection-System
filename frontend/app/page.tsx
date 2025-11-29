'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PredictionForm } from '@/components/prediction/PredictionForm';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { DATASET_STATS } from '@/lib/utils/sampleData';
import { FRAUD_MODEL_METADATA } from '@/lib/onnx/modelConfig';
import { formatNumber, formatPercentage } from '@/lib/utils';
import {
  Shield,
  Zap,
  BarChart3,
  Lock,
  TrendingUp,
  Database,
  Cpu,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold gradient-text">FraudGuard</h1>
                <p className="text-xs text-muted-foreground">Real-Time Fraud Protection Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground">Model Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Protect Your Business from Fraud
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            FraudGuard uses advanced AI to detect fraudulent credit card transactions in real-time.
            Process and analyze transactions instantly with{' '}
            <span className="text-primary font-semibold">
              {formatPercentage(FRAUD_MODEL_METADATA.accuracy)}
            </span>{' '}
            accuracy.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Instant Predictions</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Browser-Side ML</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Privacy First</span>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricsCard
            title="Model Accuracy"
            value={formatPercentage(FRAUD_MODEL_METADATA.accuracy)}
            description="Overall classification accuracy"
            icon={BarChart3}
            trend={{
              value: 2.1,
              label: 'vs previous version',
              isPositive: true,
            }}
          />
          <MetricsCard
            title="Precision"
            value={formatPercentage(FRAUD_MODEL_METADATA.precision)}
            description="Fraud detection precision"
            icon={CheckCircle2}
          />
          <MetricsCard
            title="Training Dataset"
            value={formatNumber(DATASET_STATS.total_transactions)}
            description="Transactions analyzed"
            icon={Database}
          />
          <MetricsCard
            title="Fraud Rate"
            value={formatPercentage(DATASET_STATS.fraud_percentage / 100)}
            description="In training dataset"
            icon={TrendingUp}
          />
        </section>

        {/* Main Prediction Interface */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <PredictionForm />
          </div>

          {/* Info Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  How It Works
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold text-xs">
                      1
                    </span>
                    <span>
                      <strong className="text-foreground">Input Transaction:</strong> Choose sample
                      data or enter manually
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold text-xs">
                      2
                    </span>
                    <span>
                      <strong className="text-foreground">AI Analysis:</strong> ONNX model runs
                      directly in your browser
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-semibold text-xs">
                      3
                    </span>
                    <span>
                      <strong className="text-foreground">Get Results:</strong> Instant fraud
                      probability with recommendations
                    </span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Model Information</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type:</dt>
                    <dd className="font-medium">{FRAUD_MODEL_METADATA.type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Version:</dt>
                    <dd className="font-medium">v{FRAUD_MODEL_METADATA.version}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Features:</dt>
                    <dd className="font-medium">{FRAUD_MODEL_METADATA.feature_count}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">F1-Score:</dt>
                    <dd className="font-medium">
                      {formatPercentage(FRAUD_MODEL_METADATA.f1_score)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">AUC:</dt>
                    <dd className="font-medium">{FRAUD_MODEL_METADATA.auc.toFixed(4)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Privacy & Security</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>All predictions run locally in your browser</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>No data sent to external servers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>GDPR & CCPA compliant</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Dataset Info */}
        <section className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 text-lg">About the Dataset</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground mb-2">Source</p>
                  <p className="font-medium">Kaggle Credit Card Fraud Detection</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    European cardholders, September 2013
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">Size</p>
                  <p className="font-medium">{formatNumber(DATASET_STATS.total_transactions)} transactions</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(DATASET_STATS.fraud_transactions)} fraud cases (
                    {formatPercentage(DATASET_STATS.fraud_percentage / 100)})
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">Features</p>
                  <p className="font-medium">30 anonymized features</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Time, V1-V28 (PCA), Amount
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            Built with ❤️ by{' '}
            <span className="font-semibold text-foreground">Muhammad Irfan Karim</span>
          </p>
          <p className="mt-2">
            Powered by Next.js, TypeScript, ONNX Runtime Web, and Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
