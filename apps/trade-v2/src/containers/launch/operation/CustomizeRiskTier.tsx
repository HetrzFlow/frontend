import { FC } from 'react';
import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { CheckIcon, cn, NumberInput } from '@repo/ui';
import { useGlobalStore } from '@/common/stores';
import { useLaunchStore } from '../store';

interface CustomizeRiskTierProps {
  className?: string;
  checked: boolean;
  onChecked: (checked: boolean) => void;
}

const CustomizeRiskTier: FC<CustomizeRiskTierProps> = ({
  className,
  checked,
  onChecked,
}) => {
  const {
    i18n: { locale },
  } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const [initialTvl, impactFactor, mmr, maxLeverage] = useLaunchStore(
    useShallow((state) => [
      state.initialTvl,
      state.impactFactor,
      state.mmr,
      state.maxLeverage,
    ]),
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
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Initial TVL`}</span>
          <NumberInput
            className="rounded-lg px-3 py-1 font-medium"
            inputClassName="text-xs text-right"
            variant="ghost"
            value={initialTvl}
            decimal={usdAmountDisplayDecimal}
            locale={locale}
            suffix="$"
            placeholder={t`Enter`}
            suffixClassName="text-t-1100 pl-2"
            onValueChange={(v) => setState({ initialTvl: v })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Impact Factor`}</span>
          <NumberInput
            className="rounded-lg px-3 py-1 font-medium"
            inputClassName="text-xs text-right"
            variant="ghost"
            value={impactFactor && calc(impactFactor).times(100).toFixed()}
            decimal={2}
            locale={locale}
            suffix="%"
            placeholder={t`Enter`}
            suffixClassName="text-t-1100 pl-2"
            onValueChange={(v) =>
              setState({ impactFactor: v && calc(v).div(100).toFixed() })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`MMR`}</span>
          <NumberInput
            className="rounded-lg px-3 py-1 font-medium"
            inputClassName="text-xs text-right"
            variant="ghost"
            value={mmr && calc(mmr).times(100).toFixed()}
            decimal={2}
            locale={locale}
            suffix="%"
            placeholder={t`Enter`}
            suffixClassName="text-t-1100 pl-2"
            onValueChange={(v) =>
              setState({ mmr: v && calc(v).div(100).toFixed() })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-t-270 text-xs">{t`Max Leverage`}</span>
          <NumberInput
            className="rounded-lg px-3 py-1 font-medium"
            inputClassName="text-xs  text-right"
            variant="ghost"
            value={maxLeverage}
            decimal={leverDecimal}
            locale={locale}
            suffix="x"
            placeholder={t`Enter`}
            suffixClassName="text-t-1100 pl-2"
            onValueChange={(v) => setState({ maxLeverage: v })}
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

export default CustomizeRiskTier;
