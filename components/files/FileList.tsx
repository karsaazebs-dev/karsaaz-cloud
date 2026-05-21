"use client";

import { useState, useEffect } from "react";
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
import { FileIcon } from "@/components/files/FileIcon";
import { FileContextMenu } from "@/components/files/FileContextMenu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  Share2,
  Pin,
  UserPlus,
} from "lucide-react";
import { formatFileSize, formatFileDate } from "@/lib/utils/files";
import { cn } from "@/lib/utils";
import type { KarsaazFile } from "@/lib/types/file.types";

interface FileListProps {
  files: KarsaazFile[];
  selectedFiles?: KarsaazFile[];
  onNavigate: (file: KarsaazFile) => void;
  onSelectionChange?: (selected: KarsaazFile[]) => void;
  onAction?: (action: string, file: KarsaazFile) => void;
}

export function FileList({
  files,
  selectedFiles = [],
  onNavigate,
  onSelectionChange,
  onAction,
}: FileListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pinnedFiles, setPinnedFiles] = useState<string[]>([]);

  // Load pinned files from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("karsaaz-pinned-files");
    if (saved) {
      try {
        setPinnedFiles(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const togglePin = (fileId: string) => {
    const next = pinnedFiles.includes(fileId)
      ? pinnedFiles.filter((id) => id !== fileId)
      : [...pinnedFiles, fileId];
    setPinnedFiles(next);
    localStorage.setItem("karsaaz-pinned-files", JSON.stringify(next));
  };

  // Sync rowSelection state with selectedFiles prop
  useEffect(() => {
    if (selectedFiles.length === 0) {
      setRowSelection({});
    } else {
      const newSel: RowSelectionState = {};
      files.forEach((file, index) => {
        if (selectedFiles.some((f) => f.id === file.id)) {
          newSel[index] = true;
        }
      });
      setRowSelection(newSel);
    }
  }, [selectedFiles, files]);

  const columns: ColumnDef<KarsaazFile>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center pl-1">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center pl-1" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label={`Select ${row.original.name}`}
          />
        </div>
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
        const isPinned = pinnedFiles.includes(file.id);

        return (
          <div className="flex items-center justify-between min-w-0 w-full group/cell">
            <div className="flex items-center gap-3.5 min-w-0">
              <FileIcon file={file} size="sm" className="shrink-0" />
              <span className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {file.name}
              </span>
            </div>

            {/* Actions Panel - Always visible but styled subtly unless active/hovered */}
            <div className="flex items-center gap-3.5 ml-auto shrink-0 pl-4">
              <div className="flex items-center gap-3">
                {/* Pin Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(file.id);
                  }}
                  className={cn(
                    "transition-all duration-150 hover:scale-110 outline-none cursor-pointer",
                    isPinned
                      ? "text-red-500 fill-red-500 opacity-100"
                      : "text-muted-foreground/30 hover:text-muted-foreground/70"
                  )}
                  title={isPinned ? "Unpin" : "Pin"}
                >
                  <Pin className="h-4 w-4 rotate-45" />
                </button>

                {/* Star Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.("favorite", file);
                  }}
                  className={cn(
                    "transition-all duration-150 hover:scale-110 outline-none cursor-pointer",
                    file.isFavorite
                      ? "text-yellow-500 fill-yellow-500 opacity-100"
                      : "text-muted-foreground/30 hover:text-muted-foreground/70"
                  )}
                  title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className="h-4 w-4" />
                </button>

                {/* Share Action */}
                {file.isShared ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction?.("share", file);
                    }}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold transition-colors shrink-0 outline-none cursor-pointer"
                    title="Manage share"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Shared</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction?.("share", file);
                    }}
                    className="text-muted-foreground/30 hover:text-purple-600 transition-colors shrink-0 outline-none cursor-pointer hover:scale-110"
                    title="Share"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Action Menu (always visible but light, highlights on hover) */}
              <div
                className="text-muted-foreground/30 hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <FileContextMenu file={file} onAction={onAction} trigger="button" />
              </div>
            </div>
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
          <span className="text-muted-foreground text-sm font-light">—</span>
        ) : (
          <span className="text-sm text-muted-foreground">
            {formatFileSize(row.original.size)}
          </span>
        ),
      size: 110,
    },
    {
      accessorKey: "lastModified",
      header: ({ column }) => (
        <SortButton
          label="Modification"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatFileDate(row.original.lastModified)}
        </span>
      ),
      size: 140,
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
      onSelectionChange?.(files.filter((_, i) => next[i]));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  // Calculate totals for footer
  const fileCount = files.filter((f) => f.type === "file").length;
  const folderCount = files.filter((f) => f.type === "directory").length;
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div className="w-full flex flex-col min-h-0 bg-background border rounded-xl overflow-hidden shadow-sm select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-transparent">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-4 text-left font-medium text-muted-foreground whitespace-nowrap"
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
                <td colSpan={columns.length} className="text-center py-20 text-muted-foreground font-light">
                  This folder is empty
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b hover:bg-accent/40 cursor-pointer transition-colors group",
                    row.getIsSelected() && "bg-accent/60 hover:bg-accent/70"
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
                      className="px-4 py-4 align-middle"
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

      {/* Table Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t bg-transparent text-xs font-semibold text-muted-foreground shrink-0">
        <div>
          {fileCount} Files . {folderCount} Folders
        </div>
        <div>{formatFileSize(totalSize)}</div>
      </div>
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
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1.5 hover:text-foreground transition-colors outline-none cursor-pointer font-bold text-muted-foreground"
    >
      <span>{label}</span>
      {sorted === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5 text-primary" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5 text-primary" />
      ) : null}
    </button>
  );
}
