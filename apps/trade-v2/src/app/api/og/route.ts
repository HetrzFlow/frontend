import { createElement as h } from 'react';
import { ImageResponse } from '@vercel/og';
import QRCode from 'qrcode';
import {
  MERITS_SHARE_IMAGE_SIZE,
  resolveMeritsShareValues,
  type MeritsShareValues,
} from '@/lib/merits/meritsShare';
import {
  REFERRAL_SHARE_DESCRIPTION,
  buildCreditAirdropShareUrl,
  buildLeaderboardReferralShareUrl,
  buildLeaderboardShareUrl,
  isValidReferralCode,
  SOCIAL_SHARE_IMAGE_SIZE,
  buildShortShareUrl,
  resolveLeaderboardShareValues,
  resolveCreditAirdropShareValues,
  resolveRequestOrigin,
  type CreditAirdropShareValues,
  type LeaderboardShareValues,
} from '@/lib/referral/referralShare';

export const runtime = 'edge';

const QR_SIZE = 112;
const REFERRAL_SHARE_BACKGROUND =
  '/trade-static/referral/referral-bg-source.png';
const CREDIT_SHARE_ASSET_BASE = '/trade-static/credit';
const CREDIT_SHARE_ASSETS = {
  shareCredit: `${CREDIT_SHARE_ASSET_BASE}/m5 1.png`,
} as const;
const LEADERBOARD_SHARE_ASSET_BASE = '/trade-static/leaderboard';
const LEADERBOARD_SHARE_ASSETS = {
  glass: `${LEADERBOARD_SHARE_ASSET_BASE}/Group 2134581827.png`,
} as const;
const MERITS_SHARE_BACKGROUND = '/trade-static/merits/share-dialog-bg.png';

const renderHzIcon = (height = 42) =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      height,
      viewBox: '0 0 40 24',
      fill: 'none',
      style: {
        display: 'flex',
        color: '#00DFEB',
      },
    },
    h('path', {
      d: 'M23.2914 0.129072C23.9506 -0.113759 24.6446 -0.0098929 25.1996 0.406416C25.7548 0.822749 26.0668 1.44742 26.0668 2.10661L26.102 17.7541C26.1019 18.4132 25.7889 19.0727 25.2338 19.4543C24.7135 19.8356 24.0193 19.9397 23.3256 19.7316C22.4931 19.4539 21.9037 18.6209 21.9037 17.6496V15.4289C21.9035 14.4923 21.1402 13.7297 20.2035 13.7297C19.2669 13.7297 18.5036 14.4923 18.5034 15.4289V21.9172C18.5034 22.5764 18.1566 23.2357 17.6362 23.6174C17.0811 23.999 16.3867 24.1029 15.6928 23.8947C14.8604 23.617 14.2709 22.7839 14.2709 21.8127V6.2697C14.271 5.61059 14.5831 4.95109 15.1381 4.5695C15.5197 4.29203 15.9362 4.15349 16.3871 4.15349C16.63 4.15349 16.8733 4.18859 17.0815 4.25798C17.8791 4.53568 18.469 5.36792 18.4692 6.33903V8.62907C18.4692 9.56567 19.2318 10.329 20.1684 10.3293C21.1051 10.3293 21.8686 9.56582 21.8686 8.62907V2.2111C21.8686 1.23966 22.4588 0.406628 23.2914 0.129072ZM8.68499 6.30485C9.37888 6.06199 10.0732 6.20056 10.6284 6.5822C11.1833 6.99853 11.4955 7.6233 11.4955 8.28239V15.7072C11.4954 16.3663 11.1833 17.0258 10.6284 17.4074C10.0733 17.789 9.34418 17.8929 8.68499 17.6847C7.88702 17.4072 7.2973 16.5742 7.2973 15.6027V8.38591C7.29747 7.41469 7.8525 6.58239 8.68499 6.30485ZM30.2299 6.30485C30.9238 6.06199 31.6182 6.20056 32.1733 6.5822C32.7283 6.99853 33.0405 7.62327 33.0405 8.28239V15.7072C33.0404 16.3663 32.7283 17.0258 32.1733 17.4074C31.6182 17.789 30.8891 17.8929 30.2299 17.6847C29.432 17.4072 28.8422 16.5741 28.8422 15.6027V8.38591C28.8424 7.41473 29.3975 6.58243 30.2299 6.30485ZM3.06488 9.63493C3.2034 9.635 3.34197 9.67003 3.51507 9.67009C4.41713 9.84356 5.18047 10.6069 5.35394 11.509C5.49271 12.2722 5.24987 13.0701 4.69476 13.6252C4.13966 14.2149 3.37646 14.4231 2.57855 14.2843C1.67657 14.1108 0.913142 13.3475 0.739681 12.4455C0.600989 11.6823 0.843887 10.8843 1.39886 10.3293C1.84989 9.87824 2.44038 9.63493 3.06488 9.63493ZM37.2729 9.63493C37.4117 9.63493 37.5506 9.67009 37.7241 9.67009C38.6261 9.84359 39.3895 10.6069 39.5629 11.509C39.7017 12.2721 39.4587 13.0701 38.9037 13.6252C38.3487 14.2149 37.5854 14.423 36.7875 14.2843C35.8855 14.1109 35.1221 13.3475 34.9487 12.4455C34.8099 11.6822 35.0528 10.8844 35.6078 10.3293C36.0588 9.87833 36.6485 9.63494 37.2729 9.63493Z',
      fill: 'currentColor',
    }),
  );

