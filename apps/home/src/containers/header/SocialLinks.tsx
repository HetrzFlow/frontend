import { FC } from 'react';
import Image from 'next/image';
import {
  hzTwitterLink,
  hzDiscordLink,
  hzMediumLink,
  hzTgLink,
  productDoc,
} from '@repo/common/constants';
import { TwitterIcon, DiscordIcon, TelegramIcon, DocIcon } from '@repo/ui';

interface SocialLinksProps {
  isVisible?: boolean;
}

const SocialLinks: FC<SocialLinksProps> = ({ isVisible = true }) => {
  return (
    <div
      className={`ml-auto flex items-center gap-2 font-medium transition-all max-md:hidden ${isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <a
        href={hzTwitterLink}
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        <div className="bg-t-1100/10 hover:text-t-270 flex size-8 items-center gap-2 rounded-full px-2 py-1 hover:transition-[color]">
          <TwitterIcon size={16} />
        </div>
      </a>
      <a
        href={hzDiscordLink}
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        <div className="hover:text-t-270 bg-t-1100/10 flex size-8 items-center gap-2 rounded-full px-2 py-1 hover:transition-[color]">
          <DiscordIcon size={16} />
        </div>
      </a>
      <a href={hzTgLink} target="_blank" rel="noopener noreferrer nofollow">
        <div className="hover:text-t-270 bg-t-1100/10 flex size-8 items-center gap-2 rounded-full px-2 py-1 hover:transition-[color]">
          <TelegramIcon size={16} />
        </div>
      </a>
      <a href={hzMediumLink} target="_blank" rel="noopener noreferrer nofollow">
        <div className="hover:text-t-270 bg-t-1100/10 flex size-8 items-center gap-2 overflow-hidden rounded-full hover:transition-[color]">
          <Image
            height={32}
            width={32}
            alt="medium"
            className="hover:opacity-70"
            src="/home-static/icons/medium.png"
          />
        </div>
      </a>

      <a
        href={productDoc || 'https://'}
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        <div className="hover:text-t-270 bg-t-1100/10 flex size-8 items-center gap-2 rounded-full px-2 py-1 hover:transition-[color]">
          <DocIcon size={16} />
        </div>
      </a>
    </div>
  );
};

export default SocialLinks;
