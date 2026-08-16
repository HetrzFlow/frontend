import { FC } from 'react';
import { cookies } from 'next/headers';
import { msg } from '@lingui/core/macro';

import { IMAGES_MAP } from '@repo/common';
import { getConfiguredSiteUrl } from '@repo/common/site-url';
import { LinguiClientProvider } from '@repo/i18n/client';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';

import { getI18nInstance, initLingui } from '@repo/i18n/server';
import { bornaSans, cerebriSans } from '@repo/ui';

import '@/styles/globals.css';

import { getAllI18nInstances } from '@/lib/importLocales';

const LOCALE_COOKIE = 'Next-Locale';

const allI18nInstances = await getAllI18nInstances();

export async function generateMetadata() {
  const [requestCookies] = await Promise.all([cookies()]);

  const locale = requestCookies.get(LOCALE_COOKIE)?.value || DEFAULT_LOCALE;
  const i18n = getI18nInstance(locale, allI18nInstances);

  const BASE_URL = getConfiguredSiteUrl();
  const SITE_URL =
    locale === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${locale}`;

  const OG_IMAGE = `${BASE_URL}/home-static/og.webp`;

  const title = i18n._(
    msg`HertzFlow | World Leverage Engine. Built For You to Win.`,
  );
  const description = i18n._(
    msg`Explore HertzFlow and learn about its trading platform, documentation, and ecosystem.`,
  );
  const ogImageAlt = i18n._(
    msg`HertzFlow platform overview and product information.`,
  );

  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = loc === DEFAULT_LOCALE ? BASE_URL : `${BASE_URL}/${loc}`;
  }
  languages['x-default'] = BASE_URL;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    icons: {
      icon: IMAGES_MAP.favicon.src,
    },
    alternates: {
      canonical: SITE_URL,
      languages,
    },
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: 'HertzFlow',
      type: 'website',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
      site: '@HertzFlow',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

const JSON_LD_WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'HertzFlow',
  url: 'https://www.hertzflow.xyz',
  description:
    'Official website for HertzFlow product information, updates, and documentation.',
  dateModified: new Date().toISOString().split('T')[0],
  hasPart: [
    {
      '@type': 'WebPage',
      name: 'HertzFlow Documentation',
      url: 'https://hertzflow.gitbook.io/hertzflow-docs',
      description: 'Official documentation and product guides for HertzFlow.',
    },
    {
      '@type': 'WebPage',
      name: 'HertzFlow Developer Docs',
      url: 'https://hertzflow.gitbook.io/hertzflow-docs/tech-docs/overview',
      description: 'Developer documentation for HertzFlow integrations.',
    },
  ],
};

const JSON_LD_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'HertzFlow',
  url: 'https://www.hertzflow.xyz',
  foundingDate: '2025',
  description:
    'HertzFlow is a web-based product and documentation platform for its ecosystem.',
  sameAs: [
    'https://x.com/Hertzflow_xyz',
    'https://discord.com/invite/sBQqf2H7ts',
    'https://t.me/hertzflow',
    'https://medium.com/@hertzflow',
    'https://github.com/HertzFlow',
  ],
};

const JSON_LD_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  dateModified: new Date().toISOString().split('T')[0],
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is HertzFlow?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'HertzFlow is the official website for product information, updates, documentation, and ecosystem resources.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I find HertzFlow documentation?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Official product and developer documentation is available at hertzflow.gitbook.io/hertzflow-docs.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I find HertzFlow updates and community links?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can find updates and official community links on the HertzFlow website, including X, Discord, Telegram, Medium, and GitHub.',
      },
    },
  ],
};

const RootLayout: FC<
  Readonly<{
    children: React.ReactNode;
  }>
> = async ({ children }) => {
  const [requestCookies] = await Promise.all([cookies()]);

  const locale = requestCookies.get(LOCALE_COOKIE)?.value || DEFAULT_LOCALE;
  const i18nInstance = initLingui(locale, allI18nInstances); // get a ready-made i18n instance for the given locale

  return (
    <html
      lang={locale}
      className={`dark ${bornaSans.variable} ${cerebriSans.variable}`}
      style={{
        colorScheme: 'dark',
      }}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="HertzFlow"
          href="https://www.hertzflow.xyz/feed.xml"
        />
        <link
          rel="help"
          href="https://hertzflow.gitbook.io/hertzflow-docs"
          title="HertzFlow Documentation"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_WEBSITE) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(JSON_LD_ORGANIZATION),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }}
        />
      </head>
      <body className="overflow-visible overflow-x-hidden bg-black text-white tabular-nums antialiased">
        <LinguiClientProvider
          initialLocale={locale}
          initialMessages={i18nInstance.messages}
        >
          {children}
        </LinguiClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
