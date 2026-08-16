import { FC, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  type RowComponentProps,
  List as VirtualList,
  useListRef,
} from 'react-window';
import { ClaimHistoryTableDataType, ClaimPendingTableDataType } from '../type';
import ClaimListItem from './ClaimListItem';

const ITEM_HEIGHT = 44;
const PENDING_ITEM_HEIGHT = 44;
const FOOTER_HEIGHT = 64; // my-4 (16px * 2) + content (~32px)
const STICKY_HEADER_OFFSET = 32;

type RowItem =
  | {
      type: 'item';
      item: ClaimPendingTableDataType | ClaimHistoryTableDataType;
    }
  | { type: 'footer'; node: ReactNode };

interface ListItemData {
  rows: RowItem[];
  focusedClaimId?: string | null;
}

const RowRenderer = ({
  index,
  style,
  rows,
  focusedClaimId,
}: RowComponentProps<ListItemData>) => {
  const row = rows[index]!;
  if (row.type === 'footer') {
    return <div style={style}>{row.node}</div>;
  }
  const { item } = row;
  return (
    <div
      id={item.id === focusedClaimId ? `claim-item-${item.id}` : undefined}
      style={{
        ...style,
        scrollMarginTop:
          item.id === focusedClaimId ? STICKY_HEADER_OFFSET : undefined,
      }}
    >
      <ClaimListItem data={item} />
    </div>
  );
};

interface HistoryListProps {
  listItems: (ClaimPendingTableDataType | ClaimHistoryTableDataType)[];
  footer?: ReactNode;
  focusedClaimId?: string | null;
}

const HistoryList: FC<HistoryListProps> = ({
  listItems,
  footer,
  focusedClaimId,
}) => {
  const listRef = useListRef(null);
  const scrolledClaimIdRef = useRef<string | null>(null);
  const rows = useMemo<RowItem[]>(() => {
    const items: RowItem[] = listItems.map((item) => ({ type: 'item', item }));
    if (footer) {
      items.push({ type: 'footer', node: footer });
    }
    return items;
  }, [listItems, footer]);

  const rowProps = useMemo<ListItemData>(
    () => ({ rows, focusedClaimId }),
    [focusedClaimId, rows],
  );

  const getRowHeight = useCallback(
    (index: number) => {
      const row = rows[index];
      if (row?.type === 'footer') return FOOTER_HEIGHT;
      if (row?.item.kind === 'pending') return PENDING_ITEM_HEIGHT;
      return ITEM_HEIGHT;
    },
    [rows],
  );

  useEffect(() => {
    if (!focusedClaimId || scrolledClaimIdRef.current === focusedClaimId) {
      return;
    }

    const index = listItems.findIndex((item) => item.id === focusedClaimId);
    if (index < 0) return;

    listRef.current?.scrollToRow({
      align: 'start',
      behavior: 'instant',
      index,
    });

    let attempts = 0;
    const scrollToClaimItem = () => {
      const claimItem = document.getElementById(`claim-item-${focusedClaimId}`);
      if (claimItem) {
        scrolledClaimIdRef.current = focusedClaimId;
        claimItem.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        return;
      }

      attempts += 1;
      if (attempts < 5) {
        requestAnimationFrame(scrollToClaimItem);
      }
    };
    requestAnimationFrame(scrollToClaimItem);
  }, [focusedClaimId, listItems, listRef]);

  return (
    <div className="relative">
      <VirtualList
        className="scrollbar-none"
        listRef={listRef}
        rowComponent={RowRenderer}
        rowCount={rows.length}
        rowHeight={getRowHeight}
        rowProps={rowProps}
      />
    </div>
  );
};

export default HistoryList;
