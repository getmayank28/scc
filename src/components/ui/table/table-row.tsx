"use client";

import React from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TableAction, TableColumn } from "@/types/table";

interface TableRowProps<T> {
  record: T;
  index: number;
  columns: TableColumn<T>[];
  onRowClick?: (record: T, index: number) => void;
  actions?: TableAction<T>[];
  className?: string;
}

export function TableRow<T extends object>({
  record,
  index,
  columns,
  onRowClick,
  actions = [],
  className,
}: TableRowProps<T>) {
  const getValue = (record: T, key: keyof T | string): unknown => {
    if (typeof key === "string" && key.includes(".")) {
      // Handle nested keys like 'user.name'
      return key.split(".").reduce<unknown>((obj, k) => {
        if (
          obj &&
          typeof obj === "object" &&
          k in (obj as Record<string, unknown>)
        ) {
          return (obj as Record<string, unknown>)[k];
        }
        return undefined;
      }, record as unknown);
    }
    return record[key as keyof T];
  };

  const handleRowClick = () => {
    if (onRowClick) {
      onRowClick(record, index);
    }
  };

  const availableActions = actions.filter(
    (action) => !action.disabled || !action.disabled(record)
  );

  return (
    <tr
      className={cn(
        "transition-colors rounded-lg",
        onRowClick && "cursor-pointer",
        className
      )}
      onClick={handleRowClick}
    >
      {columns.map((column, ind) => {
        const value = getValue(record, column.key);
        const displayValue: React.ReactNode = column.render
          ? column.render(value as React.ReactNode, record, index)
          : (value as React.ReactNode);

        return (
          <td
            key={String(column.key)}
            className={cn(
              "px-4 py-3 text-sm border-y border-brown-border",
              column.align === "center" && "text-center",
              column.align === "right" && "text-right",
              column.className,
              ind === 0 && "border-l rounded-tl-lg rounded-bl-lg",
              ind === columns?.length-1 && "border-r rounded-tr-lg rounded-br-lg"
            )}
          >
            {displayValue}
          </td>
        );
      })}

      {availableActions.length > 0 && (
        <td className="px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()} // Prevent row click
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableActions.map((action) => (
                <DropdownMenuItem
                  key={action.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(record);
                  }}
                  className={action.className}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      )}
    </tr>
  );
}
