"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Download,
  Pencil,
  Copy,
  Scissors,
  Trash2,
  Share2,
  StarOff,
  Info,
  FolderOpen,
  FileEdit,
  Bell,
  MessageSquare,
} from "lucide-react";
import { StarIcon } from "@/components/icons/CustomIcons";
import type { KarsaazFile } from "@/lib/types/file.types";
import { isOfficeFile } from "@/lib/utils/officeFiles";

interface FileContextMenuProps {
  file: KarsaazFile;
  onAction?: (action: string, file: KarsaazFile) => void;
  trigger?: "button" | "contextmenu";
}

export function FileContextMenu({
  file,
  onAction,
  trigger = "button",
}: FileContextMenuProps) {
  function handle(action: string) {
    onAction?.(action, file);
  }

  const menuContent = (
    <DropdownMenuContent align="end" className="w-48">
      {file.type === "directory" ? (
        <DropdownMenuItem onClick={() => handle("open")}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Open
        </DropdownMenuItem>
      ) : isOfficeFile(file.name) ? (
        <>
          <DropdownMenuItem onClick={() => handle("office")}>
            <FileEdit className="mr-2 h-4 w-4" />
            Open in Office
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handle("download")}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
        </>
      ) : (
        <DropdownMenuItem onClick={() => handle("download")}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
      )}

      <DropdownMenuItem onClick={() => handle("details")}>
        <Info className="mr-2 h-4 w-4" />
        Details
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => handle("comments")}>
        <MessageSquare className="mr-2 h-4 w-4" />
        Comments
      </DropdownMenuItem>

      {file.type !== "directory" && (
        <DropdownMenuItem onClick={() => handle("reminder")}>
          <Bell className="mr-2 h-4 w-4" />
          Set reminder
        </DropdownMenuItem>
      )}

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={() => handle("rename")}>
        <Pencil className="mr-2 h-4 w-4" />
        Rename
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => handle("copy")}>
        <Copy className="mr-2 h-4 w-4" />
        Copy
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => handle("move")}>
        <Scissors className="mr-2 h-4 w-4" />
        Move
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={() => handle("share")}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </DropdownMenuItem>

      <DropdownMenuItem onClick={() => handle("favorite")}>
        {file.isFavorite ? (
          <>
            <StarOff className="mr-2 h-4 w-4" />
            Remove from favorites
          </>
        ) : (
          <>
            <StarIcon className="mr-2 h-4 w-4" />
            Add to favorites
          </>
        )}
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={() => handle("delete")}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={`Actions for ${file.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      {menuContent}
    </DropdownMenu>
  );
}
