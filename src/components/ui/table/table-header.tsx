'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, FilterIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableColumn, SortConfig } from "@/types/table";;
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Input } from '../input';
import { RadioGroup, RadioGroupItem } from '../radio-group';
import { Label } from '../label';
import { Checkbox } from '../checkbox';
import { Calendar } from '../calendar';
import { DateRange } from 'react-day-picker';

interface TableHeaderProps<T> {
  columns: TableColumn<T>[];
  sortConfig?: SortConfig<T>;
  onSortChange?: (column: keyof T | string, direction: 'asc' | 'desc') => void;
  hasActions?: boolean;
  onApplyFilter?: (filters: Record<string, unknown>) => void;
}

export function TableHeader<T>({ columns, sortConfig, onSortChange, hasActions = false, onApplyFilter }: TableHeaderProps<T>) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [localFilters, setLocalFilters] = useState<Record<string, unknown>>({});
  const [dateRanges, setDateRanges] = useState<Record<string, DateRange | undefined>>({});
  const [appliedFilters, setAppliedFilters] = useState<Array<string>>([]);

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSortChange) return;

    const currentDirection = sortConfig?.column === column.key ? sortConfig.direction : undefined;
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

    onSortChange(column.key, newDirection);
  };

  const getSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;

    const isActive = sortConfig?.column === column.key;
    const direction = sortConfig?.direction;

    if (isActive) {
      return direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
    }

    return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
  };

  const getFilterValue = (columnKey: string) => {
    return localFilters[columnKey] as string | string[] | undefined;
  };

  const updateLocalFilter = (columnKey: string, value: unknown) => {
    setLocalFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
  };

  const handleApplyFilter = (columnKey: string) => {
    const filterValue = localFilters[columnKey];
    const dateRange = dateRanges[columnKey];

    // If it's a date filter with custom range, include the date range
    const isCustomRange = typeof filterValue === 'string' && filterValue.toLowerCase().includes('custom');
    if (dateRange && isCustomRange) {
      onApplyFilter?.({
        ...localFilters,
        [columnKey]: filterValue,
        [`${columnKey}_range`]: dateRange,
      });
    } else {
      onApplyFilter?.({
        ...localFilters,
        [columnKey]: filterValue,
      });
    }
    setAppliedFilters((prev) => [...prev, columnKey]);
    setOpenFilter(null);
  };

  const handleFilterRemove = (columnKey: string) => {
    const isCustomRange = columnKey === 'dateTime' && (localFilters?.[columnKey as string] as string).includes('custom');

    if (isCustomRange) {
      delete localFilters?.[columnKey];
      delete localFilters?.['dateTime_range'];
    } else {
      delete localFilters?.[columnKey];
    }
    const newAppliedFilters = appliedFilters?.filter((filter) => filter !== columnKey);
    setAppliedFilters(newAppliedFilters);
    onApplyFilter?.(localFilters);
    setOpenFilter(null);
  };

  const handleCancelFilter = (columnKey: string) => {
    setLocalFilters((prev) => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
    setDateRanges((prev) => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
    setOpenFilter(null);
  };

  const renderAppliedValue = (type: string, value: unknown, range?: DateRange) => {
    switch (type) {
      case "text":
        return value as string;
      case "singleSelect":
        return value as string;
      case "multiSelect":
        return (Array.isArray(value) ? value.join(", ") : value) as string;
      case "date":
        if (typeof value === "string" && value.toLowerCase().includes("custom") && range) {
          return `${range.from?.toLocaleDateString()} - ${range.to?.toLocaleDateString()}`;
        }
        return value as string;
      default:
        return String(value ?? "");
    }
  };

  const renderFilterContent = (column: TableColumn<T>) => {
    const columnKey = column.key as string;
    const filterConfig = column.filter;
    if (!filterConfig) return null;
    const isApplied = appliedFilters.includes(columnKey);
    const filterValue = localFilters[columnKey];

    if (isApplied) {
      return (
        <div className="space-y-3">
          {/* Applied Value Display */}
          <div className="flex justify-between gap-1 items-center">
            <p className="border border-primary w-full p-1 px-2 rounded-md bg-primary text-white text-sm">
              {renderAppliedValue(filterConfig.type, filterValue, dateRanges[columnKey])}
            </p>
            {/* Remove Filter */}
            <div
              className="bg-destructive p-1 rounded-md cursor-pointer"
              onClick={() => handleFilterRemove(columnKey)}
            >
              <X color="#fff" />
            </div>
          </div>
        </div>
      );
    }
    // -----------------------
    //  NORMAL FILTER UI
    // -----------------------
    /** TEXT FILTER **/
    if (filterConfig.type === "text") {
      return (
        <div className="space-y-3">
          <Input
            placeholder={filterConfig.placeholder || "Search"}
            value={(filterValue as string) ?? ""}
            onChange={(e) => updateLocalFilter(columnKey, e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="w-1/2" size="sm" onClick={() => handleCancelFilter(columnKey)}>Cancel</Button>
            <Button size="sm" className="w-1/2" onClick={() => handleApplyFilter(columnKey)}>Apply Filter</Button>
          </div>
        </div>
      );
    }
    /** DATE FILTER (predefined + custom range) **/
    if (filterConfig.type === "date" && filterConfig.options) {
      const isCustom = typeof filterValue === "string" && filterValue.toLowerCase().includes("custom");
      const currentRange = dateRanges[columnKey];
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Date</h3>
          <RadioGroup
            value={(filterValue as string) || ""}
            onValueChange={(val) => updateLocalFilter(columnKey, val)}
          >
            {filterConfig.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option.label} id={`${columnKey}-${idx}`} />
                <Label htmlFor={`${columnKey}-${idx}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
         <div className='rounded-md bg-white w-[500px]'>
         {isCustom && (
            <Calendar
              initialFocus
              mode="range"
              selected={currentRange}
              onSelect={(range) =>
                setDateRanges((prev) => ({ ...prev, [columnKey]: range }))
              }
              numberOfMonths={2}
            />
          )}
         </div>
          <Button size="sm" className="w-full" onClick={() => handleApplyFilter(columnKey)}>
            Apply Filter
          </Button>
        </div>
      );
    }
    /** SINGLE SELECT **/
    if (filterConfig.type === "singleSelect") {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <RadioGroup
            value={(filterValue as string) || ""}
            onValueChange={(val) => updateLocalFilter(columnKey, val)}
          >
            {filterConfig.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value||''} id={`${columnKey}-${idx}`} />
                <Label htmlFor={`${columnKey}-${idx}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
          <Button size="sm" className="w-full" onClick={() => handleApplyFilter(columnKey)}>
            Apply Filter
          </Button>
        </div>
      );
    }
    /** MULTI SELECT **/
    if (filterConfig.type === "multiSelect") {
      const currentValues = (filterValue as string[]) ?? [];
      const toggleValue = (val: string) => {
        updateLocalFilter(
          columnKey,
          currentValues.includes(val)
            ? currentValues.filter((v) => v !== val)
            : [...currentValues, val]
        );
      };
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <div className="space-y-2">
            {filterConfig.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`${columnKey}-${idx}`}
                  checked={currentValues.includes(option.value as string)}
                  onCheckedChange={() => toggleValue(option.value as string)}
                />
                <Label htmlFor={`${columnKey}-${idx}`}>{option.label}</Label>
              </div>
            ))}
          </div>
          <Button size="sm" className="w-full" onClick={() => handleApplyFilter(columnKey)}>
            Apply Filter
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <thead className="bg-brown-background">
      <tr>
        {columns.map((column) => (
          <th key={String(column.key)} className={cn('px-4 py-3 text-left text-sm font-bold uppercase bg-brown-background text-secondary-gray', column.align === 'center' && 'text-center', column.align === 'right' && 'text-right', column.className)} style={{ width: column.width }}>
            {column.sortable ? (
              <Button variant="ghost" size="sm" onClick={() => handleSort(column)} className="h-auto p-0 font-medium hover:bg-transparent hover:text-foreground">
                {column.title}
                <span className="ml-2 hover:bg-transparent">{getSortIcon(column)}</span>
              </Button>
            ) : (
              column.title
            )}
            {column.filter && (
              <Popover open={openFilter === column?.key} onOpenChange={(isOpen) => setOpenFilter(isOpen ? (column?.key as string) : null)}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 rounded-none relative ml-1 top-[1px]">
                    <FilterIcon className={`h-3 w-3 ${appliedFilters?.includes(column.key as string) ? 'text-green-400' : 'text-white'}`} />
                  </Button>
                </PopoverTrigger>

                <PopoverContent align="start" className="w-64">
                  {renderFilterContent(column)}
                </PopoverContent>
              </Popover>
            )}
          </th>
        ))}

        {hasActions && <th className="px-4 py-3 text-left text-sm font-medium bg-primary text-primary-foreground w-12">Actions</th>}
      </tr>
    </thead>
  );
}
