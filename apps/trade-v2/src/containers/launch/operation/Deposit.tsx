import { useEffect, useState } from 'react';
import { t } from '@lingui/core/macro';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { truncateFormat, unitFormat } from '@repo/lib/format';
import { useMutation } from '@repo/lib/queryClient';
import {
  ArrowClockwiseIcon,
  Button,
  cn,
  LoaderCircleIcon,
  tradeToast,
} from '@repo/ui';
import { usePriceTickerStream } from '@/common';
import { Slippage } from '@/common/components';
import { USDT_USD_PRICE_SYMBOL } from '@/common/constants';
import { useGlobalStore, useInstStore } from '@/common/stores';
import BasicCoinSzInput from '@/components/CoinSzInput';
import ModuleCard from '@/components/ModuleCard';
import { USDT_NAME } from '@/stores/pools/trade';
import { useOracles, useRiskTiers } from '../hooks';
import { useLaunchStore } from '../store';

const Deposit = () => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const insts = useInstStore((state) => state.getInsts());
  const setState = useLaunchStore((state) => state.setState);
  const slippage = useLaunchStore((state) => state.slippage);
  const selectedInstId = useLaunchStore((state) => state.selectedInstId);
  const cusInitialTvl = useLaunchStore((state) => state.initialTvl);
  const riskTier = useLaunchStore((state) => state.riskTier);
  const selectedOracle = useLaunchStore((state) => state.selectedOracle);
  const riskTiers = useRiskTiers();
  const initialTvl =
    riskTier === 'customize'
      ? cusInitialTvl
      : riskTiers.find((v) => v.id === riskTier)!.initialTvl;

  const oracles = useOracles();
  const pxDiff = oracles.find((v) => v.id === selectedOracle)?.pxDiff || 0;
  const usdtPx = usePriceTickerStream(USDT_USD_PRICE_SYMBOL, {
    throttleWait: 2000,
  }).data[0]?.p;
  const px = usdtPx && calc(usdtPx).times(calc(1).plus(pxDiff)).toFixed();

  const [isClick, setIsClick] = useState(false);

  const coins = useInstStore((state) => state.getCoins());
  const inst = insts[selectedInstId];

  useEffect(() => {
    if (isClick) {
      setTimeout(() => {
        setIsClick(false);
      }, 300);
    }
  }, [isClick]);

  const size = px ? calc(initialTvl).times(1.01).div(px).toFixed() : '';
  const dispSize = truncateFormat(size, coins['USDT']?.szDispDecimal);
  const instSymbol = inst?.symbol || '';

  const { mutate, isPending } = useMutation({
    mutationKey: ['launch', 'deposit'],
    mutationFn: async () => {
      await new Promise((resolve) => {
        setTimeout(() => {
          tradeToast({
            type: 'success',
            ordType: 'market',
            title: t`${instSymbol} Market Launched!`,
            // description: t`Completed`,
            content: t`Deposited ${dispSize}USDT initial liquidity`,
            icon: <CoinIcon size={24} src={inst?.icon} />,
          });
          resolve(1);
        }, 1000);
      });
    },
  });

  return (
    <ModuleCard className="mt-2 p-3 text-xs">
      <div className="flex items-center gap-1">
        <span className="font-medium">{t`Deposit Liquidity`}</span>
        <div className="ml-auto">
          <Slippage
            className="h-5 rounded-lg px-2"
            value={slippage}
            onValueChange={(value) => setState({ slippage: value })}
            options={['0.001', '0.005', '0.01']}
            warningSlippage="0.001"
          />
        </div>
        <ArrowClockwiseIcon
          size={18}
          className={cn(
            'text-t-270 hover:text-t-1100 -translate-y-0.4 origin-[9px_10.4px] cursor-pointer transition-[color,rotate] duration-300',
            isClick ? 'rotate-360' : 'transition-none',
          )}
          onClick={() => {
            setIsClick(true);
          }}
        />
      </div>
      <div className="mt-3">
        <BasicCoinSzInput
          disabled
          label={t`Paying`}
          percentActionSource="none"
          value={size}
          px={px}
          showBalance={false}
          coin={USDT_NAME}
          disabledCoinSelector
          onChange={() => {}}
        />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-t-270">{t`Lockup Period`}</span>
          <span className="font-medium">~30 {t`Days`}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-t-270">{t`Initial Pool TVL`}</span>
          <span className="font-medium">
            {unitFormat(initialTvl, usdAmountDisplayDecimal, {
              minNumber: 1000000,
              style: 'currency',
              currency: 'USD',
            })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-t-270">{t`Fees`}</span>
          <span className="font-medium">
            {' '}
            {truncateFormat(
              calc(initialTvl).times(0.01),
              usdAmountDisplayDecimal,
              {
                style: 'currency',
                currency: 'USD',
              },
            )}
          </span>
        </div>
      </div>
      <div className="mt-3 text-right">
        <Button
          className="bg-accent hover:bg-accent/70 text-accent-foreground h-10 w-[210px] rounded-lg px-0 py-2.5 has-[>svg]:px-0"
          onClick={() => {
            mutate();
          }}
        >
          <LoaderCircleIcon
            size={16}
            className={cn(
              'animate-spin transition-[width]',
              isPending ? 'w-4' : 'w-0',
            )}
          />
          <>{t`Deposit and Launch`}</>
        </Button>
      </div>
    </ModuleCard>
  );
};

export default Deposit;
