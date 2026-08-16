import {
  Fragment,
  forwardRef,
  memo,
  ReactNode,
  Ref,
  UIEventHandler,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
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
  type HeaderGroup,
  OnChangeFn,
  type Row,
  RowSelectionState,
  SortingState,
  Table as CommonTable,
  type PaginationState,
  type TableState,
  getPaginationRowModel,
  useReactTable,
  VisibilityState,
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

interface TableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowSelection?: RowSelectionState;
  setRowSelection?: OnChangeFn<RowSelectionState>;
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  setColumnFilters?: OnChangeFn<ColumnFiltersState>;
  columnVisibility?: VisibilityState;
  setColumnVisibility?: OnChangeFn<VisibilityState>;
  noBorder?: boolean;
  getRowId?: (row: TData) => string;
  extra?: ReactNode;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  outerClassName?: string;
  wrapClassName?: string;
  pagination?: PaginationState;
  setPagination?: OnChangeFn<PaginationState>;
  emptyMessage?: ReactNode;
  emptyFullHeight?: boolean;
  equalColumns?: boolean;
  disableShadow?: boolean;
  headerClassName?: string;
  headCellClassName?: string;
  bodyRowClassName?: string;
  bodyCellClassName?: string;
  renderSubRow?: (row: TData, columnCount: number) => ReactNode | null;
  focusedRowId?: string | null;
}

