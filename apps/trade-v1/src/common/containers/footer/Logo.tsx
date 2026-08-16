'use client';

import { FC, memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { HzIcon, HzTextIcon } from '@repo/ui';

const Logo: FC = () => {
  const { i18n } = useLingui();

  return (
    <a
      href={`${process.env.NEXT_PUBLIC_HOME_URL || ''}/${i18n.locale || ''}`}
      rel="noopener noreferrer"
      className="hover:text-t-270 flex items-center gap-1 hover:transition-[color]"
      aria-label="HertzFlow home page"
    >
      <HzIcon size={20} />
      <HzTextIcon size={10} />
    </a>
  );
};

export default memo(Logo);
