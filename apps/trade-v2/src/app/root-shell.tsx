import { FC } from 'react';

import { msg } from '@lingui/core/macro';

import { getConfiguredSiteUrl } from '@repo/common/site-url';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import { initLingui } from '@repo/i18n/server';
import { bornaSans, cerebriSans, mark } from '@repo/ui';
import { IMAGES_MAP } from '@/common/assets';

import { getAllI18nInstances } from '@/lib/i18n/importLocales';
import {
  HOME_OG_IMAGE_URL,
  HOME_OPEN_GRAPH,
  HOME_TWITTER,
} from '@/lib/metadata';
import { InjectHeadScripts } from './InjectHeadScripts.client';

export async function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#0a1012',
  };
}

const allI18nInstances = await getAllI18nInstances();
const BASE_URL = getConfiguredSiteUrl();

export async function generateRootMetadata(locale = DEFAULT_LOCALE) {
  const i18n = initLingui(locale, allI18nInstances);

  const SITE_URL =
    locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = loc === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${loc}`;
  }
  languages['x-default'] = BASE_URL;

  const title = i18n._(
    msg`HertzFlow | World Leverage Engine. Built For You to Win.`,
  );
  const description = i18n._(
    msg`Trade perpetuals with up to 200x leverage on HertzFlow. 100% self-custodial, multi-oracle pricing, zero slippage.`,
  );
  const ogImageAlt = i18n._(
    msg`HertzFlow — Trade crypto, FX, commodities and stocks with up to 200x leverage.`,
  );

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    icons: {
      icon: IMAGES_MAP.favicon.src,
    },
    openGraph: {
      ...HOME_OPEN_GRAPH,
      title,
      description,
      url: SITE_URL,
      images: [
        {
          url: HOME_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      ...HOME_TWITTER,
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: SITE_URL,
      languages,
    },
  };
}

const JSON_LD_WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'HertzFlow',
  url: 'https://www.hertzflow.xyz',
  description:
    'HertzFlow is a decentralized leverage trading platform built on BNB Chain. Trade crypto, FX, commodities, and stocks with up to 200x leverage — 100% self-custodial.',
  dateModified: new Date().toISOString().split('T')[0],
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.hertzflow.xyz/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const JSON_LD_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'HertzFlow',
  url: 'https://www.hertzflow.xyz',
  foundingDate: '2025',
  description:
    'HertzFlow is a decentralized perpetual exchange offering leverage trading on any asset, powered by multi-oracle pricing and built on BNB Chain.',
  sameAs: [
    'https://x.com/Hertzflow_xyz',
    'https://discord.com/invite/sBQqf2H7ts',
    'https://t.me/hertzflow',
    'https://medium.com/@hertzflow',
    'https://github.com/HertzFlow',
  ],
};

const JSON_LD_SOFTWARE_APP = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'HertzFlow',
  url: 'https://www.hertzflow.xyz',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  datePublished: '2025-02-10',
  dateModified: new Date().toISOString().split('T')[0],
  softwareVersion: '1.0',
  description:
    'Decentralized perpetual trading platform on BNB Chain — trade crypto, FX, commodities, and stocks with up to 200x leverage, 100% self-custodial.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

const JSON_LD_FINANCIAL_SERVICE = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  name: 'HertzFlow',
  url: 'https://www.hertzflow.xyz',
  description:
    'Decentralized perpetual trading platform offering leveraged trading on crypto, FX, commodities, and stocks with up to 200x leverage. 100% self-custodial on BNB Chain.',
  areaServed: 'Worldwide',
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceUrl: 'https://www.hertzflow.xyz',
    serviceType: 'Online',
  },
  provider: {
    '@type': 'Organization',
    name: 'HertzFlow',
    url: 'https://www.hertzflow.xyz',
  },
  serviceType: 'Perpetual Futures Trading',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Trading Markets',
    description: '90+ markets including crypto, FX, commodities, and stocks',
  },
};

// Apply greenUp/redUp class on <html> before hydration to prevent FOUC.
// Reads persisted choice from localStorage; falls back to greenUp.
const GREEN_UP_BOOTSTRAP_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem('v2-common.globalStore')||'{}');var g=(s.state&&typeof s.state.isGreenUp==='boolean')?s.state.isGreenUp:true;var el=document.documentElement;el.classList.remove('greenUp','redUp');el.classList.add(g?'greenUp':'redUp');}catch(e){console.error(e);}})();`;
const DOCUMENT_LOCALE_BOOTSTRAP_SCRIPT = `(function(){try{var locale=location.pathname.split('/')[1];var supported=${JSON.stringify(SUPPORTED_LOCALES)};if(supported.indexOf(locale)!==-1){document.documentElement.lang=locale;}}catch(e){console.error(e);}})();`;

export const RootDocument: FC<
  Readonly<{
    children: React.ReactNode;
    lang: string;
  }>
> = ({ children, lang }) => {
  return (
    <html
      lang={lang}
      className={`${bornaSans.variable} ${cerebriSans.variable} ${mark.variable} dark`}
      style={{ backgroundColor: 'var(--bg-1, #0a1012)' }}
      suppressHydrationWarning
    >
      <body
        className="[&:has(.notFound-page)]:bg-bg-1! [&:has(.notFound-page)_[data-site-header]]:bg-bg-1 tabular-nums antialiased [&:has(.notFound-page)_.hiddenIn404]:hidden"
        style={{ backgroundColor: 'var(--bg-1, #0a1012)' }}
      >
        <InjectHeadScripts
          bootstrapScript={`${GREEN_UP_BOOTSTRAP_SCRIPT}${DOCUMENT_LOCALE_BOOTSTRAP_SCRIPT}`}
          jsonLdPayloads={[
            { id: 'ld-website', payload: JSON_LD_WEBSITE },
            { id: 'ld-organization', payload: JSON_LD_ORGANIZATION },
            { id: 'ld-software-app', payload: JSON_LD_SOFTWARE_APP },
            { id: 'ld-financial-service', payload: JSON_LD_FINANCIAL_SERVICE },
          ]}
        />
        {children}
      </body>
    </html>
  );
};
