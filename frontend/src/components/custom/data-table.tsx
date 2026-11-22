"use client";
import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Rows3,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
} from "@/components/ui/empty";
import { ErrorNotice } from "@/components/error-notice";
import type { PaginationMetadata } from "@/lib/http/contracts";

interface Column<Row> {
  header: string;
  cell: (row: Row) => ReactNode;
  sortKey?: string;
  numeric?: boolean;
}
interface Props<Row> {
  label: string;
  columns: Column<Row>[];
  rows?: Row[];
  refreshing?: boolean;
  error?: unknown;
  retry: () => void;
  empty: string;
  clearFilters?: () => void;
  emptyAction?: ReactNode;
  sort?: string;
  onSort?: (key: string) => void;
  pagination?: PaginationMetadata;
  onPage?: (page: number) => void;
  pageSize?: number;
}

export function DataTable<Row extends { id: string }>({
  label,
  columns,
  rows,
  error,
  refreshing,
  retry,
  empty,
  emptyAction,
  clearFilters,
  sort,
  onSort,
  pagination,
  onPage,
  pageSize,
}: Props<Row>) {
  const { t } = useTranslation();
  const count = rows?.length ?? 0;
  const offset =
    pagination && pageSize ? (pagination.currentPage - 1) * pageSize : 0;
  return (
    <section className="gw-table-panel" aria-label={label}>
      {Boolean(error) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <ErrorNotice error={error} />
          <Button type="button" size="sm" variant="outline" onClick={retry}>
            {t("controls.retry")}
          </Button>
        </div>
      )}
      <div className="overflow-x-auto" tabIndex={0} aria-label={label}>
        <table
          className="gw-table"
          aria-label={label}
          aria-busy={refreshing || (!rows && !error)}
        >
          <thead>
            <tr>
              {columns.map((col) => {
                const sorted =
                  col.sortKey && sort?.replace(/^-/, "") === col.sortKey;
                const SortIcon = sorted
                  ? sort?.startsWith("-")
                    ? ArrowDown
                    : ArrowUp
                  : ArrowUpDown;
                return (
                  <th
                    key={col.header}
                    scope="col"
                    className={col.numeric ? "text-right" : ""}
                    aria-sort={
                      sorted
                        ? sort?.startsWith("-")
                          ? "descending"
                          : "ascending"
                        : undefined
                    }
                  >
                    {col.sortKey && onSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2"
                        onClick={() => onSort(col.sortKey!)}
                      >
                        {col.header}
                        <SortIcon size={14} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {!rows && !error
              ? Array.from({ length: 4 }, (_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.header}>
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.map((row) => (
                  <tr key={row.id}>
                    {columns.map((col) => {
                      const content = col.cell(row);
                      return (
                        <td
                          key={col.header}
                          className={
                            col.numeric ? "text-right tabular-nums" : ""
                          }
                        >
                          {content === "" || content == null ? "—" : content}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            {rows && !count && !error && (
              <tr>
                <td colSpan={columns.length}>
                  <Empty className="min-h-44">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        {clearFilters ? <ListFilter /> : <Rows3 />}
                      </EmptyMedia>
                      <EmptyTitle>
                        {clearFilters ? t("controls.noResults") : empty}
                      </EmptyTitle>
                    </EmptyHeader>
                    {clearFilters ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                      >
                        {t("controls.clearFilters")}
                      </Button>
                    ) : (
                      emptyAction
                    )}
                  </Empty>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-sm text-muted-foreground">
          <span role="status">
            {refreshing
              ? t("controls.refreshing")
              : pageSize && count
                ? t("controls.range", {
                    from: offset + 1,
                    to: offset + count,
                    total: pagination.totalCount,
                  })
                : t("controls.total", { count: pagination.totalCount })}
          </span>
          {(pagination.pageCount > 1 || pagination.currentPage > 1) && onPage && (
            <nav
              aria-label={t("controls.pages")}
              className="flex items-center gap-2"
            >
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label={t("controls.prev")}
                disabled={!pagination.previousPage}
                onClick={() => onPage(pagination.previousPage!)}
              >
                <ChevronLeft />
              </Button>
              <span className="tabular-nums">
                {pagination.currentPage} / {pagination.pageCount}
              </span>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label={t("controls.next")}
                disabled={!pagination.nextPage}
                onClick={() => onPage(pagination.nextPage!)}
              >
                <ChevronRight />
              </Button>
            </nav>
          )}
        </footer>
      )}
    </section>
  );
}
