'use client';

import {
  Fragment,
  useEffect,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import { Trans } from '@lingui/react/macro';
import ConnectBtn from '@/common/components/ConnectBtn';
import ReferralLearnMore from './ReferralLearnMore';

type Step = {
  id: string;
  icon: string;
};

const STEPS: Step[] = [
  { id: 'connect-wallet', icon: '/trade-static/referral/cw1.svg' },
  {
    id: 'enter-code',
    icon: '/trade-static/referral/cw2.svg',
  },
  {
    id: 'create-code',
    icon: '/trade-static/referral/cw3.svg',
  },
];

const DISCONNECTED_VISUALS_DELAY_MS = 300;

const StepConnectorIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    width="6"
    height="22"
    viewBox="0 0 6 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    className={className}
  >
    <path
      d="M5.33317 18.6667C5.33317 17.1939 4.13926 16 2.6665 16C1.19374 16 -0.000162711 17.1939 -0.00016284 18.6667C-0.000162969 20.1394 1.19374 21.3334 2.6665 21.3334C4.13926 21.3334 5.33317 20.1394 5.33317 18.6667ZM5.33317 2.66669C5.33317 1.19393 4.13926 2.11096e-05 2.66651 2.09808e-05C1.19375 2.08521e-05 -0.000161312 1.19393 -0.000161441 2.66669C-0.00016157 4.13945 1.19375 5.33335 2.66651 5.33335C4.13926 5.33335 5.33317 4.13945 5.33317 2.66669ZM2.6665 18.6667L3.1665 18.6667L3.16651 2.66669L2.66651 2.66669L2.16651 2.66669L2.1665 18.6667L2.6665 18.6667Z"
      fill="#00DFEB"
    />
  </svg>
);

const Background: FC<{ showVisuals: boolean }> = ({ showVisuals }) => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
  >
    <div
      className="absolute top-[190px] left-[calc(50%-26px)] h-[702px] w-[122.6vw] -translate-x-1/2 bg-[length:100%_100%] bg-top bg-no-repeat max-md:top-[250px] max-md:left-1/2 max-md:h-[520px] max-md:w-[260vw]"
      style={{
        backgroundImage: showVisuals
          ? "url('/trade-static/referral/seeit.png')"
          : undefined,
      }}
    />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,#000_100%)]" />
  </div>
);

const PageIntro = () => (
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
);

const StepCard: FC<
  Step & { label: ReactNode; loadIcon: boolean; showConnector: boolean }
> = ({
  label,
  icon,
  showConnector,
  loadIcon,
}) => (
  <div className="relative h-[79px] rounded-[24px] border border-white/10 bg-black/[0.01] backdrop-blur-[20px]">
    <div className="flex h-full items-center gap-2 px-4">
      <span
        className="size-12 shrink-0 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: loadIcon ? `url(${icon})` : undefined }}
        aria-hidden
      />
      <div className="font-borna min-w-0 text-base/none font-medium text-white">
        {label}
      </div>
    </div>
    {showConnector ? (
      <div
        aria-hidden
        className="absolute top-1/2 -right-[30px] hidden h-2 w-5 -translate-y-1/2 items-center justify-between md:flex"
      >
        <span className="size-1 rounded-full bg-[#00DFEB]" />
        <span className="h-0.5 flex-1 bg-[#00DFEB]" />
        <span className="size-1 rounded-full bg-[#00DFEB]" />
      </div>
    ) : null}
  </div>
);

const ReferralDisconnectedLanding: FC = () => {
  const [showVisuals, setShowVisuals] = useState(false);
  const stepLabels = [
    <Trans key="connect-wallet">Connect Wallet</Trans>,
    <Trans key="enter-code">Enter Code &amp; Start Saving</Trans>,
    <Trans key="create-code">Create Code &amp; Start Earning</Trans>,
  ];

  useEffect(() => {
    const timer = window.setTimeout(
      () => setShowVisuals(true),
      DISCONNECTED_VISUALS_DELAY_MS,
    );

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[813px] pb-[90px]">
      <Background showVisuals={showVisuals} />
      <div className="relative z-10">
        <PageIntro />
        <div className="relative h-[525px] overflow-hidden rounded-[24px] border border-white/10 max-md:h-[460px]">
          <div className="relative z-10 mx-auto flex w-full max-w-[501px] flex-col items-center pt-[183px] text-center max-md:px-6 max-md:pt-[138px]">
            <h2 className="text-[42px]/tight font-medium tracking-[-0.04em] text-white max-md:text-[34px]">
              <Trans>See it. Share it. Sorted.</Trans>
            </h2>
            <p className="mt-6 text-xs/[1.2] text-white/70">
              <Trans>Save up to 5% on fees. Earn up to 30% with ease.</Trans>
            </p>
            <ConnectBtn className="mt-6 h-[46px] w-[168px] rounded-xl px-0 text-[13px] font-medium tracking-[-0.04em]" />
          </div>
        </div>
        <div className="relative z-20 mt-3 grid grid-cols-3 gap-10 max-md:grid-cols-1 max-md:gap-3">
          {STEPS.map((step, index) => (
            <Fragment key={step.id}>
              <StepCard
                {...step}
                label={stepLabels[index]}
                loadIcon={showVisuals}
                showConnector={index < STEPS.length - 1}
              />
              {index < STEPS.length - 1 ? (
                <div className="hidden h-4 items-center pl-[37px] max-md:flex">
                  <StepConnectorIcon className="shrink-0" />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReferralDisconnectedLanding;
