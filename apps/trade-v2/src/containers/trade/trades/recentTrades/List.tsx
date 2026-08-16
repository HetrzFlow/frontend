import { FC, MouseEvent, useEffect, useState } from 'react';
import { useListRef, List as VirtualList } from 'react-window';
import { cn, MEDIA_SIZES, useMediaQuery, useShowBShadow } from '@repo/ui';
import { useInstStore } from '@/common';
import { PlatformHistoryOrder } from '@/services/rest/order';
import Item from './Item';

const ROW_HEIGHT = 27;

interface ListPorps {
  instId: string;
  data: PlatformHistoryOrder[];
  handleRowMouseEnter: (index: number, top: number) => void;
  handleRowMouseLeave: () => void;
}

const List: FC<ListPorps> = ({
  instId,
  data,
  handleRowMouseEnter,
  handleRowMouseLeave,
}) => {
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;
  const scrollBoxRef = useListRef(null);

  const pxDispDecimal = useInstStore(
    (state) => state.getInst(state, instId)?.pxDispDecimal,
  );

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>, index: number) => {
    handleRowMouseEnter(
      index,
      ROW_HEIGHT * index - (scrollBoxRef.current?.element?.scrollTop || 0),
    );
  };

  const [divEle, setDivEle] = useState<HTMLDivElement>();

  useEffect(() => {
    const t = setTimeout(() => {
      setDivEle(scrollBoxRef.current?.element ?? undefined);
    }, 500);
    return () => clearTimeout(t);
  }, [scrollBoxRef]);

  const { showBShadow, handleScroll } = useShowBShadow(divEle);
  return (
    <>
      <VirtualList
        className="scrollbar-none"
        listRef={scrollBoxRef}
        rowComponent={Item}
        rowCount={data.length}
        rowHeight={ROW_HEIGHT}
        onScroll={handleScroll}
        rowProps={{
          data,
          onClick: handleMouseEnter,
          pxDispDecimal,
          onMouseEnter: isMobile ? undefined : handleMouseEnter,
          onmouseLeave: isMobile ? undefined : handleRowMouseLeave,
        }}
      />
      {showBShadow && (
        <div
          className={cn(
            'to-bg-card-mix max-md:to-bg-1 pointer-events-none absolute bottom-0 h-12 w-full bg-gradient-to-b from-transparent',
          )}
        />
      )}
    </>
  );
};

export default List;
