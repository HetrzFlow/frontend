'use client';

import { useLingui } from '@lingui/react/macro';
import { TwitterIcon, DiscordIcon, TelegramIcon, DocIcon } from '@repo/ui';
import {
  hzTwitterLink,
  hzDiscordLink,
  hzMediumLink,
  hzTgLink,
} from '../../constants/links';

const Feedback = () => {
  const { t } = useLingui();

  return (
    <div className="flex items-center gap-4 font-medium">
      <a
        href={hzTwitterLink}
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        <div className="hover:text-t-270 flex items-center gap-2 hover:transition-[color]">
          <TwitterIcon size={16} />
          {t`Footer.Twitter`}
        </div>
      </a>
      <a
        href={hzDiscordLink}
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        <div className="hover:text-t-270 flex items-center gap-2 hover:transition-[color]">
          <DiscordIcon size={16} />
          {t`Footer.Discord`}
        </div>
      </a>
      <a href={hzTgLink} target="_blank" rel="noopener noreferrer nofollow">
        <div className="hover:text-t-270 flex items-center gap-2 hover:transition-[color]">
          <TelegramIcon size={16} />
          {t`Footer.Telegram`}
        </div>
      </a>
      <a href={hzMediumLink} target="_blank" rel="noopener noreferrer nofollow">
        <div className="hover:text-t-270 flex items-center gap-2 hover:transition-[color]">
          <DocIcon size={16} />
          {t`Footer.Docs`}
        </div>
      </a>
    </div>
  );
};

export default Feedback;
