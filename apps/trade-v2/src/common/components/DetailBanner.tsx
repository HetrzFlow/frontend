'use client';

import { ReactNode, memo, useState } from 'react';
import {
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { useHydrated } from '@/common/hooks/useHydrated';
import ModuleCard from '@/components/ModuleCard';
import HorizontalScrollBox from './HorizontalScrollBox/HorizontalScrollBox';

type DetailBannerItem = {
  title: ReactNode;
  value: ReactNode;
  isLoading: boolean;
  content: ReactNode;
};

type DetailBannerProps = {
  items: DetailBannerItem[];
  desktopVariant?: 'dialog' | 'tooltip';
  scrollWidth?: string;
  shadowOpacity?: number;
  desktopClassName?: string;
  mobileClassName?: string;
};

const DesktopBannerItem = memo(function DesktopBannerItem({
  title,
  value,
  isLoading,
  content,
  variant,
  collisionBoundary,
}: {
  title: ReactNode;
  value: ReactNode;
  isLoading: boolean;
  content: ReactNode;
  variant: 'dialog' | 'tooltip';
  collisionBoundary?: Element | null;
}) {
  const trigger = (
    <div className="hover:bg-bg-3 cursor-pointer space-y-1 rounded-xl p-2 transition-colors">
      <div className="text-t-270 text-xs">{title}</div>
      {isLoading ? (
        <Skeleton className="h-6 w-24" />
      ) : (
        <div className="font-medium">{value}</div>
      )}
    </div>
  );

  if (variant === 'tooltip') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="flex max-w-90 flex-col gap-2 rounded-2xl p-3 text-xs"
          collisionBoundary={
            collisionBoundary ? [collisionBoundary] : undefined
          }
          collisionPadding={{ top: -500, bottom: -500 }}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent position="bottom" className="max-w-90 p-3">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>
        <div className="flex flex-col gap-2 text-xs">{content}</div>
      </DialogContent>
    </Dialog>
  );
});

const DesktopBannerItemStatic = memo(function DesktopBannerItemStatic({
  title,
  value,
  isLoading,
}: {
  title: ReactNode;
  value: ReactNode;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-1 rounded-xl p-2">
      <div className="text-t-270 text-xs">{title}</div>
      {isLoading ? (
        <Skeleton className="h-6 w-24" />
      ) : (
        <div className="text-[20px] font-medium">{value}</div>
      )}
    </div>
  );
});

const MobileBannerItem = memo(function MobileBannerItem({
  title,
  value,
  isLoading,
  content,
}: {
  title: ReactNode;
  value: ReactNode;
  isLoading: boolean;
  content: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer space-y-1 transition-colors">
          <div className="text-t-270 text-xs">{title}</div>
          {isLoading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <div className="font-medium">{value}</div>
          )}
        </div>
      </DialogTrigger>
      <DialogContent position="bottom" className="max-w-90 p-3">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>
        <div className="flex flex-col gap-2 pb-4 text-xs">{content}</div>
      </DialogContent>
    </Dialog>
  );
});

const MobileBannerItemStatic = memo(function MobileBannerItemStatic({
  title,
  value,
  isLoading,
}: {
  title: ReactNode;
  value: ReactNode;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="text-t-270 text-xs">{title}</div>
      {isLoading ? (
        <Skeleton className="h-4 w-20" />
      ) : (
        <div className="font-medium">{value}</div>
      )}
    </div>
  );
});

const DetailBanner = memo(function DetailBanner({
  items,
  desktopVariant = 'dialog',
  scrollWidth = '600px',
  shadowOpacity = 0.4,
  desktopClassName,
  mobileClassName,
}: DetailBannerProps) {
  const isHydrated = useHydrated();
  const [boundaryEl, setBoundaryEl] = useState<HTMLDivElement | null>(null);

  return (
    <>
      <ModuleCard className={cn('hidden p-2 md:block', desktopClassName)}>
        <div ref={setBoundaryEl}>
          <HorizontalScrollBox
            shadowOpacity={shadowOpacity}
            scrollWidth={scrollWidth}
          >
            <div className="grid shrink-0 grid-cols-4 gap-2">
              {items.map((item, index) =>
                isHydrated ? (
                  <DesktopBannerItem
                    key={`${index}-${item.title}`}
                    title={item.title}
                    value={item.value}
                    isLoading={item.isLoading}
                    content={item.content}
                    variant={desktopVariant}
                    collisionBoundary={boundaryEl}
                  />
                ) : (
                  <DesktopBannerItemStatic
                    key={`${index}-${item.title}`}
                    title={item.title}
                    value={item.value}
                    isLoading={item.isLoading}
                  />
                ),
              )}
            </div>
          </HorizontalScrollBox>
        </div>
      </ModuleCard>
      <div
        className={cn(
          'bg-bg-3-h5 my-4 flex flex-wrap gap-2 rounded-2xl p-3 md:hidden',
          mobileClassName,
        )}
      >
        {items.map((item, index) => (
          <div key={`${index}-${item.title}`} className="basis-[calc(50%-4px)]">
            {isHydrated ? (
              <MobileBannerItem
                title={item.title}
                value={item.value}
                isLoading={item.isLoading}
                content={item.content}
              />
            ) : (
              <MobileBannerItemStatic
                title={item.title}
                value={item.value}
                isLoading={item.isLoading}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
});

export { DetailBanner };
export type { DetailBannerItem, DetailBannerProps };
