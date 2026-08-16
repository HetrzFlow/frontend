'use client';

import { Trans } from '@lingui/react/macro';
import ReferralLearnMore from './ReferralLearnMore';

const ReferralLoadingShell = () => (
  <div className="relative z-10 flex h-[492px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 max-md:h-[420px]">
    <div
      aria-hidden
      className="size-20 bg-[url('/trade-static/referral/loadingLogo-ezgif.com-optimize.gif')] bg-contain bg-center bg-no-repeat"
    />
  </div>
);

export const ReferralLoadingContent = () => (
  <section className="relative min-h-[900px] pb-[90px] max-md:min-h-[1627px]">
    <div className="relative z-10">
      <div className="mb-5 w-full max-w-[397px] max-md:max-w-none">
        <h3 className="text-[32px]/tight font-medium tracking-[-1.28px] max-md:text-2xl max-md:tracking-[-0.96px]">
          <Trans>Referral</Trans>
        </h3>
        <p className="mt-[7px] text-sm/normal tracking-[-0.56px] text-white/70">
          <Trans>Refer frens and save on fees. A slice of commission for each.</Trans>
        </p>
        <div className="mt-[7px]">
          <ReferralLearnMore />
        </div>
      </div>
      <ReferralLoadingShell />
    </div>
  </section>
);

const ReferralContentLoadingShell = () => (
  <>
    <ReferralLoadingContent />
  </>
);

export const ReferralClientLoadingShell = () => {
  return <ReferralContentLoadingShell />;
};

export default ReferralLoadingShell;
