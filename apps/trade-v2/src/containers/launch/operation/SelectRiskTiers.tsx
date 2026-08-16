import { FC, useState } from 'react';
import { t } from '@lingui/core/macro';
import { percentFormat, truncateFormat, unitFormat } from '@repo/lib/format';
import { Button, CheckIcon, cn, PencilLineIcon } from '@repo/ui';
import { useGlobalStore } from '@/common/stores';
import { useRiskTiers } from '../hooks';
import { useLaunchStore } from '../store';
import CustomizeRiskTier from './CustomizeRiskTier';

interface SelectRiskTiersProps {
  className?: string;
}

const SelectRiskTiers: FC<SelectRiskTiersProps> = () => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const setState = useLaunchStore((state) => state.setState);
  const [openCustomize, setOpenCustomize] = useState<boolean>(false);

  const riskTier = useLaunchStore((state) => state.riskTier);
  const riskTiers = useRiskTiers();

  return (
    <div className="mt-3 text-xs">
      <h2 className="flex items-center justify-between font-medium">
        {t`Select Risk Tiers`}
        <Button
          className="h-[26px] gap-1 rounded-lg px-4 text-xs"
          onClick={() => {
            const { initialTvl, impactFactor, mmr, maxLeverage } =
              riskTiers[0]!;
            if (openCustomize) {
              setOpenCustomize(false);
              if (riskTier === 'customize') {
                setState({
                  riskTier: 'low_risk',
                });
              }
            } else {
              setOpenCustomize(true);
              setState({
                riskTier: 'customize',
                initialTvl,
                impactFactor,
                mmr,
                maxLeverage,
              });
            }
          }}
        >
          <PencilLineIcon size={16} />
          {t`Customize`}
        </Button>
      </h2>
      <div className="mt-2 flex gap-2">
        {riskTiers.map((tier) => {
          return (
            <div
              key={tier.id}
              className={cn(
                'bg-bg-3 relative w-1/3 cursor-pointer justify-between rounded-lg border p-2',
                riskTier === tier.id ? 'border-accent' : 'border-transparent',
              )}
              onClick={() => {
                setState({
                  riskTier: tier.id,
                });
              }}
            >
              <div className="font-medium">{tier.name}</div>
              <div className="mt-2 grid grid-cols-[auto_1fr] gap-1">
                <div className="flex flex-col gap-1">
                  <span className="text-t-270 text-xs">{t`Initial TVL`}</span>
                  <span className="font-medium">
                    {unitFormat(tier.initialTvl, usdAmountDisplayDecimal, {
                      style: 'currency',
                      currency: 'USD',
                      stripTrailingZeros: true,
                      minNumber: 10000,
                    })}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-t-270 origin-right text-right text-xs">{t`Impact Factor`}</span>
                  <span className="font-medium">
                    {percentFormat(tier.impactFactor, 2, {
                      stripTrailingZeros: true,
                    })}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-t-270 text-xs">{t`MMR`}</span>
                  <span className="font-medium">
                    {percentFormat(tier.mmr, 2, {
                      stripTrailingZeros: true,
                    })}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-t-270 origin-right text-right text-xs">{t`Max Leverage`}</span>
                  <span className="font-medium">
                    {truncateFormat(tier.maxLeverage, leverDecimal, {
                      stripTrailingZeros: true,
                    })}
                  </span>
                </div>
              </div>
              {riskTier === tier.id && (
                <CheckIcon
                  size={16}
                  className="text-accent-foreground bg-accent absolute top-2 right-2 rounded-full"
                />
              )}
            </div>
          );
        })}
      </div>
      <div
        className={cn(
          'overflow-hidden transition-[height]',
          riskTier === 'customize' || openCustomize ? 'h-[101px]' : 'h-0',
        )}
      >
        <CustomizeRiskTier
          className={'mt-2'}
          checked={riskTier === 'customize'}
          onChecked={() => setState({ riskTier: 'customize' })}
        />
      </div>
    </div>
  );
};

export default SelectRiskTiers;
