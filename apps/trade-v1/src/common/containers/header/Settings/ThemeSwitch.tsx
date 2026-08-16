'use client';

import { useTheme } from 'next-themes';

import { useLingui } from '@lingui/react/macro';
import { MoonIcon, SunIcon, TvIcon } from '@repo/ui';

const ThemeSwitch: React.FC = () => {
  const { t } = useLingui();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between gap-2 p-2 pt-0">
      <span className="text-t-350">{t`Theme`}</span>
      <div className="flex gap-1">
        <div
          className={`hover:text-t-1100 hover:bg-bg-3 size-8 cursor-pointer rounded-lg hover:transition-[background] ${theme === 'light' ? 'text-t-1100 bg-bg-3' : 'text-t-350 bg-transparent'}`}
          onClick={() => setTheme('light')}
        >
          <SunIcon className="mx-auto mt-2" size={16} />
        </div>{' '}
        <div
          className={`hover:text-t-1100 hover:bg-bg-3 size-8 cursor-pointer rounded-lg hover:transition-[background] ${theme === 'dark' ? 'text-t-1100 bg-bg-3' : 'text-t-350 bg-transparent'}`}
          onClick={() => setTheme('dark')}
        >
          <MoonIcon className="mx-auto mt-2" size={16} />
        </div>{' '}
        <div
          className={`hover:text-t-1100 hover:bg-bg-3 size-8 cursor-pointer rounded-lg hover:transition-[background] ${theme === 'system' ? 'text-t-1100 bg-bg-3' : 'text-t-350 bg-transparent'}`}
          onClick={() => setTheme('system')}
        >
          <TvIcon className="mx-auto mt-2" size={16} />
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitch;
