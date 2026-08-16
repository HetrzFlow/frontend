import { FC, useMemo, useState } from 'react';
import { CoinIcon } from '@repo/common/components';
import { useInstStore } from '@/common/stores';
import InstCategories from '@/components/InstCategories';

interface SelectMarketsContentProps {
  value: string;
  onValueChange: (v: string) => void;
}

const SelectMarketsContent: FC<SelectMarketsContentProps> = ({
  value,
  onValueChange,
}) => {
  const insts = useInstStore((state) => state.getInstsArr());
  const instsMap = useInstStore((state) => state.getInsts());
  const [selectedCategory, setSelectedCategory] = useState(
    instsMap[value]?.category ?? 'all',
  );

  const filterInsts = useMemo(() => {
    return [...insts]
      .filter(
        (v) => selectedCategory === 'all' || v.category === selectedCategory,
      )
      .sort((a, b) => {
        return a.symbol.localeCompare(b.symbol);
      });
  }, [insts, selectedCategory]);

  return (
    <>
      <InstCategories
        value={selectedCategory}
        onChange={setSelectedCategory}
        hideNewListed
      />
      <div className="scrollbar-none flex max-h-47 flex-col gap-2 overflow-y-auto">
        {filterInsts.map((v) => {
          return (
            <div
              key={v.id}
              className="hover:bg-bg-3 flex cursor-pointer items-center gap-2 rounded-xl p-2 text-sm font-medium transition-[background]"
              onClick={() => onValueChange(v.id)}
            >
              <CoinIcon src={v.icon} size={24} />
              {v.name}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default SelectMarketsContent;
