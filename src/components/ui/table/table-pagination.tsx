"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationConfig } from "@/types/table";

interface TablePaginationProps {
  config: PaginationConfig;
  onChange: (page: number, pageSize: number) => void;
  disabled?: boolean;
  hasNextPage?: boolean; // Add this to control next button
}

export function TablePagination({
  config,
  onChange,
  disabled = false,
  hasNextPage = true,
}: TablePaginationProps) {
  const {
    current,
    pageSize,
    showSizeChanger = true,
    pageSizeOptions = [10, 20, 50, 100],
  } = config;

  const handlePageChange = (page: number) => {
    if (page < 1 || disabled) return;
    onChange(page, pageSize);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    if (disabled) return;
    const size = parseInt(newPageSize);
    onChange(1, size);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-primary-foreground border-t">
      <div className="flex items-center gap-4">
        {showSizeChanger && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current - 1)}
          disabled={current <= 1 || disabled}
          className="h-8 px-3"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-1 px-3">
          <span className="text-sm text-muted-foreground">Page {current}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current + 1)}
          disabled={!hasNextPage || disabled}
          className="h-8 px-3"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
