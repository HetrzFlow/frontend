'use client';

import { useLingui } from '@lingui/react/macro';
import {
  productDoc,
  hzTwitterLink,
  hzDiscordLink,
  hzTgLink,
} from '@repo/common/constants';
import { TwitterIcon, DiscordIcon, TelegramIcon, DocIcon } from '@repo/ui';

const SocialLinks = () => {
  const { t } = useLingui();

  return (
    <div className="ml-auto flex items-center gap-2 font-medium">
      <a
        href={hzTwitterLink}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={t`Footer.Twitter`}
      >
        <div
          aria-hidden="true"
          className="hover:text-t-270 flex items-center gap-2 px-2 py-1 hover:transition-[color]"
        >
          <TwitterIcon size={16} />
          {t`Footer.Twitter`}
        </div>
      </a>
      <a
        href={hzDiscordLink}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={t`Footer.Discord`}
      >
        <div
          aria-hidden="true"
          className="hover:text-t-270 flex items-center gap-2 px-2 py-1 hover:transition-[color]"
        >
          <DiscordIcon size={16} />
          {t`Footer.Discord`}
        </div>
      </a>
      <a
        href={hzTgLink}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={t`Footer.Telegram`}
      >
        <div
          aria-hidden="true"
          className="hover:text-t-270 flex items-center gap-2 px-2 py-1 hover:transition-[color]"
        >
          <TelegramIcon size={16} />
          {t`Footer.Telegram`}
        </div>
      </a>
      <a
        href={productDoc || 'https://'}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={t`Footer.Docs`}
      >
        <div
          aria-hidden="true"
          className="hover:text-t-270 flex items-center gap-2 px-2 py-1 hover:transition-[color]"
        >
          <DocIcon size={16} />
          {t`Footer.Docs`}
        </div>
      </a>
    </div>
  );
};

export default SocialLinks;