const renderHzTextIcon = (height = 12) =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      height,
      viewBox: '0 0 71 12',
      fill: 'none',
      style: {
        display: 'flex',
        color: '#FFFFFF',
      },
    },
    h('path', {
      d: 'M59.3954 11.7957L57.6811 3.91625V3.64889H59.6942L60.8895 10.0185H61.2197L62.2577 3.64889H65.4347L66.4884 10.0185H66.8187L68.0611 3.64889H70.0271V3.91625L68.3128 11.7957H65.0415L64.0349 5.42608H63.7047L62.6509 11.7957H59.3954Z',
      fill: 'currentColor',
    }),
    h('path', {
      d: 'M53.2719 12.0001C50.7398 12.0001 48.8997 10.2072 48.8997 7.72226C48.8997 5.25307 50.7398 3.44442 53.2719 3.44442C55.6939 3.44442 57.6441 5.25307 57.6441 7.72226C57.6441 10.2072 55.6939 12.0001 53.2719 12.0001ZM50.8971 7.72226C50.8971 9.24782 51.9351 10.2072 53.2719 10.2072C54.6088 10.2072 55.6468 9.24782 55.6468 7.72226C55.6468 6.25962 54.6088 5.23734 53.2719 5.23734C51.9351 5.23734 50.8971 6.25962 50.8971 7.72226Z',
      fill: 'currentColor',
    }),
    h('path', {
      d: 'M46.1927 11.7956V0.000106812H48.1587V11.7956H46.1927Z',
      fill: 'currentColor',
    }),
    h('path', {
      d: 'M38.4289 11.7955V0.786398H45.2703V2.67368H40.4577V5.56751H44.7356V7.43907H40.4577V11.7955H38.4289Z',
      fill: 'currentColor',
    }),
    h('path', {
      d: 'M30.0718 11.7957V8.72882L35.136 5.69344V5.3789H30.2134V3.64889H37.102V6.68427L32.0377 9.73537V10.0499H37.1806V11.7957H30.0718Z',
      fill: 'currentColor',
    }),
    h('path', {
      d: 'M27.8409 11.7956C26.394 11.7956 25.3088 11.1665 25.3088 9.38929V5.30018H23.8304V3.64881H25.3402V1.82444H27.259V3.64881H29.5552V5.30018H27.259V9.20056C27.259 9.7982 27.5735 10.0184 28.0611 10.0184H29.4294V11.7956H27.8409Z',
      fill: 'currentColor',
    }),
    h('path', {
      d: 'M18.8086 11.7956V3.64885H20.7588V5.37886H21.0891C21.3407 4.38803 22.1585 3.5073 23.6683 3.5073V5.59904H22.6618C21.4193 5.59904 20.7745 6.47977 20.7745 7.51778V11.7956H18.8086Z',
      fill: 'currentColor',
    }),
    h('path', {
      d: 'M14.0997 12.0001C11.6934 12.0001 9.90052 10.2701 9.90052 7.69081C9.90052 5.23734 11.5991 3.44442 14.0525 3.44442C16.506 3.44442 18.0001 5.3317 17.9687 7.39199L17.9529 8.38281H11.835C12.0552 9.60954 12.9202 10.2858 14.0997 10.2858C14.9647 10.2858 15.7196 9.82973 16.0656 9.27927L17.4968 10.2544C16.8206 11.2924 15.6882 12.0001 14.0997 12.0001ZM11.8822 6.79435H16.0656C16.0185 5.89789 15.2006 5.06434 14.0525 5.06434C12.9359 5.06434 12.1495 5.72489 11.8822 6.79435Z',
      fill: 'currentColor',
    }),
    h('path', {
      d: 'M6.97575 11.7955V7.1717H2.25754V11.7955H0.212986V0.786398H2.25754V5.22151H6.97575V0.786398H9.0203V11.7955H6.97575Z',
      fill: 'currentColor',
    }),
  );

