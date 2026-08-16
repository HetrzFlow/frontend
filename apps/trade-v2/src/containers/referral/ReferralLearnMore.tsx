'use client';

import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';

const REFERRAL_DOCS_URL =
  'https://hertzflow.gitbook.io/hertzflow-docs/growth/referral';

const ReferralLearnMore: FC = () => {
  const { t } = useLingui();

  return (
    <a
      href={REFERRAL_DOCS_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={t`Learn more about the HertzFlow referral program`}
      className="text-up hover:text-up/70 text-left text-sm font-medium tracking-[-0.56px] transition-[color]"
    >
      {t`Learn more`}
      <span className="sr-only">{t` about the HertzFlow referral program`}</span>
    </a>
  );
};

export default ReferralLearnMore;
