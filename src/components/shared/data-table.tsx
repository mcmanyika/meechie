"use client";

import {
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/feedback";

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
});

export type DemoFeatures = typeof features;
// TanStack Table v9 models a row as Record<string, any>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GridRow = Record<string, any>;
export type GridColumn = ColumnDef<DemoFeatures, GridRow>;

export function DataTable({
  data,
  columns,
  search,
  onSearch,
  searchPlaceholder = "Search",
  emptyTitle,
  emptyBody,
  toolbar,
  pageSize = 8,
}: {
  data: readonly object[];
  columns: GridColumn[];
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  emptyTitle: string;
  emptyBody: string;
  toolbar?: React.ReactNode;
  pageSize?: number;
}) {
  const table = useTable(
    {
      features,
      data: data as GridRow[],
      columns,
      initialState: { pagination: { pageIndex: 0, pageSize } },
    },
    (state) => ({ pagination: state.pagination, sorting: state.sorting }),
  );

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
        {onSearch ? (
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="sm:max-w-xs"
          />
        ) : (
          <div />
        )}
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      </div>
      {data.length === 0 ? (
        <div className="p-4">
          <EmptyState title={emptyTitle} body={emptyBody} />
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-left"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <div className="flex items-center justify-between gap-3 border-t px-3 py-2 text-sm text-muted-foreground">
        <span>
          {data.length} record{data.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <span>
            Page {table.state.pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
