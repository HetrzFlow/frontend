import { useLingui } from '@lingui/react/macro';
import { SUPPORTED_LOCALES } from '@repo/i18n/const';
import { SelectGroup, SelectItem, SelectLabel } from '@repo/ui';

const Content = () => {
  const { t } = useLingui();

  return (
    <SelectGroup>
      <SelectLabel>{t`language`}</SelectLabel>
      {SUPPORTED_LOCALES.map((locale) => (
        <SelectItem key={locale} value={locale} className="text-sm">
          {locale.toUpperCase()}
        </SelectItem>
      ))}
    </SelectGroup>
  );
};

export default Content;
