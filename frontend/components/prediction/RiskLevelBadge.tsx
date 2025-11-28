import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { RiskLevel, RISK_LEVEL_CONFIG } from '@/types/transaction';
import { cn } from '@/lib/utils';
import { AlertTriangle, Shield, Info } from 'lucide-react';

export interface RiskLevelBadgeProps {
  riskLevel: RiskLevel;
  showIcon?: boolean;
  className?: string;
}

const RISK_ICONS: Record<RiskLevel, React.ComponentType<{ className?: string }>> = {
  Low: Shield,
  Medium: Info,
  High: AlertTriangle,
};

const RISK_STYLES: Record<RiskLevel, string> = {
  Low: 'risk-low',
  Medium: 'risk-medium',
  High: 'risk-high',
};

export function RiskLevelBadge({ riskLevel, showIcon = true, className }: RiskLevelBadgeProps) {
  // Defensive: Fallback to Medium if undefined
  const normalizedLevel = riskLevel || 'Medium';
  const Icon = RISK_ICONS[normalizedLevel] || RISK_ICONS['Medium'];
  const config = RISK_LEVEL_CONFIG[normalizedLevel] || RISK_LEVEL_CONFIG['Medium'];

  return (
    <Badge className={cn('gap-1 border', RISK_STYLES[normalizedLevel], className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{config.message}</span>
    </Badge>
  );
}
