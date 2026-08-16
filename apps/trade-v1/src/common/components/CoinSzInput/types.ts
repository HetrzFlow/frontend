import { ReactNode } from 'react';

export interface CoinSzInputProps {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
  showBalance?: boolean;
  balance?: string;
  balanceUnit?: string;
  decimal?: number;
  usdPx?: string;
  usdDecimal?: number;
  className?: string;
  inputSuffix?: ReactNode;
  isLoading?: boolean;
  max?: string | number;
  isLong?: boolean;
  onValueChange?: (value: string) => void;
  onPercentChange?: (value: string, action?: 'drag' | 'click') => void;
}
