import { FC, useEffect, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  InfoCircleIcon,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { AllocationLegendRow } from './Allocation';
import type { AllocationItem } from './Allocation';

interface TotalAssetsProps {
  displayTotal: string;
  allocationItems: AllocationItem[];
}

const TotalAssets: FC<TotalAssetsProps> = ({
  displayTotal,
  allocationItems,
}) => {
  const { t } = useLingui();

  const [collisionBoundaryEle, setCollisionBoundaryEle] =
    useState<Element | null>(null);
  useEffect(() => {
    setCollisionBoundaryEle(document.querySelector('.accountDrawerContainer'));
  }, []);

  return (
    <div>
      <div className="text-t-350 flex items-center gap-1 text-sm">
        {t`Net Worth`}
        <Tooltip>
          <TooltipTrigger>
            <InfoCircleIcon
              size={14}
              className="text-t-350 hover:text-t-1100"
            />
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="w-80"
            collisionBoundary={collisionBoundaryEle}
            collisionPadding={16}
            inDialog
          >
            <div className="flex flex-col gap-1">
              <p className="text-t-1100">
                {t`Net Worth = USDT Balance + Pools + Vaults + Net Value + Order Collateral`}
              </p>
              <p>{t`Your total equity value across HertzFlow.`}</p>
              <Separator className="my-1" />
              <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-xs">
                {allocationItems.map((item) => (
                  <AllocationLegendRow key={item.color} {...item} />
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="font-plex mt-2 text-[calc(var(--spacing)*8)]/tight font-medium">
        {displayTotal}
      </div>
    </div>
  );
};

export default TotalAssets;
