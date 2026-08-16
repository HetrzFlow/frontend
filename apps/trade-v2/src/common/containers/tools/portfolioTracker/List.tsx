import { FC } from 'react';
import { t } from '@lingui/core/macro';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { percentFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { IMAGES_MAP } from '@/common/assets';
import { listData } from './data';

interface ListProps {
  category: string;
}

const List: FC<ListProps> = ({ category }) => {
  const list = listData[category as keyof typeof listData];
  return (
    <div>
      <div className="text-t-430 flex justify-between border-b pb-2 text-xs md:px-2">
        <span className="w-2/7 shrink-0 grow-0">{t`Asset`}</span>
        <span className="w-2/7 shrink-0 grow-0">{t`Price`}</span>
        <span className="w-3/14 shrink-0 grow-0">{t`24h CHG`}</span>
        <span className="w-3/14 shrink-0 grow-0 text-right">{t`Holdings`}</span>
      </div>
      <div className="min-h-55">
        {list.map((v) => {
          return (
            <div
              key={v[0]}
              className="hover:bg-bg-3 mt-1 flex cursor-pointer rounded-lg py-1 transition-[background] md:px-2"
            >
              <span className="flex w-2/7 shrink-0 grow-0 items-center gap-1">
                <CoinIcon
                  size={16}
                  src={
                    IMAGES_MAP.coinIcons[
                      v[0]! as keyof typeof IMAGES_MAP.coinIcons
                    ]
                  }
                />
                {v[0]}
              </span>
              <span className="font-plex w-2/7 shrink-0 grow-0">{v[1]}</span>
              <span
                className={cn(
                  'font-plex w-3/14 shrink-0 grow-0',
                  calc(v[2]!).gte(0) ? 'text-up' : 'text-down',
                )}
              >
                {percentFormat(v[2]!, 2, {
                  stripTrailingZeros: true,
                  signDisplay: 'always',
                })}
              </span>
              <span className="font-plex w-3/14 shrink-0 grow-0 text-right">
                {v[3]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default List;
