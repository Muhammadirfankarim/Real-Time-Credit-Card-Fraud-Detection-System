import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export utilities from utils/index
export {
  formatPercentage,
  formatCurrency,
  formatNumber,
  getRiskLevel,
  getRiskColor,
  getPredictionColor,
  getPredictionBorderColor
} from './utils/index';
