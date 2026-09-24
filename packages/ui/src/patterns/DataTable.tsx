import { cn } from "../primitives/Box";
import { Text } from "../primitives/Text";
import { Button } from "../primitives/Button";
import { Input } from "../primitives/Input";
import { Select } from "../primitives/Select";
import type { ReactNode, HTMLAttributes } from "react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";

export interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  sticky?: "left" | "right";
}

export interface DataTableProps<T> extends HTMLAttributes<HTMLDivElement> {
  columns: Column<T>[];
  data: T[];
  keyAccessor: (row: T) => string;
  selection?: {
    selected: Set<string>;
    onChange: (selected: Set<string>) => void;
  };
  sorting?: {
    columnId: string | null;
    direction: "asc" | "desc";
    onChange: (columnId: string, direction: "asc" | "desc") => void;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  loading?: boolean;
  emptyMessage?: string;
  rowHeight?: number;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

function Checkbox({ checked, onChange, disabled, indeterminate, "aria-label": ariaLabel, ...props }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  "aria-label"?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && indeterminate !== undefined) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className="inline-flex items-center cursor-pointer select-none">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        className="w-4 h-4 rounded border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-accent-positive)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:opacity-50"
        {...props}
      />
    </label>
  );
}

export function DataTable<T>({
  className,
  columns,
  data,
  keyAccessor,
  selection,
  sorting,
  pagination,
  loading,
  emptyMessage = "No data available",
  rowHeight = 44,
  striped = true,
  hoverable = true,
  ...props
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(sorting?.columnId ?? null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(sorting?.direction ?? "asc");

  const handleSort = useCallback(
    (columnId: string) => {
      if (!columns.find((c) => c.id === columnId)?.sortable) return;
      if (sortColumn === columnId) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(columnId);
        setSortDirection("asc");
      }
      sorting?.onChange(columnId, sortColumn === columnId && sortDirection === "asc" ? "desc" : "asc");
    },
    [columns, sortColumn, sortDirection, sorting]
  );

  const handleSelectAll = useCallback(() => {
    if (selection) {
      const allKeys = new Set(data.map(keyAccessor));
      if (selection.selected.size === allKeys.size) {
        selection.onChange(new Set());
      } else {
        selection.onChange(allKeys);
      }
    }
  }, [data, keyAccessor, selection]);

  const isAllSelected = selection && selection.selected.size === data.length && data.length > 0;
  const isIndeterminate = selection && selection.selected.size > 0 && selection.selected.size < data.length;

  if (loading) {
    return (
      <div className={cn("rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]", className)}>
        <div className="p-8 text-center text-[var(--color-fg-muted)]">
          <div className="animate-spin w-6 h-6 border-2 border-[var(--color-accent-positive)] border-t-transparent rounded-full mx-auto mb-2" />
          <Text variant="body-sm">Loading...</Text>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]", className)}>
        <div className="p-12 text-center text-[var(--color-fg-muted)]">
          <Text variant="body">{emptyMessage}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] overflow-hidden", className)} {...props}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" role="grid">
          <thead className="bg-[var(--color-bg-base)] border-b border-[var(--color-border-subtle)]">
            <tr>
              {selection && (
                <th className="w-12 px-3">
                  <Checkbox
                    checked={Boolean(isAllSelected)}
                    onChange={handleSelectAll}
                    aria-label={isAllSelected ? "Deselect all" : "Select all"}
                    indeterminate={isIndeterminate}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "px-4 py-3 text-left font-medium text-[var(--color-fg-secondary)] text-sm",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sortable && "cursor-pointer select-none hover:text-[var(--color-fg-primary)]",
                    column.sticky === "left" && "sticky left-0 z-10 bg-[var(--color-bg-base)]",
                    column.sticky === "right" && "sticky right-0 z-10 bg-[var(--color-bg-base)]"
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  scope="col"
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{column.header}</span>
                    {column.sortable && sortColumn === column.id && (
                      <svg
                        className={cn("w-3 h-3", sortDirection === "desc" && "rotate-180")}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => {
              const rowKey = keyAccessor(row);
              const isSelected = selection?.selected.has(rowKey);
              return (
                <tr
                  key={rowKey}
                  className={cn(
                    "border-b border-[var(--color-border-subtle)] transition-colors duration-fast",
                    striped && rowIndex % 2 === 1 && "bg-[var(--color-bg-base)]",
                    hoverable && "hover:bg-[var(--color-bg-hover)]",
                    isSelected && "bg-[var(--color-accent-positive-bg)]"
                  )}
                >
                  {selection && (
                    <td className="px-3">
                      <Checkbox
                        checked={Boolean(isSelected)}
                        onChange={(checked) => selection.onChange(new Set([...selection.selected, rowKey]))}
                        aria-label={isSelected ? `Deselect row ${rowIndex + 1}` : `Select row ${rowIndex + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor as keyof T];
                    return (
                      <td
                        key={column.id}
                        className={cn(
                          "px-4 py-3 text-sm",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                          column.sticky === "left" && "sticky left-0 z-10 bg-[var(--color-bg-elevated)]",
                          column.sticky === "right" && "sticky right-0 z-10 bg-[var(--color-bg-elevated)]"
                        )}
                        style={{
                          width: column.width,
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth,
                        }}
                      >
                        {column.render
                          ? column.render(value, row)
                          : typeof value === "object"
                          ? <span className="text-[var(--color-fg-muted)]">—</span>
                          : <Text variant="body-sm" color="primary" mono>{String(value)}</Text>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between gap-4 p-4 border-t border-[var(--color-border-subtle)]">
          <Text variant="caption" color="muted">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)} • {pagination.total} rows
          </Text>
          <div className="flex items-center gap-2">
            <Select
              value={String(pagination.pageSize)}
              options={[
                { value: "10", label: "10 per page" },
                { value: "25", label: "25 per page" },
                { value: "50", label: "50 per page" },
                { value: "100", label: "100 per page" },
              ]}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              size="sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              aria-label="Previous page"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              aria-label="Next page"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

DataTable.displayName = "DataTable";