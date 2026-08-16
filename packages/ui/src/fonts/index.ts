import { IBM_Plex_Sans } from 'next/font/google';
import localFont from 'next/font/local';

export const bornaSans = localFont({
  src: [
    {
      path: './Borna-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './Borna-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './Borna-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './Borna-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-borna-sans',
  display: 'swap',
  preload: false,
});

export const cerebriSans = localFont({
  src: [
    {
      path: './CerebriSansPro-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './CerebriSansPro-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './CerebriSansPro-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './CerebriSansPro-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './CerebriSansPro-ExtraBoldItalic.otf',
      weight: '800',
      style: 'italic',
    },
  ],
  variable: '--font-cerebri-sans',
  display: 'swap',
  preload: false,
});

export const mark = localFont({
  src: [
    {
      path: './MARK.PRO.BOLD.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-mark',
  display: 'swap',
  preload: false,
});

// number font
export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
  preload: false,
});
