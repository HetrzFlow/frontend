'use client';

import { FC, Ref, UIEventHandler } from 'react';
import { type ListImperativeAPI, List as VirtualList } from 'react-window';
import { BN } from '@repo/lib/calc';
import type { Inst } from '@/common';
import Item from './Item';

interface ListProps {
  data: Inst[];
  marketsStats: Record<
    string,
    { liqLong: BN; liqShort: BN; oiLong: BN; oiShort: BN }
  >;
  collisionBoundary: HTMLElement | null;
  listRef: Ref<ListImperativeAPI>;
  onClick: (inst: Inst) => void;
  onFavoriteToggle: (marketAddress: string) => void;
  onScroll: UIEventHandler<HTMLDivElement>;
}

const List: FC<ListProps> = ({
  data,
  marketsStats,
  collisionBoundary,
  listRef,
  onClick,
  onFavoriteToggle,
  onScroll,
}) => {
  return (
    <VirtualList
      className="scrollbar-none"
      listRef={listRef}
      rowComponent={Item}
      rowCount={data.length}
      rowHeight={56}
      rowProps={{
        data,
        onClick,
        onFavoriteToggle,
        marketsStats,
        collisionBoundary,
      }}
      onScroll={onScroll}
    />
  );
};

export default List;