const setOgCacheHeaders = (image: Response) => {
  image.headers.set(
    'Cache-Control',
    'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
  );

  return image;
};

const renderMeritsMetric = (label: string, value: string, width: string) =>
  h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexShrink: 0,
        minWidth: 0,
        width,
        height: '112px',
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '22px',
          lineHeight: '26px',
          fontWeight: 400,
        },
      },
      label,
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          color: '#FFFFFF',
          fontSize: '72px',
          lineHeight: '86px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        },
      },
      value,
    ),
  );

const renderMeritsShareImage = async (
  origin: string,
  shareCode: string,
  ref: string,
  values: MeritsShareValues,
) => {
  const shareUrl = new URL(`/s/${encodeURIComponent(shareCode)}`, origin);
  shareUrl.searchParams.set('type', 'merits');
  shareUrl.searchParams.set('invite', values.inviteCode);
  shareUrl.searchParams.set('merits', values.merits);
  if (values.estimate !== null) {
    shareUrl.searchParams.set('estimate', values.estimate);
  }
  shareUrl.searchParams.set('rank', values.rank);
  const qrSvg = await QRCode.toString(shareUrl.toString(), {
    type: 'svg',
    margin: 0,
    color: { dark: '#FFFFFF', light: '#00000000' },
  });
  const qrDataUrl = `data:image/svg+xml;base64,${btoa(qrSvg)}`;
  const backgroundSrc = await fetchImageDataUrl(
    origin,
    MERITS_SHARE_BACKGROUND,
  );

  return setOgCacheHeaders(
    new ImageResponse(
      h(
        'div',
        {
          style: {
            position: 'relative',
            display: 'flex',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: '32px',
            backgroundColor: '#17181D',
            color: '#FFFFFF',
            fontFamily: 'sans-serif',
          },
        },
        h('img', {
          alt: '',
          src: backgroundSrc,
          width: 920,
          height: 949,
          style: {
            position: 'absolute',
            left: '-32px',
            top: '-32px',
            width: '920px',
            height: '949px',
            objectFit: 'cover',
          },
        }),
        h('div', {
          style: {
            position: 'absolute',
            inset: 0,
            display: 'flex',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: '32px',
          },
        }),
        h(
          'div',
          {
            style: {
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: '40px',
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                height: '64px',
                gap: '12px',
              },
            },
            renderHzIcon(48),
            renderHzTextIcon(24),
          ),
          values.estimate === null
            ? h(
                'div',
                {
                  style: {
                    display: 'flex',
                    gap: '24px',
                    marginTop: '128px',
                  },
                },
                renderMeritsMetric('My Merits', values.merits, '376px'),
                renderMeritsMetric('Rank', values.rank, '376px'),
              )
            : h(
                'div',
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    marginTop: '48px',
                  },
                },
                renderMeritsMetric('My Merits', values.merits, '776px'),
                h(
                  'div',
                  { style: { display: 'flex', gap: '16px' } },
                  renderMeritsMetric(
                    'Current Epoch estimate',
                    values.estimate,
                    '380px',
                  ),
                  renderMeritsMetric('Rank', values.rank, '380px'),
                ),
              ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                width: '100%',
                height: '100px',
                marginTop: values.estimate === null ? 'auto' : '48px',
                gap: '24px',
              },
            },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  gap: '8px',
                  paddingBottom: '4px',
                },
              },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontSize: '26px',
                    lineHeight: '32px',
                    fontWeight: 500,
                  },
                },
                'Join me on HertzFlow',
              ),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    width: '498px',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '22px',
                    lineHeight: '27px',
                    letterSpacing: '-0.04em',
                  },
                },
                'Trade & Earn on any asset with leverage. 100% self-custodial.',
              ),
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  flexShrink: 0,
                  alignItems: 'center',
                  gap: '8px',
                },
              },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '22px',
                    lineHeight: '26px',
                  },
                },
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      color: 'rgba(255,255,255,0.7)',
                    },
                  },
                  'Invite Code',
                ),
                h(
                  'div',
                  { style: { display: 'flex', fontWeight: 500 } },
                  values.inviteCode,
                ),
              ),
              h('img', {
                alt: '',
                src: qrDataUrl,
                width: 100,
                height: 100,
                style: { width: '100px', height: '100px' },
              }),
            ),
          ),
        ),
      ),
      MERITS_SHARE_IMAGE_SIZE,
    ),
  );
};

