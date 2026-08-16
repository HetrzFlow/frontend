import Image from 'next/image';
import { t } from '@lingui/core/macro';
import { CoinIcon } from '@repo/common/components';
import { TrophyIcon } from '@repo/ui';
import { IMAGES_MAP } from '@/common';
import { listData, meData } from './data';

const Content = () => {
  return (
    <div className="flex flex-col pb-6 text-xs">
      <div className="text-t-1100 mb-2.5 flex items-center gap-1 text-sm font-medium">
        <TrophyIcon size={16} />
        {t`Rankings`}
      </div>
      <div className="flex flex-col gap-1.5">
        {listData.map((v, i) => {
          return (
            <div
              key={v[0]}
              className="hover:bg-bg-3 flex h-6 cursor-pointer items-center gap-2 rounded-lg pr-1 transition-[background]"
            >
              <span className="w-6 text-center">
                {i < 3 ? (
                  <Image
                    src={IMAGES_MAP.rankings[i]!}
                    alt={`rank ${i + 1}`}
                    width={24}
                    height={24}
                  />
                ) : (
                  v[0]
                )}
              </span>
              <CoinIcon
                size={16}
                src={
                  IMAGES_MAP.avatars[
                    Math.floor(Math.random() * IMAGES_MAP.avatars.length)
                  ]
                }
              />
              <span>{v[1]}</span>
              <span className="ml-auto">{v[2]}</span>
            </div>
          );
        })}
      </div>
      <div className="bg-t-1100/1 absolute right-0 bottom-0 left-0 flex h-8 items-center gap-2 rounded-b-xl px-3 pr-4">
        <span className="text-accent text-center">{meData[0]}</span>
        <CoinIcon
          size={16}
          src={
            IMAGES_MAP.avatars[
              Math.floor(Math.random() * IMAGES_MAP.avatars.length)
            ]
          }
        />
        <span className="text-accent">{t`Me`}</span>
        <span className="ml-auto">{meData[2]}</span>
      </div>
    </div>
  );
};

export default Content;
