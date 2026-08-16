import { FC, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { TradeTabs } from '@/common';
import { HzlpTraderType } from '@/constants/hzlp/enum';
import { useTradeStore } from '@/stores/hzlp/trade';

const Form = dynamic(() => import('./Form'));

const TraderLayoutMobile: FC = () => {
  const { t } = useLingui();
  const [tradeType, setTradeType] = useTradeStore(
    useShallow((state) => [state.tradeType, state.setTradeType]),
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setTradeType(value as HzlpTraderType);
    },
    [setTradeType],
  );

  return (
    <>
      <TradeTabs
        value={tradeType}
        onValueChange={handleTabChange}
        listClassName="grid-cols-2"
        options={[
          {
            value: HzlpTraderType.Buy,
            label: t`Buy HzLP`,
            activeBarClassName: 'bg-up',
            content: <Form isBuy />,
          },
          {
            value: HzlpTraderType.Sell,
            label: t`Sell HzLP`,
            activeBarClassName: 'bg-down',
            content: <Form isBuy={false} />,
          },
        ]}
      />
      <div className="pointer-events-none fixed -bottom-[20px] z-1 h-[148px] w-screen bg-gradient-to-b from-transparent to-white md:hidden dark:to-black"></div>
    </>
  );
};

TraderLayoutMobile.displayName = 'TraderLayoutMobile';

export default TraderLayoutMobile;
