import { FC } from 'react';
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
        'font-plex flex flex-col justify-center gap-1.5 max-md:text-sm',
        className,
      )}
    >
      {size !== undefined
        ? unitFormat(size, usdAmountDisplayDecimal, {
            minNumber: 1000000,
            unitDecimal: 3,
            style: 'currency',
            currency: 'USD',
            signDisplay: showSign ? 'exceptZero' : 'auto',
          })
        : EMPTY_DISPLAY}
      {closeOrderCount ? (
        <span
          className="text-secondary-foreground hover:text-t-1100 cursor-pointer text-xs underline underline-offset-2"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenOrdersDialog) {
              onOpenOrdersDialog();
            }
          }}
        >{t`Orders(${count})`}</span>
      ) : null}
    </div>
  );
};

export default Size;
