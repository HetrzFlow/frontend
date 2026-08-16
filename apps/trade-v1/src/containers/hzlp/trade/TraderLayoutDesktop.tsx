import { FC, useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { TradeTabs } from '@/common';
import { HzlpTraderType } from '@/constants/hzlp/enum';
import { useTradeStore } from '@/stores/hzlp/trade';
import Form from './Form';

const TraderLayoutDesktop: FC = () => {
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
    <div className="w-[388px]">
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
    </div>
  );
};

TraderLayoutDesktop.displayName = 'TraderLayoutDesktop';

export default TraderLayoutDesktop;
