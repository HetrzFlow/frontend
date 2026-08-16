'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@repo/i18n/const';
import {
  GlobeIcon,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  cn,
} from '@repo/ui';

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
};

const LOCALE_COOKIE = 'Next-Locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const LOCALE_SYNC_STORAGE_KEY = 'hertzflow:locale-sync';

type CookieStoreChangeEvent = Event & {
  changed?: Array<{ name: string; value: string }>;
};

type WindowWithCookieStore = Window & {
  cookieStore?: EventTarget;
};

function getCookiePathPrefixes(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const paths = new Set(['/']);

  segments.reduce((path, segment) => {
    const nextPath = `${path}/${segment}`;
    paths.add(nextPath);
    return nextPath;
  }, '');

  return Array.from(paths);
}

function setLocaleCookie(locale: string, pathname = '/') {
  getCookiePathPrefixes(pathname).forEach((path) => {
    document.cookie = `${LOCALE_COOKIE}=; Path=${path}; Max-Age=0; SameSite=Strict`;
  });
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Strict`;
}

function getLocaleCookie() {
  return document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1);
}

function ensureLocaleCookie(locale: string, pathname: string) {
  if (decodeURIComponent(getLocaleCookie() || '') !== locale) {
    setLocaleCookie(locale, pathname);
  }
}

function getPathnameLocale(pathname: string) {
  const locale = pathname.split('/')[1];
  return locale && SUPPORTED_LOCALES.includes(locale) ? locale : undefined;
}

function broadcastLocaleChange(locale: string) {
  try {
    localStorage.setItem(
      LOCALE_SYNC_STORAGE_KEY,
      JSON.stringify({ locale, timestamp: Date.now() }),
    );
  } catch {
    // Ignore storage errors; the current tab still updates through navigation.
  }
}

function getLocalePath(
  pathname: string,
  currentLocale: string,
  nextLocale: string,
) {
  if (nextLocale === currentLocale) return pathname;

  const segments = pathname.split('/');
  const currentSegment = segments[1];
  const hasLocaleSegment =
    currentSegment && SUPPORTED_LOCALES.includes(currentSegment);
  const routeSegments = segments.slice(2).join('/');
  const routePath = hasLocaleSegment
    ? routeSegments
      ? `/${routeSegments}`
      : '/'
    : pathname || '/';

  if (nextLocale === DEFAULT_LOCALE) return routePath;
  return routePath === '/' ? `/${nextLocale}` : `/${nextLocale}${routePath}`;
}

type LocaleSwitchProps = {
  triggerClassName?: string;
  iconClassName?: string;
  contentClassName?: string;
};

const LocaleSwitch = ({
  triggerClassName,
  iconClassName,
  contentClassName,
}: LocaleSwitchProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const pendingLocaleRef = useRef<string | null>(null);
  const {
    i18n: { locale = DEFAULT_LOCALE },
    t,
  } = useLingui();

  const handleLanguageChange = useCallback(
    (nextLocale: string) => {
      pendingLocaleRef.current = nextLocale;
      setLocaleCookie(nextLocale, pathname);
      broadcastLocaleChange(nextLocale);
      router.replace(getLocalePath(pathname, locale, nextLocale));
    },
    [locale, pathname, router],
  );

  useEffect(() => {
    const routeLocale = getPathnameLocale(pathname) || locale;

    if (pendingLocaleRef.current === routeLocale) {
      pendingLocaleRef.current = null;
    }

    const currentLocale = pendingLocaleRef.current || routeLocale;

    if (!SUPPORTED_LOCALES.includes(currentLocale)) {
      return;
    }

    ensureLocaleCookie(currentLocale, pathname);

    const syncLocaleCookie = () => {
      ensureLocaleCookie(currentLocale, pathname);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncLocaleCookie();
      }
    };
    const handleCookieChange = (event: CookieStoreChangeEvent) => {
      const localeCookie = event.changed?.find(
        (cookie) => cookie.name === LOCALE_COOKIE,
      );
      const expectedLocale = pendingLocaleRef.current || currentLocale;

      if (localeCookie && localeCookie.value !== expectedLocale) {
        setLocaleCookie(expectedLocale, pathname);
      }
    };
    const cookieStore = (window as WindowWithCookieStore).cookieStore;

    window.addEventListener('focus', syncLocaleCookie);
    window.addEventListener('pageshow', syncLocaleCookie);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    cookieStore?.addEventListener('change', handleCookieChange);

    return () => {
      window.removeEventListener('focus', syncLocaleCookie);
      window.removeEventListener('pageshow', syncLocaleCookie);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cookieStore?.removeEventListener('change', handleCookieChange);
    };
  }, [locale, pathname]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOCALE_SYNC_STORAGE_KEY || !event.newValue) return;

      let nextLocale: string | undefined;
      try {
        nextLocale = JSON.parse(event.newValue)?.locale;
      } catch {
        return;
      }

      if (
        !nextLocale ||
        nextLocale === locale ||
        !SUPPORTED_LOCALES.includes(nextLocale)
      ) {
        return;
      }

      pendingLocaleRef.current = nextLocale;
      setLocaleCookie(nextLocale, pathname);
      router.replace(getLocalePath(pathname, locale, nextLocale));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [locale, pathname, router]);

  return (
    <Select onValueChange={handleLanguageChange} value={locale}>
      <SelectTrigger
        aria-label={t`language`}
        className={triggerClassName}
        hiddenIcon
      >
        <GlobeIcon className={cn('size-5 cursor-pointer', iconClassName)} />
      </SelectTrigger>
      <SelectContent align="end" className={cn('w-50', contentClassName)}>
        <SelectGroup>
          <SelectLabel className="text-xs">{t`language`}</SelectLabel>
          {SUPPORTED_LOCALES.map((supportedLocale) => (
            <SelectItem
              key={supportedLocale}
              value={supportedLocale}
              className="text-xs"
            >
              {LOCALE_LABELS[supportedLocale] ?? supportedLocale}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default LocaleSwitch;
