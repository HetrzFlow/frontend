import { DEFAULT_LOCALE } from '@repo/i18n/const';
import { cerebriSans } from '@repo/ui';
import { ThemeProvider } from '@/stores/themeStore';
import { generateLocaleMetadata, LocalizedProviders } from './i18n';

import '@/styles/globals.css';

export async function generateMetadata() {
  return generateLocaleMetadata(DEFAULT_LOCALE);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${cerebriSans.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-black tabular-nums antialiased [&:has(.notFound-page)_.hiddenIn404]:hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme={'dark'}
          enableSystem
          enableColorScheme
        >
          <LocalizedProviders locale={DEFAULT_LOCALE}>
            {children}
          </LocalizedProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
