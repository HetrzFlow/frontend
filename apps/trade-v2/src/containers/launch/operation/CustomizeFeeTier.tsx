import { FC } from 'react';
import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { CheckIcon, cn, NumberInput } from '@repo/ui';
import { useLaunchStore } from '../store';

interface CustomizeFeeTierProps {
  className?: string;
  checked: boolean;
  onChecked: (checked: boolean) => void;
}

const CustomizeFeeTier: FC<CustomizeFeeTierProps> = ({
  className,
  checked,
  onChecked,
}) => {
  const {
    i18n: { locale },
  } = useLingui();
  const [openCloseFee, swapFee, lpRate] = useLaunchStore(
    useShallow((state) => [state.openCloseFee, state.swapFee, state.lpRate]),
  );
  const setState = useLaunchStore((state) => state.setState);

  return (
    <div
      className={cn(
        'bg-bg-3 relative cursor-pointer rounded-lg border p-2',
        className,
        checked ? 'border-accent' : 'border-transparent',
      )}
      onClick={() => onChecked(true)}
    >
      <div className="font-medium">{t`Customize`}</div>
      <div className="mt-2 flex gap-2">
        <div className="flex w-1/3 flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Open/Close`}</span>
          <NumberInput
            className="rounded-lg px-3 py-1 font-medium"
            inputClassName="text-xs"
            variant="ghost"
            value={openCloseFee && calc(openCloseFee).times(100).toFixed()}
            decimal={2}
            locale={locale}
            suffix="%"
            placeholder={t`Enter`}
            suffixClassName="pl-2 text-t-1100"
            onValueChange={(v) =>
              setState({ openCloseFee: v && calc(v).div(100).toFixed() })
            }
          />
        </div>
        <div className="flex w-1/3 flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Swap`}</span>
          <NumberInput
            className="rounded-lg px-3 py-1 font-medium"
            inputClassName="text-xs"
            variant="ghost"
            value={swapFee && calc(swapFee).times(100).toFixed()}
            decimal={2}
            locale={locale}
            suffix="%"
            placeholder={t`Enter`}
            suffixClassName="pl-2 text-t-1100"
            onValueChange={(v) =>
              setState({ swapFee: v && calc(v).div(100).toFixed() })
            }
          />
        </div>
        <div className="flex w-1/3 flex-col gap-1">
          <span className="text-t-270 text-xs">{t`LP Deposit/Withdraw`}</span>
          <NumberInput
            className="rounded-lg px-3 py-1 font-medium"
            inputClassName="text-xs"
            variant="ghost"
            value={lpRate && calc(lpRate).times(100).toFixed()}
            decimal={2}
            locale={locale}
            suffix="%"
            placeholder={t`Enter`}
            suffixClassName="pl-2 text-t-1100"
            onValueChange={(v) =>
              setState({ lpRate: v && calc(v).div(100).toFixed() })
            }
          />
        </div>
      </div>

      {checked && (
        <CheckIcon
          size={16}
          className="text-accent-foreground bg-accent absolute top-2 right-2 rounded-full"
        />
      )}
    </div>
  );
};

export default CustomizeFeeTier;
