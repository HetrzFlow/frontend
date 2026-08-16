import { FC } from 'react';
import { CoinIcon } from '@repo/common/components';
import { dateFormat } from '@repo/lib/format';

interface ItemProps {
  icon: string;
  time: number;
  message: string;
  link: string;
}

const Item: FC<ItemProps> = ({ icon, message, link, time }) => {
  return (
    <a
      rel="noopener noreferrer"
      href={link}
      target="_blank"
      className="hover:bg-bg-3 mb-1 flex items-center justify-start gap-3 rounded-xl p-1 text-sm transition-[background] last:mb-0"
    >
      <CoinIcon size={60} src={icon} className="shrink-0 rounded-lg" />

      <div className="flex flex-col gap-1">
        <span className="line-clamp-2">{message}</span>
        <span className="text-t-350 text-xs">
          {dateFormat(time * 1000, 'HH:mm:ss')}
        </span>
      </div>
    </a>
  );
};

export default Item;
