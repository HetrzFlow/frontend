import {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  UIEventHandler,
  useCallback,
  useDeferredValue,
  useImperativeHandle,
  useState,
} from 'react';
import { useLingui } from '@lingui/react/macro';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  OnChangeFn,
  RowSelectionState,
  SortingState,
  Table as CommonTable,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table as BasicTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  cn,
  useResizeObserver,
  Loading,
} from '@repo/ui';

import styles from './Table.module.css';

interface TableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowSelection?: RowSelectionState;
  setRowSelection?: OnChangeFn<RowSelectionState>;
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  setColumnFilters?: OnChangeFn<ColumnFiltersState>;
  noBorder?: boolean;
  getRowId?: (row: TData) => string;
  extra?: ReactNode;
  isLoading?: boolean;
}

const InnerTable = <TData,>({
  columnLength,
  table,
  noBorder = false,
  extra,
  isLoading,
}: {
  columnLength: number;
  table: CommonTable<TData>;
  noBorder?: boolean;
  extra: ReactNode;
  isLoading?: boolean;
}) => {
  const { t } = useLingui();
  const [showBShadow, setShowBShadow] = useState(false);
  const deferredShowBShadow = useDeferredValue(showBShadow);
  const [showXShadow, setShowXShadow] = useState([false, false]);
  const deferredShowXShadow = useDeferredValue(showXShadow);

  const scrollDivRef = useResizeObserver<HTMLDivElement>((entry) => {
    const {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollLeft,
      scrollWidth,
      clientWidth,
    } = entry.target;
    setShowBShadow(scrollTop < scrollHeight - clientHeight - 1);
    setShowXShadow([
      scrollLeft > 1,
      scrollLeft < scrollWidth - clientWidth - 1,
    ]);
  });

  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback(() => {
    if (!scrollDivRef.current) return;
    const {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollLeft,
      scrollWidth,
      clientWidth,
    } = scrollDivRef.current;
    setShowBShadow(scrollTop < scrollHeight - clientHeight - 1);
    setShowXShadow([
      scrollLeft > 1,
      scrollLeft < scrollWidth - clientWidth - 1,
    ]);
  }, []);

  const extraComp = table.getFilteredRowModel().rows.length ? extra : null;
  return (
    <>
      <BasicTable
        wrapRef={scrollDivRef}
        wrapClassName={cn(
          'scrollbar-none h-full overflow-y-auto',
          extraComp ? '' : 'pb-10',
        )}
        className={isLoading ? 'h-full' : ''}
        extra={extraComp}
        onScroll={handleScroll}
      >
        <TableHeader
          className={cn(
            'bg-bg-1-2-mix sticky top-0 z-1',
            noBorder ? '[&_tr]:border-0' : '',
          )}
        >
          {table.getHeaderGroups().map((headerGroup) => {
            return (
              <TableRow key={headerGroup.id} className="text-center text-sm">
                {headerGroup.headers.map((header, index, arr) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'text-t-270 first:bg-bg-1-2-mix last:bg-bg-1-2-mix font-normal first:sticky first:left-0 first:pl-1 last:sticky last:right-0 last:pr-1',
                        index === 0 && deferredShowXShadow[0]
                          ? styles.rightShadow
                          : '',
                        index === arr.length - 1 && deferredShowXShadow[1]
                          ? styles.leftShadow
                          : '',
                        header.column.columnDef.meta?.headerClassName,
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            );
          })}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length && !isLoading ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  'group hover:bg-bg-table-hover',
                  noBorder ? 'border-0' : '',
                )}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell, index, arr) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      'first:bg-bg-1-2-mix last:bg-bg-1-2-mix first:group-hover:bg-bg-table-hover last:group-hover:bg-bg-table-hover first:sticky first:left-0 first:pl-1 last:sticky last:right-0 last:pr-1',
                      index === 0 && deferredShowXShadow[0]
                        ? styles.rightShadow
                        : '',
                      index === arr.length - 1 && deferredShowXShadow[1]
                        ? styles.leftShadow
                        : '',
                      cell.column.columnDef.meta?.bodyClassName,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="border-0">
              <TableCell
                colSpan={columnLength}
                className={cn(
                  'text-t-350 text-center last:text-center',
                  isLoading ? 'h-full' : 'h-20',
                )}
              >
                {isLoading ? (
                  <Loading className="h-full rounded-xl bg-transparent" />
                ) : (
                  t`No matching results found.`
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </BasicTable>
      {deferredShowBShadow && (
        <div className="to-bg-1-2-mix pointer-events-none absolute bottom-0 h-12 w-full bg-gradient-to-b from-transparent" />
      )}
    </>
  );
};

const Table = <TData, TValue>(
  {
    columns,
    data,
    rowSelection = {},
    setRowSelection,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    noBorder = false,
    getRowId,
    extra,
    isLoading,
  }: TableProps<TData, TValue>,
  ref?: Ref<CommonTable<TData>>,
) => {
  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  useImperativeHandle(ref, () => {
    return table;
  }, [table]);

  return (
    <div className="relative h-full">
      <InnerTable
        table={table}
        columnLength={columns.length}
        noBorder={noBorder}
        isLoading={isLoading}
        extra={extra}
      />
    </div>
  );
};

export default memo(forwardRef(Table)) as typeof Table;
