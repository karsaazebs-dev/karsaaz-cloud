"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Copy, Scissors, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { KarsaazFile } from "@/lib/types/file.types";

interface BulkActionBarProps {
  selectedFiles: KarsaazFile[];
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onMoveSelected: () => void;
  onCopySelected: () => void;
  onDownloadSelected: () => void;
}

export function BulkActionBar({
  selectedFiles,
  onClearSelection,
  onDeleteSelected,
  onMoveSelected,
  onCopySelected,
  onDownloadSelected,
}: BulkActionBarProps) {
  const count = selectedFiles.length;
  const hasFiles = selectedFiles.some((f) => f.type !== "directory");

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-2 px-4 py-3",
            "rounded-xl border bg-background/95 backdrop-blur-sm shadow-xl",
            "min-w-[320px]"
          )}
        >
          {/* Count badge */}
          <span className="text-sm font-medium text-foreground mr-1">
            {count} selected
          </span>

          <div className="h-4 w-px bg-border mx-1" />

          {hasFiles && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDownloadSelected}
              className="gap-1.5 text-xs h-8"
              title="Download selected files"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onMoveSelected}
            className="gap-1.5 text-xs h-8"
            title="Move selected items"
          >
            <Scissors className="h-3.5 w-3.5" />
            Move
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onCopySelected}
            className="gap-1.5 text-xs h-8"
            title="Copy selected items"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onDeleteSelected}
            className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete selected items"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            size="icon"
            variant="ghost"
            onClick={onClearSelection}
            className="h-7 w-7"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