const fetchImageDataUrl = async (origin: string, pathname: string) => {
  const response = await fetch(new URL(pathname, origin));
  const contentType = response.headers.get('content-type') ?? 'image/png';
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return `data:${contentType};base64,${btoa(binary)}`;
};

const renderCreditShareLogo = () =>
  h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        width: '230px',
        height: '48px',
        gap: '9px',
      },
    },
    renderHzIcon(48),
    renderHzTextIcon(24),
  );

const renderCreditShareMetric = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) =>
  h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '500px',
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '22px',
          lineHeight: '27px',
          fontWeight: 400,
        },
      },
      label,
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          color: '#FFFFFF',
          fontSize: '72px',
          lineHeight: '82px',
          fontWeight: 500,
        },
      },
      value,
    ),
  );

const renderCreditEarnedMetric = (values: CreditAirdropShareValues) => {
  if (values.isWindowOpen) {
    return renderCreditShareMetric({
      label: 'Credit Earned',
      value: values.creditAmount,
    });
  }

  return h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '500px',
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '22px',
          lineHeight: '27px',
          fontWeight: 400,
        },
      },
      'Credit Earned',
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          height: '82px',
          gap: '16px',
        },
      },
      h('div', {
        style: {
          display: 'flex',
          width: '26px',
          height: '6px',
          borderRadius: '999px',
          backgroundColor: 'rgba(255, 255, 255, 0.35)',
        },
      }),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '48px',
            padding: '0 16px',
            gap: '8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 223, 235, 0.15)',
            color: '#63E8F2',
            fontSize: '22px',
            lineHeight: '27px',
            fontWeight: 500,
          },
        },
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: 28,
            height: 28,
            viewBox: '0 0 24 24',
            fill: 'none',
            style: {
              display: 'flex',
            },
          },
          h('path', {
            d: 'M7 10V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10',
            stroke: 'currentColor',
            strokeWidth: 2,
            strokeLinecap: 'round',
          }),
          h('rect', {
            x: 5,
            y: 10,
            width: 14,
            height: 10,
            rx: 2,
            stroke: 'currentColor',
            strokeWidth: 2,
          }),
          h('path', {
            d: 'M12 14V16',
            stroke: 'currentColor',
            strokeWidth: 2,
            strokeLinecap: 'round',
          }),
        ),
        'Unlocks Soon',
      ),
    ),
  );
};

