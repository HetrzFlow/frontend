import { FC, ReactNode } from 'react';
import {
  ChevronDownIcon,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/ui';

interface ListLayoutProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  listContent: ReactNode;
  className?: string;
  listContentWrapClassName?: string;
}

const ListLayout: FC<ListLayoutProps> = ({
  open,
  onOpenChange,
  title,
  listContent,
  className,
  listContentWrapClassName,
}) => {
  return (
    <Collapsible
      className={cn(
        'border-border hover:border-input rounded-xl border p-3 px-0 pb-0 text-sm',
        className,
      )}
      open={open}
      onOpenChange={onOpenChange}
    >
      <CollapsibleTrigger className="text-t-1100 w-full">
        <div
          className={
            'text-t-350 mb-3 flex h-5 items-center justify-between px-3 text-sm'
          }
        >
          {title}
          <ChevronDownIcon
            className={cn(
              'transition-transform duration-300',
              open ? '-rotate-180' : '',
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn('flex flex-col px-3', listContentWrapClassName)}
      >
        {listContent}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ListLayout;
