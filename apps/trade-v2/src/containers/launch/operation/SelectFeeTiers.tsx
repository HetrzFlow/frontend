import { FC, useState } from 'react';
import { t } from '@lingui/core/macro';
import { useShallow } from 'zustand/react/shallow';
import { percentFormat } from '@repo/lib/format';
import { Button, CheckIcon, cn, FireIcon, PencilLineIcon } from '@repo/ui';
import { useInstStore } from '@/common/stores';
import { useFeeTiers } from '../hooks';
import { useLaunchStore } from '../store';
import CustomizeFeeTier from './CustomizeFeeTier';

interface SelectFeeTiersProps {
  className?: string;
}

const SelectFeeTiers: FC<SelectFeeTiersProps> = () => {
  const insts = useInstStore((state) => state.getInsts());
  const [selectedInstId, feeTier] = useLaunchStore(
    useShallow((state) => [state.selectedInstId, state.feeTier]),
  );
  const setState = useLaunchStore((state) => state.setState);
  const [openCustomize, setOpenCustomize] = useState<boolean>(false);

  const feeTiers = useFeeTiers();
  const inst = insts[selectedInstId];

  return (
    <div className="mt-3">
      <h2 className="flex items-center justify-between font-medium">
        {t`Select Fee Tiers`}
        <Button
          className="h-[26px] gap-1 rounded-lg px-4 text-xs"
          onClick={() => {
            const { openCloseFee, swapFee, lpRate } = feeTiers[2]!;
            if (openCustomize) {
              setOpenCustomize(false);
              if (feeTier === 'customize') {
                setState({
                  feeTier: 'institutional',
                });
              }
            } else {
              setOpenCustomize(true);
              setState({
                feeTier: 'customize',
                openCloseFee,
                swapFee,
                lpRate,
              });
            }
          }}
        >
          <PencilLineIcon size={16} />
          {t`Customize`}
        </Button>
      </h2>
      <div className="mt-2 flex gap-2">
        {feeTiers.map((tier) => {
          return (
            <div
              key={tier.id}
              className={cn(
                'bg-bg-3 relative w-1/3 cursor-pointer justify-between rounded-lg border p-2',
                feeTier === tier.id ? 'border-accent' : 'border-transparent',
              )}
              onClick={() => {
                setState({
                  feeTier: tier.id,
                });
              }}
            >
              <div className="flex items-center gap-2 font-medium">
                {tier.name}

                {tier.categories.includes(inst?.category || '') && (
                  <span className="text-accent mr-4 flex items-center gap-1 font-normal">
                    <FireIcon size={14} />
                    {tier.tag}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex justify-between gap-1">
                  <span className="text-t-270 text-xs">{t`Open/Close`}</span>
                  <span className="font-medium">
                    {percentFormat(tier.openCloseFee, 2, {
                      stripTrailingZeros: true,
                    })}
                  </span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-t-270 text-xs">{t`Swap`}</span>
                  <span className="font-medium">
                    {percentFormat(tier.swapFee, 2, {
                      stripTrailingZeros: true,
                    })}
                  </span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-t-270 text-xs">{t`LP Deposit/Withdraw`}</span>
                  <span className="font-medium">
                    {percentFormat(tier.lpRate, 2, {
                      stripTrailingZeros: true,
                    })}
                  </span>
                </div>
              </div>
              {feeTier === tier.id && (
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
          feeTier === 'customize' || openCustomize ? 'h-[101px]' : 'h-0',
        )}
      >
        <CustomizeFeeTier
          className={'mt-2'}
          checked={feeTier === 'customize'}
          onChecked={() => setState({ feeTier: 'customize' })}
        />
      </div>
    </div>
  );
};

export default SelectFeeTiers;
