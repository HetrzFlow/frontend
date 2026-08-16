'use client';

import { ReactNode } from 'react';

import { useLingui } from '@lingui/react/macro';
import { ArrowUpRightIcon, cn } from '@repo/ui';

type Props = {
  href?: string;
  children?: ReactNode;
  className?: string;
};

export default function HashTooltipLink({ href, children, className }: Props) {
  const { t } = useLingui();

  if (!href) return null;

  const trigger = children || <ArrowUpRightIcon size={16} />;
  const triggerClassName = cn(
    'inline-flex shrink-0',
    !children && 'text-t-350 hover:text-t-1100',
    className,
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={triggerClassName}
      aria-label={t`Open transaction`}
    >
      {trigger}
    </a>
  );
}
