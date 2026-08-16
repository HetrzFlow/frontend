import { FC } from 'react';

import { truncateFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { useGlobalStore } from '@/common';

interface FeeProps {
  fee: string;
  className?: string;
}

const Fee: FC<FeeProps> = ({ fee, className }) => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  return (
    <div className={cn('font-plex leading-tight max-md:text-sm', className)}>
      {truncateFormat(fee, usdAmountDisplayDecimal, {
        style: 'currency',
        currency: 'USD',
        showMinDecimalValue: true,
      })}
    </div>
  );
};

export default Fee;