const InnerTable = <TData,>({
  columnLength,
  headerGroups,
  rowModelRows,
  filteredRowCount,
  extra,
  isLoading,
  onRowClick,
  wrapClassName,
  emptyMessage,
  emptyFullHeight,
  equalColumns,
  disableShadow,
  headerClassName,
  headCellClassName,
  bodyRowClassName,
  bodyCellClassName,
  renderSubRow,
  focusedRowId,
}: {
  columnLength: number;
  noBorder?: boolean;
  headerGroups: HeaderGroup<TData>[];
  rowModelRows: Row<TData>[];
  filteredRowCount: number;
  extra: ReactNode;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  wrapClassName?: string;
  emptyMessage?: ReactNode;
  emptyFullHeight?: boolean;
  equalColumns?: boolean;
  disableShadow?: boolean;
  headerClassName?: string;
  headCellClassName?: string;
  bodyRowClassName?: string;
  bodyCellClassName?: string;
  renderSubRow?: (row: TData, columnCount: number) => ReactNode | null;
  focusedRowId?: string | null;
}) => {
  const { t } = useLingui();
  const [showYShadow, setShowYShadow] = useState([false, false]);
  const deferredShowYShadow = useDeferredValue(showYShadow);
  const [showXShadow, setShowXShadow] = useState([false, false]);
  const deferredShowXShadow = useDeferredValue(showXShadow);

  const updateScrollState = useCallback((target: HTMLDivElement) => {
    const {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollLeft,
      scrollWidth,
      clientWidth,
    } = target;

    setShowYShadow([
      scrollTop > 1,
      scrollTop < scrollHeight - clientHeight - 1,
    ]);
    setShowXShadow([
      scrollLeft > 1,
      scrollLeft < scrollWidth - clientWidth - 1,
    ]);
  }, []);

  const scrollDivRef = useResizeObserver<HTMLDivElement>((entry) => {
    updateScrollState(entry.target as HTMLDivElement);
  });

  const hasExtra = Boolean(filteredRowCount && extra);
  const extraComp = hasExtra ? extra : null;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (scrollDivRef.current) {
        updateScrollState(scrollDivRef.current);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [
    filteredRowCount,
    hasExtra,
    isLoading,
    rowModelRows.length,
    scrollDivRef,
    updateScrollState,
  ]);

  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback(() => {
    if (!scrollDivRef.current) return;
    updateScrollState(scrollDivRef.current);
  }, [scrollDivRef, updateScrollState]);

  const isEmpty = !rowModelRows.length && !isLoading;
  return (
    <>
      <BasicTable
        wrapRef={scrollDivRef}
        wrapClassName={cn(
          'scrollbar-none h-full overflow-y-auto',
          extraComp ? '' : 'pb-10',
          wrapClassName,
        )}
        className={cn(
          'border-separate border-spacing-x-0 border-spacing-y-1 -translate-y-1',
          isLoading || (emptyFullHeight && isEmpty) ? 'h-full' : '',
          equalColumns ? 'table-fixed' : '',
        )}
        extra={extraComp}
        onScroll={handleScroll}
      >
        <TableHeader
          className={cn('bg-bg-card-mix sticky top-1 z-50', headerClassName)}
        >
          {headerGroups.map((headerGroup) => {
            return (
              <TableRow key={headerGroup.id} className="text-center">
                {headerGroup.headers.map((header, index, arr) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'text-t-350 first:bg-bg-card-mix last:bg-bg-card-mix font-normal first:sticky first:left-0 first:z-20 first:pl-2 last:sticky last:right-0 last:z-20 last:pr-2',
                        !disableShadow && index === 0 && deferredShowXShadow[0]
                          ? "after:pointer-events-none after:absolute after:top-0 after:right-0 after:h-full after:w-[50px] after:translate-x-full after:bg-[linear-gradient(to_right,var(--bg-card-mix),transparent)] after:content-['']"
                          : '',
                        !disableShadow &&
                          index === arr.length - 1 &&
                          deferredShowXShadow[1]
                          ? "after:pointer-events-none after:absolute after:top-0 after:left-0 after:h-full after:w-[50px] after:-translate-x-full after:bg-[linear-gradient(to_right,transparent,var(--bg-card-mix))] after:content-['']"
                          : '',
                        headCellClassName,
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
          {rowModelRows.length && !isLoading ? (
            rowModelRows.map((row) => {
              const subRow = renderSubRow?.(row.original, columnLength) ?? null;
              return (
                <Fragment key={row.id}>
                  <TableRow
                    id={
                      row.id === focusedRowId
                        ? `order-table-row-${row.id}`
                        : undefined
                    }
                    className={cn(
                      'group',
                      onRowClick ? 'cursor-pointer' : '',
                      bodyRowClassName,
                    )}
                    data-state={row.getIsSelected() && 'selected'}
                    style={{
                      scrollMarginTop:
                        row.id === focusedRowId ? 36 : undefined,
                    }}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell, index, arr) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'group-hover:bg-bg-table-hover! first:bg-bg-card-mix last:bg-bg-card-mix group-hover:transition-[background] first:sticky first:left-0 first:z-10 first:pl-2 last:sticky last:right-0 last:z-10 last:pr-2',
                          !disableShadow &&
                            index === 0 &&
                            deferredShowXShadow[0]
                            ? "after:pointer-events-none after:absolute after:top-0 after:right-0 after:h-full after:w-[50px] after:translate-x-full after:bg-[linear-gradient(to_right,var(--bg-card-mix),transparent)] after:content-['']"
                            : '',
                          !disableShadow &&
                            index === arr.length - 1 &&
                            deferredShowXShadow[1]
                            ? "after:pointer-events-none after:absolute after:top-0 after:left-0 after:h-full after:w-[50px] after:-translate-x-full after:bg-[linear-gradient(to_right,transparent,var(--bg-card-mix))] after:content-['']"
                            : '',
                          bodyCellClassName,
                          cell.column.columnDef.meta?.bodyClassName,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {subRow ? (
                    <TableRow className="border-0 hover:bg-transparent hover:[&_td]:bg-transparent">
                      <TableCell
                        colSpan={columnLength}
                        className="p-0 pb-2 text-left"
                      >
                        {subRow}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
          ) : (
            <TableRow
              className={cn('border-0', emptyFullHeight ? 'h-full' : '')}
            >
              <TableCell
                colSpan={columnLength}
                className={cn(
                  'text-t-350 text-center last:text-center hover:bg-transparent!',
                  isLoading || emptyFullHeight ? 'h-full' : 'h-20',
                )}
              />
            </TableRow>
          )}
        </TableBody>
      </BasicTable>
      {(isLoading || isEmpty) && (
        <div
          className={cn(
            'text-t-350 absolute inset-x-0 top-9 z-10 flex items-center justify-center px-2 text-center text-sm',
            isLoading || emptyFullHeight ? 'bottom-0' : 'h-20',
          )}
        >
          {isLoading ? (
            <Loading className="flex h-full items-center justify-center rounded-xl bg-transparent" />
          ) : (
            (emptyMessage ?? t`No matching results found.`)
          )}
        </div>
      )}
      {!disableShadow && deferredShowYShadow[1] && (
        <div className="to-bg-card-mix pointer-events-none absolute bottom-0 h-12 w-full bg-gradient-to-b from-transparent" />
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
    columnVisibility,
    setColumnVisibility,
    noBorder = false,
    getRowId,
    extra,
    isLoading,
    onRowClick,
    outerClassName,
    wrapClassName,
    pagination,
    setPagination,
    emptyMessage,
    emptyFullHeight,
    equalColumns,
    disableShadow,
    headerClassName,
    headCellClassName,
    bodyRowClassName,
    bodyCellClassName,
    renderSubRow,
    focusedRowId,
  }: TableProps<TData, TValue>,
  ref?: Ref<CommonTable<TData>>,
) => {
  const state: Partial<TableState> = useMemo(
    () => ({
      sorting: sorting,
      columnFilters: columnFilters,
      columnVisibility: columnVisibility,
      rowSelection,
      ...(pagination ? { pagination } : {}),
    }),
    [sorting, columnFilters, columnVisibility, rowSelection, pagination],
  );

  const table = useReactTable({
    data,
    columns,
    getRowId,
    ...(pagination
      ? {
          autoResetPageIndex: false,
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
    ...(pagination
      ? {
          // enable built-in pagination pipeline only when pagination state is provided
          getPaginationRowModel: getPaginationRowModel(),
        }
      : {}),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    ...(setPagination
      ? {
          onPaginationChange: setPagination,
        }
      : {}),
    state,
  });

  useImperativeHandle(ref, () => {
    return table;
  }, [table]);

  const headerGroups = table.getHeaderGroups();
  const rowModelRows = table.getRowModel().rows;
  const filteredRowCount = table.getFilteredRowModel().rows.length;

  return (
    <div className={cn('relative h-full', outerClassName)}>
      <InnerTable
        columnLength={columns.length}
        noBorder={noBorder}
        headerGroups={headerGroups}
        rowModelRows={rowModelRows}
        filteredRowCount={filteredRowCount}
        isLoading={isLoading}
        extra={extra}
        onRowClick={onRowClick}
        wrapClassName={wrapClassName}
        emptyMessage={emptyMessage}
        emptyFullHeight={emptyFullHeight}
        equalColumns={equalColumns}
        disableShadow={disableShadow}
        headerClassName={headerClassName}
        headCellClassName={headCellClassName}
        bodyRowClassName={bodyRowClassName}
        bodyCellClassName={bodyCellClassName}
        renderSubRow={renderSubRow}
        focusedRowId={focusedRowId}
      />
    </div>
  );
};

const ForwardedTable = forwardRef(Table) as <TData, TValue>(
  props: TableProps<TData, TValue> & { ref?: Ref<CommonTable<TData>> },
) => ReturnType<typeof Table>;

export default memo(ForwardedTable) as typeof ForwardedTable;
