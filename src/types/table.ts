import { ReactNode } from "react";

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  render?: (value: ReactNode, record: T, index: number) => ReactNode;
  filter?: {
    type: "text" | "date" | "singleSelect" | "multiSelect";
    placeholder?: string;
    options?: Array<{
      label: string;
      value?: string;
    }>;
  };
  className?: string;
}

export interface TableAction<T = Record<string, unknown>> {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (record: T) => void;
  disabled?: (record: T) => boolean;
  className?: string;
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total?: number; // Make optional
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  pageSizeOptions?: number[];
}

export interface SortConfig<T = Record<string, unknown>> {
  column?: keyof T | string;
  direction?: "asc" | "desc";
}

export interface TableProps<T = Record<string, unknown>> {
  data: T[] | undefined;
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  actions?: TableAction<T>[];
  pagination?: PaginationConfig | false;
  onPaginationChange?: (page: number, pageSize: number) => void;
  sortConfig?: SortConfig<T>;
  onSortChange?: (column: keyof T | string, direction: "asc" | "desc") => void;
  className?: string;
  rowClassName?: string | ((record: T, index: number) => string);
  onApplyFilter?: (filters: Record<string, unknown>) => void;
}

export type TableLoaderProps<T = Record<string, unknown>> = Pick<
  TableProps<T>,
  "columns" | "actions"
> & {
  pagination?: boolean;
  rows?: number;
};
