"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileIcon } from "@/components/files/FileIcon";
import { FileContextMenu } from "@/components/files/FileContextMenu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  Share2,
} from "lucide-react";
import { formatFileSize, formatFileDate } from "@/lib/utils/files";
import { cn } from "@/lib/utils";
import type { KarsaazFile } from "@/lib/types/file.types";

interface FileListProps {
  files: KarsaazFile[];
  onNavigate: (file: KarsaazFile) => void;
  onSelectionChange?: (selected: KarsaazFile[]) => void;
  onAction?: (action: string, file: KarsaazFile) => void;
}

export function FileList({
  files,
  onNavigate,
  onSelectionChange,
  onAction,
}: FileListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns: ColumnDef<KarsaazFile>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={`Select ${row.original.name}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortButton
          label="Name"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const file = row.original;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon file={file} size="sm" />
            <span className="truncate text-sm font-medium">{file.name}</span>
            {file.isFavorite && (
              <Star className="h-3 w-3 text-yellow-500 shrink-0 fill-current" />
            )}
            {file.isShared && (
              <Share2 className="h-3 w-3 text-blue-500 shrink-0" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "size",
      header: ({ column }) => (
        <SortButton
          label="Size"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) =>
        row.original.type === "directory" ? (
          <span className="text-muted-foreground text-sm">—</span>
        ) : (
          <span className="text-sm text-muted-foreground">
            {formatFileSize(row.original.size)}
          </span>
        ),
      size: 100,
    },
    {
      accessorKey: "lastModified",
      header: ({ column }) => (
        <SortButton
          label="Modified"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatFileDate(row.original.lastModified)}
        </span>
      ),
      size: 140,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <FileContextMenu
          file={row.original}
          onAction={onAction}
          trigger="button"
        />
      ),
      size: 48,
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data: files,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      onSelectionChange?.(
        files.filter((_, i) => next[i])
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="w-full">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b bg-muted/30">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                This folder is empty
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b hover:bg-accent/40 cursor-pointer transition-colors group",
                  row.getIsSelected() && "bg-accent/60"
                )}
                onClick={() => onNavigate(row.original)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onNavigate(row.original);
                }}
                tabIndex={0}
                role="row"
                aria-selected={row.getIsSelected()}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortButton({
  label,
  sorted,
  onClick,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="h-3 w-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}
