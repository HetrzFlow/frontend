import { useLingui } from '@lingui/react/macro';
import {
  cn,
  MEDIA_SIZES,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useMediaQuery,
} from '@repo/ui';

import ModuleCard from '@/components/ModuleCard';
import Status from '@/containers/trade/status';
import {
  MarketTickerBar,
  Market,
  Kline,
  Trading,
  Order,
  Trades,
} from '../modules';

const LayoutLg: React.FC = () => {
  const { t } = useLingui();
  const mediaSize = useMediaQuery();
  const defaultSizes = mediaSize === MEDIA_SIZES['3XL'] ? [85, 15] : [72, 28];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex h-full flex-col gap-1 [&:has(.statusContainer)_.mainTradeWrapper]:h-[calc(100%-73px)]">
      <Status />
      <MarketTickerBar />
      <div className="mainTradeWrapper flex h-auto min-h-0 grow gap-1">
        <ResizablePanelGroup
          direction="vertical"
          autoSaveId={`trade.layout.${mediaSize}_v0`}
          className="sticky top-0"
        >
          <ModuleCard className="mb-1 py-1">
            <h2 className="sr-only">{t`Market Selection`}</h2>
            <Market />
          </ModuleCard>
          <ResizablePanel
            className="flex h-full gap-1"
            defaultSize={defaultSizes[0]}
            minSize={50}
            collapsible={false}
          >
            <ModuleCard className="h-full w-2/3 grow max-md:rounded-none">
              <h2 className="sr-only">{t`Price Chart`}</h2>
              <Kline />
            </ModuleCard>
            <ModuleCard className="w-1/3 max-w-55 max-md:hidden">
              <Trades />
            </ModuleCard>
          </ResizablePanel>
          <ResizableHandle className="mx-auto my-px h-1.5" withHandle />
          <ResizablePanel
            collapsible={false}
            minSize={0}
            className="max-md:min-h-1/2 md:min-h-11.5"
            defaultSize={defaultSizes[1]}
          >
            <ModuleCard className="h-full">
              <Order />
            </ModuleCard>
          </ResizablePanel>
        </ResizablePanelGroup>
        <ModuleCard
          className={cn(
            'tradingContainer w-[340px] shrink-0 grow-0 px-0 max-md:hidden',
          )}
        >
          <h2 className="sr-only">{t`Place Order`}</h2>
          <Trading className="px-2" />
        </ModuleCard>
      </div>
    </div>
  );
};

export default LayoutLg;
