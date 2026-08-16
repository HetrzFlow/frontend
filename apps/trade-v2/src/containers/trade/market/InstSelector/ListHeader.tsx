import { FC } from 'react';
import { useLingui } from '@lingui/react/macro';
import { cn, SortUpDownIcon } from '@repo/ui';
import { SORT_KEY } from './const';

interface ListHeaderProps {
  sorts: Record<string, string>;
  onSortChange: (sortKey: SORT_KEY) => void;
}

const ListHeader: FC<ListHeaderProps> = ({ sorts, onSortChange }) => {
  const { t } = useLingui();

  return (
    <div className="text-t-350 flex justify-between border-b px-2 pb-2">
      <span className="flex w-11/48 shrink-0 grow-0 items-center pl-5 select-none max-md:w-1/2 max-md:pl-6">{t`Market`}</span>
      <span className="flex w-1/8 shrink-0 grow-0 items-center select-none max-md:w-1/2 max-md:justify-end max-md:gap-2">
        <span
          className="group/self flex cursor-pointer items-center gap-1 select-none"
          onClick={() => {
            onSortChange(SORT_KEY.price);
          }}
        >
          <span
            className={cn(
              'group-hover/self:text-t-1100',
              sorts.price ? 'text-t-1100' : '',
            )}
          >{t`Price`}</span>
          <SortUpDownIcon
            upClassName={sorts.price === 'asc' ? 'text-t-270' : 'text-t-430/50'}
            downClassName={
              sorts.price === 'desc' ? 'text-t-270' : 'text-t-430/50'
            }
          />
        </span>
        <span
          className="group/self hidden cursor-pointer items-center gap-1 select-none max-md:flex"
          onClick={() => {
            onSortChange(SORT_KEY.chg);
          }}
        >
          <span
            className={cn(
              'group-hover/self:text-t-1100',
              sorts.chg ? 'text-t-1100' : '',
            )}
          >{t`24h Chg`}</span>
          <SortUpDownIcon
            upClassName={sorts.chg === 'asc' ? 'text-t-270' : 'text-t-430/50'}
            downClassName={
              sorts.chg === 'desc' ? 'text-t-270' : 'text-t-430/50'
            }
          />
        </span>
      </span>
      <span className="flex w-1/12 shrink-0 grow-0 items-center select-none max-md:hidden">
        <span
          className="group/self flex cursor-pointer items-center gap-1 select-none"
          onClick={() => {
            onSortChange(SORT_KEY.chg);
          }}
        >
          <span
            className={cn(
              'group-hover/self:text-t-1100',
              sorts.chg ? 'text-t-1100' : '',
            )}
          >{t`24h Chg`}</span>
          <SortUpDownIcon
            upClassName={sorts.chg === 'asc' ? 'text-t-270' : 'text-t-430/50'}
            downClassName={
              sorts.chg === 'desc' ? 'text-t-270' : 'text-t-430/50'
            }
          />
        </span>
      </span>
      <span
        className="group/self flex w-1/8 shrink-0 grow-0 cursor-pointer items-center gap-1 select-none max-md:hidden"
        onClick={() => {
          onSortChange(SORT_KEY.vol);
        }}
      >
        <span
          className={cn(
            'group-hover/self:text-t-1100',
            sorts.vol ? 'text-t-1100' : '',
          )}
        >{t`24h Vol`}</span>
        <SortUpDownIcon
          upClassName={sorts.vol === 'asc' ? 'text-t-270' : 'text-t-430/50'}
          downClassName={sorts.vol === 'desc' ? 'text-t-270' : 'text-t-430/50'}
        />
      </span>
      <span
        className="group/self flex w-1/8 shrink-0 grow-0 cursor-pointer items-center gap-1 select-none max-md:hidden"
        onClick={() => {
          onSortChange(SORT_KEY.oi);
        }}
      >
        <span
          className={cn(
            'group-hover/self:text-t-1100',
            sorts.oi ? 'text-t-1100' : '',
          )}
        >{t`OI (L/S)`}</span>
        <SortUpDownIcon
          upClassName={sorts.oi === 'asc' ? 'text-t-270' : 'text-t-430/50'}
          downClassName={sorts.oi === 'desc' ? 'text-t-270' : 'text-t-430/50'}
        />
      </span>
      <span
        className="group/self flex w-7/48 shrink-0 grow-0 cursor-pointer items-center gap-1 select-none max-md:hidden"
        onClick={() => {
          onSortChange(SORT_KEY.liq);
        }}
      >
        <span
          className={cn(
            'group-hover/self:text-t-1100',
            sorts.liq ? 'text-t-1100' : '',
          )}
        >{t`AVLB LIQ (L/S)`}</span>
        <SortUpDownIcon
          upClassName={sorts.liq === 'asc' ? 'text-t-270' : 'text-t-430/50'}
          downClassName={sorts.liq === 'desc' ? 'text-t-270' : 'text-t-430/50'}
        />
      </span>
      <span className="flex w-1/6 shrink-0 grow-0 items-center justify-end gap-1 text-right select-none max-md:hidden">
        <span>{t`Features`}</span>
      </span>
    </div>
  );
};

export default ListHeader;
