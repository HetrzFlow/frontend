'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useLingui } from '@lingui/react/macro';
import { DEFAULT_LOCALE } from '@repo/i18n/const';

import { GlobeIcon, Select, SelectContent, SelectTrigger } from '@repo/ui';
import Content from './Content';

const useSwitchLocale = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    i18n: { locale: curLocale },
  } = useLingui();

  return useCallback(
    (locale: string) => {
      if (locale === curLocale) {
        return;
      }
      router.replace(
        curLocale === DEFAULT_LOCALE
          ? `/${locale}${pathname}`
          : pathname.replace(`/${curLocale}`, `/${locale}`),
      );
    },
    [router, pathname, curLocale],
  );
};

const LocaleSwitch: React.FC = () => {
  const {
    i18n: { locale },
  } = useLingui();
  const switchLocale = useSwitchLocale();
  const handleLanguageChange = (lang: string) => {
    switchLocale(lang);
  };

  return (
    <Select onValueChange={handleLanguageChange} value={locale}>
      <SelectTrigger
        className="hover:bg-bg-3 flex size-8 cursor-pointer items-center justify-center rounded-full p-0 duration-300 hover:transition-[background]"
        hiddenIcon
      >
        <GlobeIcon className="size-5 cursor-pointer" size={20} />
      </SelectTrigger>
      <SelectContent align="end" className="w-50 py-3">
        <Content />
      </SelectContent>
    </Select>
  );
};

export default LocaleSwitch;
