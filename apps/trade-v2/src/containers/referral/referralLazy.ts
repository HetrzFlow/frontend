export const loadReferralConnectedContent = () =>
  import('./ReferralConnectedContent');

export const loadReferralConnectedDashboard = () =>
  import('./ReferralConnectedDashboard');

const REFERRAL_PREFETCH_IMAGE_URLS = [
  '/trade-static/_next/image?url=%2Ftrade-static%2Freferral%2Fmask-referral-bg.png&w=1920&q=75',
  '/trade-static/referral/referralCardBg.png',
  '/trade-static/referral/t1-active.svg',
  '/trade-static/referral/t2-active.svg',
  '/trade-static/referral/t2-unactivite.svg',
  '/trade-static/referral/t3-active.svg',
  '/trade-static/referral/t3-unactive.svg',
  '/trade-static/referral/unlock-bg.png',
  '/trade-static/referral/unlock-icon.svg',
  '/trade-static/referral/my-tier.svg',
];

let referralImagesPreloadPromise: Promise<unknown> | null = null;
const referralImageCache: HTMLImageElement[] = [];

export const preloadReferralImages = () => {
  if (typeof window === 'undefined') return Promise.resolve();

  referralImagesPreloadPromise ??= Promise.all(
    REFERRAL_PREFETCH_IMAGE_URLS.map(
      (src) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          referralImageCache.push(image);
          image.decoding = 'async';
          image.onload = () => {
            const decode = image.decode?.();
            if (decode) {
              void decode.then(resolve, resolve);
              return;
            }
            resolve();
          };
          image.onerror = () => resolve();
          image.src = src;
        }),
    ),
  ).catch(() => {
    referralImagesPreloadPromise = null;
  });

  return referralImagesPreloadPromise;
};
