"use client";

import React from "react";
import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";
import { TablePagination } from "./table-pagination";
import { TableProps } from "@/types/table";
import { cn } from "@/lib/utils";

export function DataTable<T extends object>({
  data,
  columns,
  onApplyFilter,
  loading = false,
  emptyText = "No data available",
  rowKey,
  onRowClick,
  actions = [],
  pagination = false,
  onPaginationChange,
  sortConfig,
  onSortChange,
  className,
  rowClassName,
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(record);
    }
    if (rowKey) {
      if (typeof rowKey === "string") {
        const rec = record as Record<string, unknown>;
        return String(rec[rowKey] ?? index);
      }
      const key = rowKey as unknown as string;
      const rec = record as Record<string, unknown>;
      return String(rec[key] ?? index);
    }
    return String(index);
  };

  const getRowClassName = (record: T, index: number): string => {
    if (typeof rowClassName === "function") {
      return rowClassName(record, index);
    }
    return rowClassName || "";
  };

  const hasNextPage = Number(data?.length) >= 10;

  if (loading) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-4">
          <TableHeader
            onApplyFilter={onApplyFilter}
            columns={columns}
            sortConfig={sortConfig}
            onSortChange={onSortChange}
            hasActions={actions.length > 0}
          />
          <tbody className="bg-brown-sidebar border border-white">
            {data?.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data?.map((record, index) => (
                <TableRow
                  key={getRowKey(record, index)}
                  record={record}
                  index={index}
                  columns={columns}
                  onRowClick={onRowClick}
                  actions={actions}
                  className={getRowClassName(record, index)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <TablePagination
          config={pagination}
          onChange={onPaginationChange || (() => {})}
          disabled={loading}
          hasNextPage={hasNextPage}
        />
      )}
    </div>
  );
}