const renderCreditAirdropCardBackground = ({
  shareCreditSrc,
}: {
  shareCreditSrc: string;
}) =>
  h(
    'div',
    {
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: '#21353D',
      },
    },
    h('div', {
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background:
          'linear-gradient(128deg, rgba(23, 24, 29, 0.96) 0%, rgba(31, 49, 56, 0.94) 45%, rgba(84, 190, 195, 0.6) 100%)',
      },
    }),
    h('div', {
      style: {
        position: 'absolute',
        right: '-80px',
        top: '-180px',
        width: '760px',
        height: '500px',
        borderRadius: '999px',
        background:
          'radial-gradient(circle, rgba(111, 229, 235, 0.55) 0%, rgba(68, 159, 165, 0.22) 48%, rgba(68, 159, 165, 0) 76%)',
      },
    }),
    h('div', {
      style: {
        position: 'absolute',
        right: '-60px',
        bottom: '-180px',
        width: '760px',
        height: '520px',
        borderRadius: '999px',
        background:
          'radial-gradient(circle, rgba(85, 199, 203, 0.42) 0%, rgba(85, 199, 203, 0.16) 46%, rgba(85, 199, 203, 0) 76%)',
      },
    }),
    h('img', {
      alt: '',
      src: shareCreditSrc,
      width: 874,
      height: 823,
      style: {
        position: 'absolute',
        right: '-190px',
        top: '-80px',
        width: '720px',
        height: '678px',
        objectFit: 'contain',
        opacity: 0.44,
      },
    }),
  );

const renderCreditAirdropImage = async (
  origin: string,
  ref: string,
  values: CreditAirdropShareValues,
) => {
  const shareUrl = buildCreditAirdropShareUrl(origin, ref, values);
  const qrSvg = await QRCode.toString(shareUrl, {
    type: 'svg',
    margin: 0,
    color: {
      dark: '#FFFFFF',
      light: '#00000000',
    },
  });
  const qrDataUrl = `data:image/svg+xml;base64,${btoa(qrSvg)}`;
  const shareCreditSrc = await fetchImageDataUrl(
    origin,
    CREDIT_SHARE_ASSETS.shareCredit,
  );

  return setOgCacheHeaders(
    new ImageResponse(
      h(
        'div',
        {
          style: {
            position: 'relative',
            display: 'flex',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#21353D',
            color: '#FFFFFF',
            fontFamily: 'sans-serif',
          },
        },
        renderCreditAirdropCardBackground({ shareCreditSrc }),
        h(
          'div',
          {
            style: {
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              left: '64px',
              top: '48px',
              width: '1072px',
              height: '534px',
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                height: '48px',
              },
            },
            renderCreditShareLogo(),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '48px',
                  padding: '0 24px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: '22px',
                  lineHeight: '27px',
                  fontWeight: 600,
                },
              },
              values.seasonName,
            ),
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: '20px',
              },
            },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  height: '110px',
                  gap: '32px',
                },
              },
              renderCreditEarnedMetric(values),
              renderCreditShareMetric({
                label: 'Points Earned',
                value: values.pointsAmount,
              }),
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  height: '110px',
                  gap: '32px',
                },
              },
              renderCreditShareMetric({
                label: 'Referred Users',
                value: values.referredUsers,
              }),
              renderCreditShareMetric({
                label: 'Referred Volume',
                value: values.referredVolume,
              }),
            ),
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              },
            },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  flex: '1 0 0',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '8px',
                  minWidth: 0,
                },
              },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    color: '#FFFFFF',
                    fontSize: '26px',
                    lineHeight: '31px',
                    fontWeight: 600,
                  },
                },
                'Join me on HertzFlow',
              ),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    width: '660px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '20px',
                    lineHeight: '26px',
                    fontWeight: 400,
                    letterSpacing: '-0.4px',
                  },
                },
                'Trade & Earn on any asset with leverage - 100% self-custodial.',
              ),
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                },
              },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '22px',
                    lineHeight: '27px',
                  },
                },
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 400,
                    },
                  },
                  'Referral Code',
                ),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      color: '#FFFFFF',
                      fontWeight: 600,
                    },
                  },
                  ref,
                ),
              ),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: `${QR_SIZE}px`,
                    height: `${QR_SIZE}px`,
                    padding: '8px',
                  },
                },
                h('img', {
                  alt: '',
                  src: qrDataUrl,
                  width: QR_SIZE - 16,
                  height: QR_SIZE - 16,
                  style: {
                    width: `${QR_SIZE - 16}px`,
                    height: `${QR_SIZE - 16}px`,
                  },
                }),
              ),
            ),
          ),
        ),
      ),
      {
        width: SOCIAL_SHARE_IMAGE_SIZE.width,
        height: SOCIAL_SHARE_IMAGE_SIZE.height,
      },
    ),
  );
};

