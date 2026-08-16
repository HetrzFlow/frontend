import { t } from '@lingui/core/macro';
import { useShallow } from 'zustand/react/shallow';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import {
  formatAddress,
  percentFormat,
  truncateFormat,
  unitFormat,
} from '@repo/lib/format';
import { PencilLineIcon, Separator, ServerIcon, WalletIcon } from '@repo/ui';
import { useCurrentAccountAddress } from '@/common/chainClient';
import { useGlobalStore, useInstStore } from '@/common/stores';
import { useInstCategories } from '@/components/InstCategories/hooks';
import ModuleCard from '@/components/ModuleCard';
import { useFeeTiers, useOracles, useRiskTiers } from '../hooks';
import { useLaunchStore } from '../store';

const Detail = () => {
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const accountAddress = useCurrentAccountAddress();
  const setState = useLaunchStore((state) => state.setState);
  const [
    selectedInstId,
    selectedOracle,
    feeTier,
    cusOpenCloseFee,
    cusSwapFee,
    cusLpRate,
    riskTier,
    cusInitialTvl,
    cusImpactFactor,
    cusMmr,
    cusMaxLeverage,
  ] = useLaunchStore(
    useShallow((state) => [
      state.selectedInstId,
      state.selectedOracle,
      state.feeTier,
      state.openCloseFee,
      state.swapFee,
      state.lpRate,
      state.riskTier,
      state.initialTvl,
      state.impactFactor,
      state.mmr,
      state.maxLeverage,
    ]),
  );
  const oracles = useOracles();
  const OracleText = oracles.find((v) => v.id === selectedOracle)?.label || '';
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[selectedInstId];
  const riskTiers = useRiskTiers();
  const { initialTvl, impactFactor, mmr, maxLeverage } =
    riskTier === 'customize'
      ? {
          initialTvl: cusInitialTvl,
          impactFactor: cusImpactFactor,
          mmr: cusMmr,
          maxLeverage: cusMaxLeverage,
        }
      : riskTiers.find((v) => v.id === riskTier)!;
  const feeTiers = useFeeTiers();
  const { openCloseFee, swapFee, lpRate } =
    feeTier === 'customize'
      ? {
          openCloseFee: cusOpenCloseFee,
          swapFee: cusSwapFee,
          lpRate: cusLpRate,
        }
      : feeTiers.find((v) => v.id === feeTier)!;

  const riskTag = calc(initialTvl).lt(100000)
    ? t`Low-Risk`
    : calc(initialTvl).lt(1000000)
      ? t`Mid-Risk`
      : t`High-Risk`;
  const instCategories = useInstCategories({ hideNewListed: true });
  const categoryText =
    instCategories.find((v) => v.value === inst?.category)?.label || '';

  return (
    <ModuleCard className="p-3 text-xs">
      <div className="flex items-center gap-2">
        <CoinIcon size={24} src={inst?.icon} />
        <div className="flex flex-col">
          <span>HzLP:{inst?.name}</span>
        </div>
        <div
          className="text-t-270 hover:text-t-1100 ml-auto cursor-pointer"
          onClick={() => setState({ currentStep: 3 })}
        >
          <PencilLineIcon size={16} />
        </div>
      </div>
      <div className="mt-3 flex gap-6">
        <div className="w-1/2">
          <div className="flex items-center gap-2">
            <ServerIcon size={16} />
            <span className="font-medium">{t`Pool Detail`}</span>
            {categoryText && (
              <span className="bg-bg-3 ml-auto flex h-[26px] origin-right items-center rounded-lg px-4 py-1 text-[10px]">
                {categoryText}
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-t-270">{t`Market`}</span>
              <span className="font-medium">{inst?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-t-270">{t`Oracle`}</span>
              <span className="font-medium">{OracleText}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-t-270">{t`Open/Close Fee`}</span>
              <span className="font-medium">
                {percentFormat(openCloseFee, 2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-t-270">{t`Swap Fee`}</span>
              <span className="font-medium">{percentFormat(swapFee, 2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-t-270">{t`LP Dep/Wd`}</span>
              <span className="font-medium">{percentFormat(lpRate, 2)}</span>
            </div>
          </div>
        </div>
        <Separator orientation="vertical" className="h-auto" />
        <div className="w-1/2">
          <div className="flex items-center gap-2">
            <WalletIcon size={16} />
            <span className="font-medium">{t`Risk Config`}</span>
            <span className="bg-bg-3 ml-auto flex h-[26px] origin-right items-center rounded-lg px-4 py-1 text-[10px]">
              {riskTag}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-t-270">{t`Initial TVL`}</span>
              <span className="font-medium">
                {unitFormat(initialTvl, usdAmountDisplayDecimal, {
                  minNumber: 10000,
                  style: 'currency',
                  currency: 'USD',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-t-270">{t`MMR`}</span>
              <span className="font-medium">
                {' '}
                {percentFormat(mmr, 2, {
                  stripTrailingZeros: true,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-t-270">{t`Max Leverage`}</span>
              <span className="font-medium">
                {truncateFormat(maxLeverage, leverDecimal, {
                  stripTrailingZeros: true,
                })}
                x
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-t-270">{t`Impact Factor`}</span>
              <span className="font-medium">
                {percentFormat(impactFactor, 2, {
                  stripTrailingZeros: true,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-t-270">{t`Pool Owner`}</span>
              <span className="font-medium">
                {formatAddress(accountAddress || '', {
                  prefixLength: 5,
                  suffixLength: 5,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ModuleCard>
  );
};

export default Detail;
