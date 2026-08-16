import * as React from 'react';
import { MoreHorizontalIcon } from 'lucide-react';

import ChevronLeftIcon from '../icons/ChevronLeft';
import ChevronRightIcon from '../icons/ChevronRight';
import LoaderCircleIcon from '../icons/LoaderCircle';
import { cn } from '../lib/utils';
import { Button, buttonVariants } from './button';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-row items-center gap-1.5', className)}
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="pagination-item"
      className={cn('flex items-center', className)}
      {...props}
    />
  );
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>;

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          size,
        }),
        'rounded-full border',
        isActive
          ? 'text-t-1100 bg-bg-4 hover:bg-bg-4'
          : 'text-t-430 hover:text-t-1100 bg-transparent',
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="icon"
      className={cn(
        'text-t-430 hover:text-t-1100 size-6 gap-1 border-0 hover:bg-transparent',
        className,
      )}
      {...props}
    >
      <ChevronLeftIcon />
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="icon"
      className={cn(
        'text-t-430 hover:text-t-1100 size-6 gap-1 border-0 hover:bg-transparent',
        className,
      )}
      {...props}
    >
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

function PaginationLoadMore({
  isFetching,
  className,
  ...props
}: React.ComponentProps<'span'> & {
  isFetching: boolean;
}) {
  return (
    <div
      className={cn(
        'text-t-270 mt-4 flex items-center justify-center text-sm font-medium',
        className,
      )}
    >
      <div className="bg-bg-3 flex gap-2 rounded-lg px-4 py-2">
        {isFetching ? (
          <LoaderCircleIcon size={14} className="animate-spin" />
        ) : null}
        <span
          className={cn(
            'cursor-pointer',
            isFetching ? 'pointer-events-none' : 'hover:text-t-1100',
          )}
          {...props}
        />
      </div>
    </div>
  );
}

function PaginationNoMore({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-t-430 flex justify-center gap-2 text-sm', className)}
      {...props}
    />
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationLoadMore,
  PaginationNoMore,
};
