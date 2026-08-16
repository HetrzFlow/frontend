import { FC, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  FilterIcon,
  cn,
} from '@repo/ui';

import { TreeFilterContent } from '../../components/TreeFilter';
import { useHistoryActionFilter } from '../historyActionFilter';

const HistoryActionFilterDialog: FC = () => {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);
  const { label, value, selectedCount, options, onValueChange } =
    useHistoryActionFilter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t`Action`}
        className="text-t-430 hover:text-t-270 h-5 w-5 p-0"
        onClick={() => setOpen(true)}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <FilterIcon
            size={20}
            className={cn(value ? 'text-t-270' : 'text-t-430')}
          />
          {selectedCount > 0 ? (
            <span className="text-t-1100 bg-bg-3 absolute -top-1 right-0 min-w-4 translate-x-1/2 rounded-sm px-1 text-center text-[10px]">
              {selectedCount}
            </span>
          ) : null}
        </span>
      </Button>
      <DialogContent
        position="bottom"
        className="flex max-h-[calc(100dvh-80px)] min-h-[502px] flex-col gap-2 px-4 pt-4 pb-7"
        closeClassName="hidden"
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <TreeFilterContent
          value={value}
          options={options}
          onValueChange={onValueChange}
          groupLabel={t`Others`}
          scrollClassName="max-h-[360px] flex-1"
          shadowClassName="to-bg-1"
          focusOnMount
        />
      </DialogContent>
    </Dialog>
  );
};

export default HistoryActionFilterDialog;
