'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Eye, TrendingUp, DollarSign } from 'lucide-react';
import { usePredictionStore } from '@/lib/store/usePredictionStore';
import { PredictionHistoryItem } from '@/lib/store/usePredictionStore';
import { formatPercentage } from '@/lib/utils/index';
import { RiskLevelBadge } from '../prediction/RiskLevelBadge';

export function RecentPredictionsCard() {
    // Use store directly with useMemo to prevent infinite loop
    const history = usePredictionStore((state) => state.history);
    const recentPredictions = React.useMemo(() => history.slice(0, 10), [history]);

    const [selectedPrediction, setSelectedPrediction] = React.useState<PredictionHistoryItem | null>(null);
    const [mounted, setMounted] = React.useState(false);

    // Fix hydration by only rendering dates on client
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const formatDate = (date: Date) => {
        if (!mounted) return 'Loading...';
        return new Date(date).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!mounted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Latest Transactions</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Loading recent predictions...
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="py-12 text-center text-muted-foreground">
                        <p>Loading...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Latest Transactions</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Most recent fraud detection results (scroll for more)
                    </p>
                </CardHeader>
                <CardContent>
                    {recentPredictions.length > 0 ? (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {recentPredictions.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedPrediction(item)}
                                    className="w-full flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-all hover:shadow-md cursor-pointer text-left group"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex flex-col flex-1">
                                            <span className="text-sm font-medium">
                                                {formatDate(item.timestamp)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                ID: {item.id.slice(-8)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-sm font-medium">
                                                {formatPercentage(item.result.confidence_score)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                confidence
                                            </div>
                                        </div>
                                        <RiskLevelBadge riskLevel={item.result.risk_level} showIcon={false} />
                                        <Badge
                                            variant={item.result.prediction === 'Fraud' ? 'destructive' : 'default'}
                                            className="min-w-[70px] justify-center"
                                        >
                                            {item.result.prediction}
                                        </Badge>
                                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-muted-foreground">
                            <AlertTriangle className="mx-auto h-12 w-12 mb-3 opacity-50" />
                            <p className="text-lg font-medium mb-1">No predictions yet</p>
                            <p className="text-sm">
                                Start analyzing transactions to see results here
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Modal */}
            <Dialog open={!!selectedPrediction} onOpenChange={() => setSelectedPrediction(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    {selectedPrediction && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    Prediction Details
                                    <Badge
                                        variant={selectedPrediction.result.prediction === 'Fraud' ? 'destructive' : 'default'}
                                    >
                                        {selectedPrediction.result.prediction}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                    Transaction analyzed on {formatDate(selectedPrediction.timestamp)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                {/* Prediction Results */}
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Prediction Results
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Prediction</p>
                                                <p className="text-lg font-bold">{selectedPrediction.result.prediction}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Confidence</p>
                                                <p className="text-lg font-bold">
                                                    {formatPercentage(selectedPrediction.result.confidence_score)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Risk Level</p>
                                                <div className="mt-1">
                                                    <RiskLevelBadge riskLevel={selectedPrediction.result.risk_level} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Model Version</p>
                                                <p className="text-lg font-medium">
                                                    v{selectedPrediction.result.model_version || '1.0.0'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Probabilities */}
                                <div>
                                    <h3 className="font-semibold mb-3">Probability Breakdown</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">Normal Transaction</span>
                                                <span className="text-sm font-medium">
                                                    {formatPercentage(selectedPrediction.result.probability_normal)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${selectedPrediction.result.probability_normal * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">Fraudulent Transaction</span>
                                                <span className="text-sm font-medium">
                                                    {formatPercentage(selectedPrediction.result.probability_fraud)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-red-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${selectedPrediction.result.probability_fraud * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Transaction Info */}
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Transaction Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Time (scaled)</p>
                                            <p className="font-mono">{selectedPrediction.transaction.Time.toFixed(4)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Amount (scaled)</p>
                                            <p className="font-mono">{selectedPrediction.transaction.Amount.toFixed(4)}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground mb-1">Transaction ID</p>
                                            <p className="font-mono text-xs break-all">{selectedPrediction.id}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Features Summary */}
                                <div>
                                    <h3 className="font-semibold mb-3">PCA Features (V1-V28)</h3>
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                        {Array.from({ length: 28 }, (_, i) => {
                                            const feature = `V${i + 1}` as keyof typeof selectedPrediction.transaction;
                                            const value = selectedPrediction.transaction[feature] as number;
                                            return (
                                                <div key={feature} className="p-2 bg-muted rounded text-center">
                                                    <p className="text-muted-foreground">{feature}</p>
                                                    <p className="font-mono font-medium">{value.toFixed(2)}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
