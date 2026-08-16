import { BigNumber } from 'bignumber.js';
import { truncateFormat } from '@repo/lib/format';

interface FormatRateProps {
  rate: BigNumber;
  payCoin?: string;
  className?: string;
}

const FormatRate: React.FC<FormatRateProps> = ({
  rate,
  payCoin,
  className,
}: FormatRateProps) => {
  // Special handling: stableCoins with low volatility, display: 4dp
  if (payCoin === 'USDC') {
    return <span className={className}>{truncateFormat(rate, 4)}</span>;
  }

  const absRate = rate.abs();

  if (absRate.gte(100)) {
    return <span className={className}>{truncateFormat(rate, 2)}</span>;
  }

  if (absRate.gte(1)) {
    return <span className={className}>{truncateFormat(rate, 4)}</span>;
  }

  if (absRate.gte(0.0001)) {
    const log = Math.floor(Math.log10(absRate.toNumber()));
    const decimal = 4 - log - 1;
    return (
      <span className={className}>
        {truncateFormat(rate, Math.max(0, decimal))}
      </span>
    );
  }

  if (absRate.lt(0.0001)) {
    const rateStr = rate.toString();
    const match = rateStr.match(/^-?0\.0*([1-9]\d{0,4})/);
    if (match && match[1]) {
      const zeros = rateStr.indexOf(match[1]) - rateStr.indexOf('.') - 1;
      const significantDigits = match[1].substring(0, 5);
      const sign = rate.isNegative() ? '-' : '';
      return (
        <span className={className}>
          {sign}0.0<sub>{zeros}</sub>
          {significantDigits}
        </span>
      );
    }
  }

  return <span className={className}>{truncateFormat(rate, 4)}</span>;
};
FormatRate.displayName = 'FormatRate';

export default FormatRate;
