"use client";

import { useState, useEffect } from "react";
import { FileIcon } from "@/components/files/FileIcon";
import { FileContextMenu } from "@/components/files/FileContextMenu";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Share2 } from "lucide-react";
import { formatFileDate } from "@/lib/utils/files";
import { cn } from "@/lib/utils";
import type { KarsaazFile } from "@/lib/types/file.types";

interface FileGridProps {
  files: KarsaazFile[];
  selectedFiles?: KarsaazFile[];
  onNavigate: (file: KarsaazFile) => void;
  onSelectionChange?: (selected: KarsaazFile[]) => void;
  onAction?: (action: string, file: KarsaazFile) => void;
}

export function FileGrid({
  files,
  selectedFiles = [],
  onNavigate,
  onSelectionChange,
  onAction,
}: FileGridProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sync internal selected state when selectedFiles prop updates
  useEffect(() => {
    setSelected(new Set(selectedFiles.map((f) => f.id)));
  }, [selectedFiles]);

  function toggleSelect(fileId: string, file: KarsaazFile) {
    const next = new Set(selected);
    if (next.has(fileId)) {
      next.delete(fileId);
    } else {
      next.add(fileId);
    }
    setSelected(next);
    onSelectionChange?.(files.filter((f) => next.has(f.id)));
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
        This folder is empty
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-1">
      {files.map((file) => {
        const isSelected = selected.has(file.id);
        return (
          <div
            key={file.id}
            className={cn(
              "relative group rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/40",
              isSelected && "border-primary bg-primary/5 shadow-md"
            )}
            onClick={() => onNavigate(file)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onNavigate(file);
              if (e.key === " ") {
                e.preventDefault();
                toggleSelect(file.id, file);
              }
            }}
            tabIndex={0}
            role="gridcell"
            aria-selected={isSelected}
          >
            {/* Selection checkbox */}
            <div
              className={cn(
                "absolute top-2 left-2 transition-opacity",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleSelect(file.id, file);
              }}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelect(file.id, file)}
                aria-label={`Select ${file.name}`}
                className="bg-background"
              />
            </div>

            {/* Context menu */}
            <div
              className={cn(
                "absolute top-2 right-2 transition-opacity",
                "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <FileContextMenu file={file} onAction={onAction} trigger="button" />
            </div>

            {/* Icon */}
            <div className="flex items-center justify-center h-14 mb-2">
              <FileIcon file={file} size="lg" />
            </div>

            {/* Name */}
            <p className="text-xs font-medium text-center truncate leading-tight" title={file.name}>
              {file.name}
            </p>

            {/* Meta */}
            <p className="text-[10px] text-muted-foreground text-center mt-0.5 truncate">
              {formatFileDate(file.lastModified)}
            </p>

            {/* Badges */}
            {(file.isFavorite || file.isShared) && (
              <div className="flex justify-center gap-1 mt-1">
                {file.isFavorite && (
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                )}
                {file.isShared && (
                  <Share2 className="h-3 w-3 text-blue-500" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
