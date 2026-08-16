import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  TrendingDownIcon,
  TrendingUpIcon,
} from '@repo/ui';

import { TRADE_TYPE } from '@/constants/enum';
import { useTradeStore } from '../store';
import TradeBox from '../tradeBox';

const TradeSm = () => {
  const { t } = useLingui();

  const [smDialogOpen, setTradeType, setStore] = useTradeStore(
    useShallow((state) => [
      state.smDialogOpen,
      state.setTradeType,
      state.setStore,
    ]),
  );

  return (
    <Dialog
      open={smDialogOpen}
      onOpenChange={(open) => setStore({ smDialogOpen: open })}
    >
      <div className="pointer-events-none fixed -bottom-[20px] z-1 h-[148px] w-screen bg-gradient-to-b from-transparent to-white md:hidden dark:to-black"></div>
      <div className="fixed bottom-[86px] z-40 flex w-screen gap-2 px-4">
        <DialogTrigger
          className="bg-up text-accent-foreground flex h-[42px] w-1/2 items-center justify-center gap-1 rounded-full text-sm font-medium"
          onClick={() => setTradeType(TRADE_TYPE.long)}
        >
          <TrendingUpIcon />
          {t`Long`}
        </DialogTrigger>

        <DialogTrigger
          className="bg-down text-accent-foreground flex h-[42px] w-1/2 items-center justify-center gap-1 rounded-full text-sm font-medium"
          onClick={() => setTradeType(TRADE_TYPE.short)}
        >
          <TrendingDownIcon />
          {t`Short`}
        </DialogTrigger>
      </div>
      <DialogContent
        closeClassName="hidden"
        className="scrollbar-none max-h-[90dvh] overflow-y-auto"
      >
        <DialogTitle className="hidden">Trade</DialogTitle>
        <TradeBox />
      </DialogContent>
    </Dialog>
  );
};

export default TradeSm;
