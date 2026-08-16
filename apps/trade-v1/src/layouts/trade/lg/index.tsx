import { memo } from 'react';
import {
  cn,
  GradientBorder,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@repo/ui';

import { Market, Kline, Trading, Order } from '../modules';

const LayoutLg: React.FC = () => {
  return (
    <div className="flex h-full overflow-hidden px-4">
      <ResizablePanelGroup
        direction="vertical"
        autoSaveId={'trade.layout.lg'}
        className="sticky top-0"
      >
        <ResizablePanel
          className="h-full"
          defaultSize={67}
          minSize={50}
          collapsible={false}
        >
          <Market />
          <div className="mt-4" />
          <GradientBorder
            outerClassName="h-[calc(100%-40px)]"
            innerClassName="p-4"
          >
            <Kline />
          </GradientBorder>
        </ResizablePanel>
        <ResizableHandle className="mx-auto my-4.5 h-9 !w-8" withHandle />
        <ResizablePanel collapsible>
          <GradientBorder outerClassName="h-full" innerClassName="p-4 pb-0">
            <Order />
          </GradientBorder>
        </ResizablePanel>
      </ResizablePanelGroup>
      <div className={cn('w-[388px] shrink-0 grow-0')}>
        <Trading className="pl-4" />
      </div>
    </div>
  );
};

export default memo(LayoutLg);
