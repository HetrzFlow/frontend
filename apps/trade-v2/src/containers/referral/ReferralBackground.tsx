const REFERRAL_BACKGROUND_URL =
  '/trade-static/_next/image?url=%2Ftrade-static%2Freferral%2Fmask-referral-bg.png&w=1920&q=75';

const ReferralBackground = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
  >
    <div
      className="absolute inset-x-0 top-0 h-[max(520px,41.45vw)] bg-cover bg-top bg-no-repeat max-md:inset-x-auto max-md:top-[-105px] max-md:right-[-110px] max-md:h-[512px] max-md:w-[910px]"
      style={{ backgroundImage: `url('${REFERRAL_BACKGROUND_URL}')` }}
    />
  </div>
);

export default ReferralBackground;
