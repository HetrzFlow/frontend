import { useEffect, useMemo, useRef } from 'react';

import { useLingui } from '@lingui/react/macro';
import { UseFormReturn } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { TrendingDownIcon, TrendingUpIcon, Separator } from '@repo/ui';
import { TradeTabs, useInstStore } from '@/common';

import { MARKET_PX } from '@/constants/common';
import { POS_SIDE, TRADE_TYPE } from '@/constants/enum';
import { useGlobalStore } from '@/stores/trade/global';
import HelpfulInfo from '../helpfulInfo';
import { PositionForm, useTradeStore } from '../store';

import OpenPosition from './openPosition';

const TradeBox: React.FC = () => {
  const { t } = useLingui();
  const instId = useGlobalStore((state) => state.instId);
  const [inst, coins] = useInstStore(
    useShallow((state) => [state.getInst(state, instId), state.getCoins()]),
  );
  const usdcCoin = Object.values(coins).find((v) => v.symbol === 'USDC');
  const [tradeType, setTradeType, setFormRef, updateFormData] = useTradeStore(
    useShallow((state) => [
      state.tradeType,
      state.setTradeType,
      state.setFormRef,
      state.updateFormData,
    ]),
  );

  const longRef = useRef<UseFormReturn<PositionForm>>(null);
  const shortRef = useRef<UseFormReturn<PositionForm>>(null);

  // record formRef
  useEffect(() => {
    setFormRef({
      [TRADE_TYPE.long]: longRef,
      [TRADE_TYPE.short]: shortRef,
    });
    return () => {
      // clear formRef
      setFormRef({
        [TRADE_TYPE.long]: null,
        [TRADE_TYPE.short]: null,
      });
    };
  }, [setFormRef]);

  // switch inst
  useEffect(() => {
    longRef.current?.setValue('paySz', {
      value: longRef.current?.getValues().paySz?.value || '',
      coin: longRef.current?.getValues().paySz?.coin || inst?.baseCoin || '',
    });

    longRef.current?.setValue('px', MARKET_PX);

    shortRef.current?.setValue('paySz', {
      value: shortRef.current?.getValues().paySz?.value || '',
      coin:
        shortRef.current?.getValues().paySz?.coin ||
        usdcCoin?.coinType ||
        inst?.baseCoin ||
        '',
    });

    shortRef.current?.setValue('px', MARKET_PX);
  }, [inst?.baseCoin, usdcCoin]);

  const options = useMemo(() => {
    return [
      {
        value: TRADE_TYPE.long,
        label: (
          <>
            <TrendingUpIcon />
            {t`Long`}
          </>
        ),
        activeBarClassName: 'bg-up',
        content: (
          <>
            <OpenPosition
              ref={longRef}
              onChange={(values) => updateFormData(TRADE_TYPE.long, values)}
              posSide={POS_SIDE.long}
            />
            <Separator className="mt-4 data-[orientation=horizontal]:h-0" />
            <HelpfulInfo />
          </>
        ),
      },
      {
        value: TRADE_TYPE.short,
        label: (
          <>
            <TrendingDownIcon />
            {t`Short`}
          </>
        ),
        activeBarClassName: 'bg-down',
        content: (
          <>
            <OpenPosition
              ref={shortRef}
              onChange={(values) => updateFormData(TRADE_TYPE.short, values)}
              posSide={POS_SIDE.short}
            />
            <Separator className="mt-4 data-[orientation=horizontal]:h-0" />
            <HelpfulInfo />
          </>
        ),
      },
    ];
  }, [t, updateFormData]);

  return (
    <TradeTabs
      listClassName="grid-cols-2"
      contentWrapClassName="pb-10"
      value={tradeType}
      onValueChange={setTradeType as (value: string) => void}
      options={options}
    />
  );
};

export default TradeBox;
