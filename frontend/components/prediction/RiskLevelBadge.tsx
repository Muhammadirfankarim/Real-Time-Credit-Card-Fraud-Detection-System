import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { RiskLevel, RISK_LEVEL_CONFIG } from '@/types/transaction';
import { cn } from '@/lib/utils';
import { AlertTriangle, Shield, AlertOctagon, Info } from 'lucide-react';

export interface RiskLevelBadgeProps {
  riskLevel: RiskLevel;
  showIcon?: boolean;
  className?: string;
}

const RISK_ICONS = {
  VERY_LOW: Shield,
  LOW: Shield,
  MEDIUM: Info,
  HIGH: AlertTriangle,
  VERY_HIGH: AlertOctagon,
};

const RISK_STYLES = {
  VERY_LOW: 'risk-very-low',
  LOW: 'risk-low',
  MEDIUM: 'risk-medium',
  HIGH: 'risk-high',
  VERY_HIGH: 'risk-very-high',
};

export function RiskLevelBadge({ riskLevel, showIcon = true, className }: RiskLevelBadgeProps) {
  // Defensive: Normalize to uppercase and fallback to MEDIUM if undefined
  const normalizedLevel = (riskLevel?.toUpperCase() as RiskLevel) || 'MEDIUM';
  const Icon = RISK_ICONS[normalizedLevel] || RISK_ICONS['MEDIUM'];
  const config = RISK_LEVEL_CONFIG[normalizedLevel] || RISK_LEVEL_CONFIG['MEDIUM'];

  return (
    <Badge className={cn('gap-1 border', RISK_STYLES[normalizedLevel], className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{config.message}</span>
    </Badge>
  );
}