const getLeaderboardSharePnlColor = (value: string) => {
  if (!value || value === '--' || value === 'TBD') return '#FFFFFF';

  return value.startsWith('-') ? '#ff6b6b' : '#54e35f';
};

const renderLeaderboardShareMetric = ({
  label,
  value,
  valueColor = '#FFFFFF',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) =>
  h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '500px',
        minWidth: 0,
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '22px',
          lineHeight: '27px',
          fontWeight: 400,
        },
      },
      label,
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          color: valueColor,
          fontSize: '72px',
          lineHeight: '82px',
          fontWeight: 500,
          letterSpacing: '-2.4px',
          whiteSpace: 'nowrap',
        },
      },
      value,
    ),
  );

const renderLeaderboardShareImage = async (
  origin: string,
  ref: string,
  values: LeaderboardShareValues,
) => {
  const shareUrl = ref
    ? buildLeaderboardShareUrl(origin, ref, values)
    : buildLeaderboardReferralShareUrl(origin, values);
  const qrDataUrl = ref
    ? `data:image/svg+xml;base64,${btoa(
        await QRCode.toString(shareUrl, {
          type: 'svg',
          margin: 0,
          color: {
            dark: '#FFFFFF',
            light: '#00000000',
          },
        }),
      )}`
    : '';
  const glassSrc = await fetchImageDataUrl(
    origin,
    LEADERBOARD_SHARE_ASSETS.glass,
  );

  return setOgCacheHeaders(
    new ImageResponse(
      h(
        'div',
        {
          style: {
            position: 'relative',
            display: 'flex',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            background:
              'linear-gradient(128deg, #17181D 0%, #14272E 55%, #19474F 100%)',
            color: '#FFFFFF',
            fontFamily: 'sans-serif',
          },
        },
        h('img', {
          alt: '',
          src: glassSrc,
          width: 1493,
          height: 1052,
          style: {
            position: 'absolute',
            right: '-180px',
            top: '-210px',
            width: '900px',
            height: '634px',
            objectFit: 'contain',
            opacity: 0.72,
          },
        }),
        h(
          'div',
          {
            style: {
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              left: '64px',
              top: '48px',
              width: '1072px',
              height: '534px',
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '48px',
              },
            },
            renderCreditShareLogo(),
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: '20px',
              },
            },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  height: '110px',
                  gap: '32px',
                },
              },
              renderLeaderboardShareMetric({
                label: 'Total Volume',
                value: values.totalVolume,
              }),
              renderLeaderboardShareMetric({
                label: 'Net PnL',
                value: values.netPnl,
                valueColor: getLeaderboardSharePnlColor(values.netPnl),
              }),
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  height: '110px',
                  gap: '32px',
                },
              },
              renderLeaderboardShareMetric({
                label: 'Win Rate',
                value: values.winRate,
              }),
              renderLeaderboardShareMetric({
                label: 'Rank',
                value: values.rank,
              }),
            ),
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              },
            },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  flex: '1 0 0',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '8px',
                  minWidth: 0,
                },
              },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    color: '#FFFFFF',
                    fontSize: '26px',
                    lineHeight: '31px',
                    fontWeight: 600,
                  },
                },
                'Join me on HertzFlow',
              ),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    width: '660px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '20px',
                    lineHeight: '26px',
                    fontWeight: 400,
                    letterSpacing: '-0.4px',
                  },
                },
                'Trade & Earn on any asset with leverage - 100% self-custodial.',
              ),
            ),
            ref
              ? h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    },
                  },
                  h(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '22px',
                        lineHeight: '27px',
                      },
                    },
                    h(
                      'div',
                      {
                        style: {
                          display: 'flex',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: 400,
                        },
                      },
                      'Referral Code',
                    ),
                    h(
                      'div',
                      {
                        style: {
                          display: 'flex',
                          color: '#FFFFFF',
                          fontWeight: 600,
                        },
                      },
                      ref,
                    ),
                  ),
                  h(
                    'div',
                    {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: `${QR_SIZE}px`,
                        height: `${QR_SIZE}px`,
                        padding: '8px',
                      },
                    },
                    h('img', {
                      alt: '',
                      src: qrDataUrl,
                      width: QR_SIZE - 16,
                      height: QR_SIZE - 16,
                      style: {
                        width: `${QR_SIZE - 16}px`,
                        height: `${QR_SIZE - 16}px`,
                      },
                    }),
                  ),
                )
              : null,
          ),
        ),
      ),
      {
        width: SOCIAL_SHARE_IMAGE_SIZE.width,
        height: SOCIAL_SHARE_IMAGE_SIZE.height,
      },
    ),
  );
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref')?.trim() ?? '';
  const shareCode = searchParams.get('short')?.trim() ?? '';
  const origin = resolveRequestOrigin(request.headers);
  const creditAirdropShareValues =
    resolveCreditAirdropShareValues(searchParams);
  const leaderboardShareValues = resolveLeaderboardShareValues(searchParams);
  const meritsShareValues = resolveMeritsShareValues(searchParams);

  if (!isValidReferralCode(ref) && (!leaderboardShareValues || ref)) {
    return new Response('Invalid referral code', { status: 400 });
  }

  if (meritsShareValues) {
    if (!isValidReferralCode(shareCode)) {
      return new Response('Invalid share code', { status: 400 });
    }
    return renderMeritsShareImage(origin, shareCode, ref, meritsShareValues);
  }

  if (creditAirdropShareValues) {
    return renderCreditAirdropImage(origin, ref, creditAirdropShareValues);
  }

  if (leaderboardShareValues) {
    return renderLeaderboardShareImage(origin, ref, leaderboardShareValues);
  }

  const qrValue = buildShortShareUrl(origin, ref);
  const qrSvg = await QRCode.toString(qrValue, {
    type: 'svg',
    margin: 0,
    color: {
      dark: '#FFFFFF',
      light: '#00000000',
    },
  });
  const qrDataUrl = `data:image/svg+xml;base64,${btoa(qrSvg)}`;

  const image = new ImageResponse(
    h(
      'div',
      {
        style: {
          position: 'relative',
          display: 'flex',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#373B41',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
        },
      },
      h('img', {
        alt: '',
        src: `${origin}${REFERRAL_SHARE_BACKGROUND}`,
        width: 1920,
        height: 1080,
        style: {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        },
      }),
      h('div', {
        style: {
          position: 'absolute',
          inset: 0,
          display: 'flex',
          background:
            'linear-gradient(90deg, rgba(5, 16, 19, 0.96) 0%, rgba(5, 16, 19, 0.82) 48%, rgba(5, 16, 19, 0.18) 100%)',
        },
      }),
      h(
        'div',
        {
          style: {
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '64px',
          },
        },
        h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                fontSize: '64px',
                lineHeight: '72px',
                fontWeight: 600,
                letterSpacing: '-0.035em',
              },
            },
            h('div', null, "Let's trade on"),
            h('div', null, 'HertzFlow together'),
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                width: '780px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '26px',
                lineHeight: '34px',
                fontWeight: 400,
                letterSpacing: '-0.04em',
              },
            },
            REFERRAL_SHARE_DESCRIPTION,
          ),
        ),
        h(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              },
            },
            renderHzIcon(48),
            renderHzTextIcon(24),
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              },
            },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '22px',
                  lineHeight: '27px',
                  letterSpacing: '-0.02em',
                },
              },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 400,
                  },
                },
                'Referral Code',
              ),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    maxWidth: '220px',
                    overflow: 'hidden',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                },
                ref,
              ),
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: `${QR_SIZE}px`,
                  height: `${QR_SIZE}px`,
                  padding: '8px',
                },
              },
              h('img', {
                alt: '',
                src: qrDataUrl,
                width: QR_SIZE - 16,
                height: QR_SIZE - 16,
                style: {
                  width: `${QR_SIZE - 16}px`,
                  height: `${QR_SIZE - 16}px`,
                },
              }),
            ),
          ),
        ),
      ),
    ),
    {
      width: SOCIAL_SHARE_IMAGE_SIZE.width,
      height: SOCIAL_SHARE_IMAGE_SIZE.height,
    },
  );

  return setOgCacheHeaders(image);
}
