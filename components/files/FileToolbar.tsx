"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  List,
  Grid3X3,
  Plus,
  Upload,
  FolderPlus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  SortAsc,
} from "lucide-react";
import { useUIStore } from "@/lib/stores/ui.store";
import type { FileSortField } from "@/lib/types/file.types";

interface FileToolbarProps {
  onNewFolder: () => void;
  onUpload: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
}

const sortOptions: { label: string; value: FileSortField }[] = [
  { label: "Name", value: "name" },
  { label: "Size", value: "size" },
  { label: "Modified", value: "lastModified" },
  { label: "Type", value: "mimeType" },
];

export function FileToolbar({
  onNewFolder,
  onUpload,
  selectedCount,
  onDeleteSelected,
}: FileToolbarProps) {
  const {
    fileViewMode,
    setFileViewMode,
    fileSortField,
    fileSortDirection,
    setFileSortField,
    setFileSortDirection,
  } = useUIStore();

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-background">
      {/* Left: action buttons */}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onUpload} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>

        <Button size="sm" variant="outline" onClick={onNewFolder} className="gap-2">
          <FolderPlus className="h-4 w-4" />
          New folder
        </Button>

        {selectedCount > 0 && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onDeleteSelected}
            className="gap-2"
          >
            Delete {selectedCount} item{selectedCount !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      <div className="flex-1" />

      {/* Right: sort + view toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <SortAsc className="h-4 w-4" />
            Sort: {sortOptions.find((o) => o.value === fileSortField)?.label}
            {fileSortDirection === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {sortOptions.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => {
                if (fileSortField === opt.value) {
                  setFileSortDirection(fileSortDirection === "asc" ? "desc" : "asc");
                } else {
                  setFileSortField(opt.value);
                  setFileSortDirection("asc");
                }
              }}
            >
              {opt.label}
              {fileSortField === opt.value &&
                (fileSortDirection === "asc" ? (
                  <ArrowUp className="ml-auto h-3 w-3" />
                ) : (
                  <ArrowDown className="ml-auto h-3 w-3" />
                ))}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View toggle */}
      <div className="flex items-center rounded-md border">
        <Button
          variant={fileViewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8 rounded-r-none border-r"
          onClick={() => setFileViewMode("list")}
          aria-label="List view"
          aria-pressed={fileViewMode === "list"}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={fileViewMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8 rounded-l-none"
          onClick={() => setFileViewMode("grid")}
          aria-label="Grid view"
          aria-pressed={fileViewMode === "grid"}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
