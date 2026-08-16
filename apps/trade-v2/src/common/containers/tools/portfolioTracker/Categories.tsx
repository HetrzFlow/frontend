import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { TradeTabs } from '@/common/components';

export const useCategories = () => {
  const { t } = useLingui();
  return [
    {
      value: 'a16z',
      label: t`a16z`,
    },
    {
      value: 'Delphi',
      label: t`Delphi`,
    },
    {
      value: 'Multicoin',
      label: t`Multicoin`,
    },
    {
      value: 'Pantera',
      label: t`Pantera`,
    },
    {
      value: 'Paradigm',
      label: t`Paradigm`,
    },
    {
      value: 'Yzi Labs',
      label: t`Yzi Labs`,
    },
  ];
};

interface CategoriesProps {
  value: string;
  onChange: (value: string) => void;
}

const Categories: FC<CategoriesProps> = ({ value, onChange }) => {
  const options = useCategories();
  return (
    <div className="flex w-full gap-4 font-medium">
      <TradeTabs
        value={value}
        onValueChange={onChange}
        options={options}
        className="gap-0"
        listClassName="z-2 flex gap-1 font-medium justify-start"
        labelClassName="rounded-xl px-4 py-2 data-[state=active]:text-t-1100 grow-0"
        activeBarClassName="z-1 bg-bg-3 rounded-xl px-4 py-2"
      />
    </div>
  );
};

export default Categories;
