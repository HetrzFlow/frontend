import { FC, memo } from 'react';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { SkeletonLayout } from '@repo/ui';
import { IMAGES_MAP } from '@/common';

interface TraderDesktopProps {
  isConnect: boolean;
  holdingValue: string;
  holdingValueUSD: string;
  isLoading: boolean;
  children: React.ReactNode;
}

const TraderDesktop: FC<TraderDesktopProps> = ({
  isConnect,
  holdingValue,
  holdingValueUSD,
  isLoading,
  children,
}) => {
  const { t } = useLingui();

  return (
    <>
      {isConnect && (
        <div className="mb-[35px] grid grid-cols-1 gap-4">
          <h3 className="text-[20px] leading-[1.2] font-medium">
            {t`Your HzLP`}
          </h3>
          <div className="font-plex grid grid-cols-1 gap-1">
            <p className="text-t-270 text-sm">{t`Holding`}</p>
            <div className="grid grid-cols-[auto_1fr] items-center gap-1">
              <Image
                src={IMAGES_MAP.coinIcons.HzLP}
                className="rounded-full"
                alt="HzLP icon"
                width={20}
                height={20}
              />
              <SkeletonLayout isLoading={isLoading} className="h-7 w-full">
                <div className="font-plex text-t-1100 text-2xl font-medium">
                  {holdingValue}
                </div>
              </SkeletonLayout>
            </div>
            <div className="flex items-center gap-1">
              <SkeletonLayout isLoading={isLoading} className="h-6 w-32">
                <div className="text-t-270">{holdingValueUSD}</div>
              </SkeletonLayout>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

export default memo(TraderDesktop);
