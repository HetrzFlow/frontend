import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import {
  getMeritsShareSearchParams,
  MERITS_SHARE_IMAGE_SIZE,
  MERITS_SHARE_IMAGE_VERSION,
  resolveMeritsShareValues,
} from '@/lib/merits/meritsShare';
import {
  REFERRAL_SHARE_DESCRIPTION,
  REFERRAL_SHARE_TITLE,
  buildShortShareUrl,
  getCreditAirdropShareSearchParams,
  getLeaderboardShareSearchParams,
  isShareCrawler,
  isValidReferralCode,
  resolveLeaderboardShareValues,
  resolveCreditAirdropShareValues,
  resolveRequestOrigin,
  SOCIAL_SHARE_IMAGE_SIZE,
  SOCIAL_SHARE_IMAGE_VERSION,
} from '@/lib/referral/referralShare';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type SharePageProps = Readonly<{
  params: Promise<{ code: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

export const generateMetadata = async (
  props: SharePageProps,
): Promise<Metadata> => {
  const { code } = await props.params;

  if (!isValidReferralCode(code)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const requestHeaders = await headers();
  const origin = resolveRequestOrigin(requestHeaders);
  const searchParams = (await props.searchParams) ?? {};
  const meritsShareValues = resolveMeritsShareValues(searchParams);
  const shareValues = resolveCreditAirdropShareValues(searchParams);
  const leaderboardShareValues = resolveLeaderboardShareValues(searchParams);
  const shareUrl = meritsShareValues
    ? buildShortShareUrl(
        origin,
        code,
        getMeritsShareSearchParams(meritsShareValues),
        '/merits',
      )
    : shareValues
      ? buildShortShareUrl(
          origin,
          code,
          getCreditAirdropShareSearchParams(shareValues),
        )
      : leaderboardShareValues
        ? buildShortShareUrl(
            origin,
            code,
            getLeaderboardShareSearchParams(leaderboardShareValues),
          )
        : buildShortShareUrl(origin, code);
  const imageSearchParams = new URLSearchParams({ ref: code });

  if (meritsShareValues) {
    imageSearchParams.set('ref', meritsShareValues.inviteCode);
    imageSearchParams.set('short', code);
    Object.entries(getMeritsShareSearchParams(meritsShareValues)).forEach(
      ([key, value]) => imageSearchParams.set(key, value),
    );
  }

  if (shareValues) {
    Object.entries(getCreditAirdropShareSearchParams(shareValues)).forEach(
      ([key, value]) => {
        imageSearchParams.set(key, value);
      },
    );
  }

  if (leaderboardShareValues) {
    Object.entries(
      getLeaderboardShareSearchParams(leaderboardShareValues),
    ).forEach(([key, value]) => {
      imageSearchParams.set(key, value);
    });
  }

  imageSearchParams.set(
    'v',
    meritsShareValues ? MERITS_SHARE_IMAGE_VERSION : SOCIAL_SHARE_IMAGE_VERSION,
  );

  const imageUrl = `${origin}/api/og?${imageSearchParams.toString()}`;
  const title = meritsShareValues
    ? 'Join me on HertzFlow'
    : shareValues
      ? 'Just claimed my airdrop on HertzFlow'
      : leaderboardShareValues
        ? 'Join me on HertzFlow'
        : REFERRAL_SHARE_TITLE;
  const description = meritsShareValues
    ? `My Merits ${meritsShareValues.merits} · Rank ${meritsShareValues.rank}`
    : shareValues
      ? `${shareValues.creditAmount} Credit + ${shareValues.hzflAmount} Token earned. Trade any asset with leverage and start earning yours.`
      : leaderboardShareValues
        ? `Rank ${leaderboardShareValues.rank} · Net PnL ${leaderboardShareValues.netPnl} · Volume ${leaderboardShareValues.totalVolume}`
        : REFERRAL_SHARE_DESCRIPTION;

  return {
    metadataBase: new URL(origin),
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: shareUrl,
    },
    openGraph: {
      title,
      description,
      url: shareUrl,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: meritsShareValues
            ? MERITS_SHARE_IMAGE_SIZE.width
            : SOCIAL_SHARE_IMAGE_SIZE.width,
          height: meritsShareValues
            ? MERITS_SHARE_IMAGE_SIZE.height
            : SOCIAL_SHARE_IMAGE_SIZE.height,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
};

const Page = async (props: SharePageProps) => {
  const { code } = await props.params;

  if (!isValidReferralCode(code)) {
    notFound();
  }

  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent');

  if (!isShareCrawler(userAgent)) {
    redirect(`/ref/${encodeURIComponent(code)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A1012] px-6 text-center text-white">
      <div className="flex max-w-[480px] flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {REFERRAL_SHARE_TITLE}
        </h1>
        <p className="text-sm text-white/70">{REFERRAL_SHARE_DESCRIPTION}</p>
      </div>
    </main>
  );
};

export default Page;
