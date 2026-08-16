import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { EMPTY_DISPLAY, unitFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { useGlobalStore } from '@/common';

interface SizeProps {
  size: string;
  showSign?: boolean;
  closeOrderCount?: number;
  className?: string;
  onOpenOrdersDialog?: () => void;
}

const Size: FC<SizeProps> = ({
  size,
  showSign,
  closeOrderCount,
  className,
  onOpenOrdersDialog,
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const count = closeOrderCount;

  return (
    <div
      className={cn(
        'font-plex flex flex-col justify-center gap-1.5 leading-tight max-md:text-sm',
        showSign && +size > 0 ? 'text-up' : '',
        showSign && +size < 0 ? 'text-down' : '',
        className,
      )}
    >
      {+size
        ? unitFormat(size, usdAmountDisplayDecimal, {
            minNumber: 1000000,
            unitDecimal: 3,
            style: 'currency',
            currency: 'USD',
            signDisplay: showSign ? 'always' : 'auto',
          })
        : EMPTY_DISPLAY}
      {closeOrderCount ? (
        <span
          className="text-secondary-foreground hover:text-t-1100 cursor-pointer text-xs underline underline-offset-2"
          onClick={onOpenOrdersDialog}
        >{t`Orders(${count})`}</span>
      ) : null}
    </div>
  );
};

export default memo(Size);
