const SITE_URL = 'https://www.hertzflow.xyz';
const DOCS_URL = 'https://hertzflow.gitbook.io/hertzflow-docs';

const feedItems = [
  {
    title: 'Welcome to HertzFlow',
    link: DOCS_URL,
    description:
      'Official product information, documentation, and ecosystem resources for HertzFlow.',
  },
  {
    title: 'Key Features',
    link: `${DOCS_URL}/key-features`,
    description:
      'Overview of HertzFlow platform capabilities, product design, and supporting resources.',
  },
  {
    title: 'How It Works',
    link: `${DOCS_URL}/how-it-works`,
    description:
      'Documentation explaining the HertzFlow platform, workflows, and reference materials.',
  },
  {
    title: 'Protocol Architecture',
    link: `${DOCS_URL}/protocol-architecture`,
    description:
      'Technical architecture and system design documentation for HertzFlow.',
  },
  {
    title: 'Getting Started',
    link: `${DOCS_URL}/getting-started`,
    description:
      'Getting started guides and official documentation for HertzFlow users.',
  },
  {
    title: 'Developer Documentation',
    link: `${DOCS_URL}/tech-docs/overview`,
    description:
      'Developer documentation for integrations, APIs, and SDK references.',
  },
];

export async function GET() {
  const buildDate = new Date().toUTCString();

  const items = feedItems
    .map(
      (item) => `    <item>
      <title>${item.title}</title>
      <link>${item.link}</link>
      <description>${item.description}</description>
      <pubDate>${buildDate}</pubDate>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>HertzFlow</title>
    <link>${SITE_URL}</link>
    <description>HertzFlow official updates, product information, and documentation.</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
