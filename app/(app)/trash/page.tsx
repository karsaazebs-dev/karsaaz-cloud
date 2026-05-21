"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileIcon } from "@/components/files/FileIcon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trash2,
  RefreshCcw,
  AlertTriangle,
  FileX2,
  Loader2,
} from "lucide-react";
import { useTrash, useRestoreTrash, useDeleteTrashItem, useEmptyTrash } from "@/lib/hooks/useVersionsTrash";
import { formatFileSize, formatFileDate } from "@/lib/utils/files";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TrashPage() {
  const { data: items, isLoading, error } = useTrash();
  const restore = useRestoreTrash();
  const deleteItem = useDeleteTrashItem();
  const emptyTrash = useEmptyTrash();
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
        <AlertTriangle className="h-8 w-8" />
        <p className="text-sm">Failed to load trash bin</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-xl font-semibold">Trash bin</h1>
          <p className="text-sm text-muted-foreground">
            {items?.length ?? 0} item{(items?.length ?? 0) !== 1 ? "s" : ""} in trash
          </p>
        </div>
        {(items?.length ?? 0) > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmEmpty(true)}
            disabled={emptyTrash.isPending}
          >
            {emptyTrash.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Empty trash
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!items || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <FileX2 className="h-12 w-12" />
            <p className="text-sm font-medium">Trash is empty</p>
            <p className="text-xs">Deleted files will appear here</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Original location
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                  Deleted
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                  Size
                </th>
                <th className="px-4 py-3 w-32" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-accent/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon
                        file={{
                          id: item.id,
                          fileId: 0,
                          name: item.name,
                          type: item.type,
                          mimeType: item.mimeType,
                          fileType: "other",
                          size: item.size,
                          lastModified: item.deletedAt,
                          path: item.href,
                          etag: "",
                          permissions: 0,
                          isFavorite: false,
                          isShared: false,
                          shareTypes: [],
                          tags: [],
                          hasPreview: false,
                        }}
                        size="sm"
                      />
                      <span className="font-medium truncate max-w-xs">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <span className="text-xs truncate max-w-[200px] block">
                      {item.originalLocation || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                    {formatFileDate(item.deletedAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                    {item.type === "directory" ? "—" : formatFileSize(item.size)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => restore.mutate({ href: item.href, filename: item.name })}
                        disabled={restore.isPending}
                        title="Restore"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Restore
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteItem.mutate(item.href)}
                        disabled={deleteItem.isPending}
                        title="Delete permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Empty trash confirmation */}
      <AlertDialog open={confirmEmpty} onOpenChange={setConfirmEmpty}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {items?.length} items in the trash.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmEmpty(false);
                emptyTrash.mutate();
              }}
            >
              Empty trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
