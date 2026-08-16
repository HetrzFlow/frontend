import { headers } from 'next/headers';
import { msg } from '@lingui/core/macro';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import linguiConfig from '@repo/i18n/config/lingui.config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { getI18nInstance } from '@repo/i18n/server';
import ReferralContent from '@/containers/referral/ReferralContent.client';
import ReferralPageContainer from '@/containers/referral/ReferralPageContainer';
import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import { HOME_OPEN_GRAPH, HOME_TWITTER } from '@/lib/metadata';
import {
  getCreditAirdropShareSearchParams,
  getLeaderboardShareSearchParams,
  isValidReferralCode,
  resolveCreditAirdropShareValues,
  resolveLeaderboardShareValues,
  resolveRequestOrigin,
  SOCIAL_SHARE_IMAGE_SIZE,
  SOCIAL_SHARE_IMAGE_VERSION,
} from '@/lib/referral/referralShare';
import type { Metadata } from 'next';

export const revalidate = 300;

type ReferralPageProps = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

export async function generateStaticParams() {
  return linguiConfig.locales.map((locale) => ({
    locale,
  }));
}

export async function generateMetadata(
  props: ReferralPageProps,
): Promise<Metadata> {
  const locale = (await props.params).locale;
  const i18n = getI18nInstance(locale, await getAllI18nInstances());
  const BASE_URL = getConfiguredSiteUrl();

  const SITE_URL =
    locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    const locBase = loc === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${loc}`;
    languages[loc] = `${locBase}/referral`;
  }
  languages['x-default'] = `${BASE_URL}/en/referral`;

  const title = i18n._(msg`Referral | HertzFlow — Up to 200x Leverage`);
  const description = i18n._(
    msg`Trade perpetuals with up to 200x leverage on HertzFlow. 100% self-custodial, multi-oracle pricing, zero slippage.`,
  );
  const searchParams = (await props.searchParams) ?? {};
  const ref = getSearchParamValue(searchParams.ref);
  const creditAirdropShareValues =
    resolveCreditAirdropShareValues(searchParams);
  const leaderboardShareValues = resolveLeaderboardShareValues(searchParams);

  if (creditAirdropShareValues || leaderboardShareValues) {
    const origin = resolveRequestOrigin(await headers());
    const shareBaseUrl =
      locale === DEFAULT_LOCALE ? origin : `${origin}/${locale}`;
    const shareSearchParams = new URLSearchParams();
    if (ref) shareSearchParams.set('ref', ref);
    Object.entries(
      creditAirdropShareValues
        ? getCreditAirdropShareSearchParams(creditAirdropShareValues)
        : getLeaderboardShareSearchParams(leaderboardShareValues!),
    ).forEach(([key, value]) => {
      shareSearchParams.set(key, value);
    });
    const shareUrl = `${shareBaseUrl}/referral?${shareSearchParams.toString()}`;
    const imageSearchParams = new URLSearchParams(shareSearchParams);
    imageSearchParams.set('v', SOCIAL_SHARE_IMAGE_VERSION);
    const imageUrl = `${origin}/api/og?${imageSearchParams.toString()}`;
    const shareTitle = creditAirdropShareValues
      ? 'Just claimed my airdrop on HertzFlow'
      : i18n._(msg`Join me on HertzFlow`);
    const shareDescription = creditAirdropShareValues
      ? `${creditAirdropShareValues.creditAmount} Credit + ${creditAirdropShareValues.hzflAmount} Token earned. Trade any asset with leverage and start earning yours.`
      : `${i18n._(msg`Rank`)} ${leaderboardShareValues!.rank} · ${i18n._(msg`Net PnL`)} ${leaderboardShareValues!.netPnl} · ${i18n._(msg`Volume`)} ${leaderboardShareValues!.totalVolume}`;

    return {
      metadataBase: new URL(origin),
      title: shareTitle,
      description: shareDescription,
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        canonical: shareUrl,
      },
      openGraph: {
        title: shareTitle,
        description: shareDescription,
        url: shareUrl,
        type: 'website',
        images: [
          {
            url: imageUrl,
            width: SOCIAL_SHARE_IMAGE_SIZE.width,
            height: SOCIAL_SHARE_IMAGE_SIZE.height,
            alt: shareTitle,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: shareTitle,
        description: shareDescription,
        images: [imageUrl],
      },
    };
  }

  const referralCode = ref && isValidReferralCode(ref) ? ref : undefined;
  const referralOrigin = referralCode
    ? resolveRequestOrigin(await headers())
    : undefined;
  const referralShareUrl =
    referralCode && referralOrigin
      ? `${locale === DEFAULT_LOCALE ? referralOrigin : `${referralOrigin}/${locale}`}/referral?ref=${encodeURIComponent(referralCode)}`
      : `${SITE_URL}/referral`;
  const referralShareImageUrl =
    referralCode && referralOrigin
      ? `${referralOrigin}/api/og?ref=${encodeURIComponent(referralCode)}&v=${SOCIAL_SHARE_IMAGE_VERSION}`
      : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: referralShareUrl,
      languages,
    },
    openGraph: {
      ...(!referralShareImageUrl ? HOME_OPEN_GRAPH : {}),
      title,
      description,
      url: referralShareUrl,
      ...(referralShareImageUrl
        ? {
            images: [
              {
                url: referralShareImageUrl,
                width: SOCIAL_SHARE_IMAGE_SIZE.width,
                height: SOCIAL_SHARE_IMAGE_SIZE.height,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      ...(!referralShareImageUrl ? HOME_TWITTER : {}),
      title,
      description,
      ...(referralShareImageUrl
        ? {
            card: 'summary_large_image' as const,
            images: [referralShareImageUrl],
          }
        : {}),
    },
  };
}

const getSearchParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const Page = async (props: ReferralPageProps) => {
  const searchParams = (await props.searchParams) ?? {};
  const getSearchParam = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return (
    <ReferralPageContainer>
      <h1 className="sr-only">Referral — HertzFlow — Up to 200x Leverage</h1>
      <ReferralContent
        searchParams={{
          createReferralCode: getSearchParam('createReferralCode'),
          focusBindReferral: getSearchParam('focusBindReferral'),
          ref: getSearchParam('ref'),
        }}
      />
    </ReferralPageContainer>
  );
};

export default Page;
