'use client';

import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLingui } from '@lingui/react/macro';
import {
  hzDiscordLink,
  hzEmailLink,
  hzMediumLink,
  hzTgLink,
  hzTwitterLink,
  policyDoc,
  productDoc,
  termsDoc,
} from '@repo/common/constants';
import { useNavItems } from '@repo/common/hooks';
import {
  DiscordIcon,
  DocIcon,
  EnvelopeFillIcon,
  Separator,
  TelegramIcon,
  TwitterIcon,
  toast,
} from '@repo/ui';

const InfoBar: FC = () => {
  const { t } = useLingui();
  const { mediaKit } = useNavItems();
  const emailAddress = hzEmailLink.replace(/^mailto:/, '');

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(emailAddress);
    toast.success('Copied to clipboard!', { id: 'footer-email-copy' });
  };

  return (
    <div className="flex justify-between gap-3 pt-10 max-md:flex-col max-md:items-center">
      <div className="text-t-270 flex items-center gap-4 text-sm">
        <span className="max-md:hidden">{t`@2026 HertzFlow`}</span>
        <Separator orientation="vertical" className="h-4! max-md:hidden" />
        <a
          href={termsDoc || 'https://'}
          rel="noreferrer noopener"
          target="_blank"
          className="hover:text-t-1100"
        >{t`Terms of Services`}</a>
        <Separator orientation="vertical" className="h-4!" />
        <a
          href={policyDoc || 'https://'}
          rel="noreferrer noopener"
          target="_blank"
          className="hover:text-t-1100"
        >{t`Privacy Policy`}</a>
        <Separator orientation="vertical" className="h-4!" />
        <Link
          href={mediaKit.link}
          className="hover:text-t-1100"
        >{t`Media Kit`}</Link>
      </div>
      <div className="flex gap-2">
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
        <a
          href={hzMediumLink}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
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

        <button
          type="button"
          aria-label={t`Copy email address`}
          onClick={handleCopyEmail}
        >
          <span className="sr-only">{emailAddress}</span>
          <div className="hover:text-t-270 bg-t-1100/10 flex size-8 items-center gap-2 rounded-full px-2 py-1 hover:transition-[color]">
            <EnvelopeFillIcon size={16} />
          </div>
        </button>
      </div>
      <span className="text-t-270 hidden text-sm max-md:block">{t`@2026 HertzFlow`}</span>
    </div>
  );
};

export default InfoBar;
