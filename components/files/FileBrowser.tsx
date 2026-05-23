"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useFiles, useFileActions, useCreateFile } from "@/lib/hooks/useFiles";
import { FileList } from "@/components/files/FileList";
import { FileGrid } from "@/components/files/FileGrid";
import { FileBreadcrumbs } from "@/components/files/FileBreadcrumbs";
import { FileToolbar } from "@/components/files/FileToolbar";
import { UploadDropzone } from "@/components/files/UploadDropzone";
import { BulkActionBar } from "@/components/files/BulkActionBar";
import { FileDetailsPanel, type DetailTab } from "@/components/files/FileDetailsPanel";
import { ShareDialog } from "@/components/files/ShareDialog";
import {
  NewFolderDialog,
  NewFileDialog,
  RenameDialog,
  DeleteDialog,
  BulkDeleteDialog,
  MoveDialog,
} from "@/components/files/FileDialogs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/lib/stores/ui.store";
import { buildFilePath, getFileIcon, normalizePath } from "@/lib/utils/files";
import { isOfficeFile } from "@/lib/utils/officeFiles";
import { toast } from "sonner";
import type { KarsaazFile } from "@/lib/types/file.types";
import { useRouter, useSearchParams } from "next/navigation";
import { useRecentFiles } from "@/lib/hooks/useDashboard";
import { Plus, Upload, FolderPlus } from "lucide-react";
import { FileIcon } from "@/components/files/FileIcon";
import { AnimatePresence, motion } from "framer-motion";

type SessionData = { username?: string } & Record<string, unknown>;

interface FileBrowserProps {
  initialPath?: string;
}

type DialogType = "newFolder" | "newWord" | "newExcel" | "rename" | "delete" | "upload" | "bulkDelete" | "move" | "copy" | "share" | null;

interface DialogState {
  type: DialogType;
  file?: KarsaazFile;
}

export function FileBrowser({ initialPath = "/" }: FileBrowserProps) {
  const { data: session } = useSession();
  const username = (session as SessionData | null)?.username as string | undefined;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathParam = searchParams.get("path") || "/";

  const [currentPath, setCurrentPath] = useState(initialPath);
  const [dialog, setDialog] = useState<DialogState>({ type: null });
  const [selectedFiles, setSelectedFiles] = useState<KarsaazFile[]>([]);
  const [detailsFile, setDetailsFile] = useState<KarsaazFile | null>(null);
  const [detailsTab, setDetailsTab] = useState<DetailTab>("activity");

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [peopleFilter, setPeopleFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  const [tagsVersion, setTagsVersion] = useState(0);
  const [availableTags, setAvailableTags] = useState<{ name: string; colorClass: string }[]>([]);

  useEffect(() => {
    const savedAvailable = localStorage.getItem("karsaaz-all-tags");
    if (savedAvailable) {
      try {
        setAvailableTags(JSON.parse(savedAvailable));
      } catch (e) {}
    } else {
      const defaultTags = [
        { name: "Red", colorClass: "bg-red-500" },
        { name: "Orange", colorClass: "bg-orange-500" },
        { name: "Yellow", colorClass: "bg-yellow-500" },
        { name: "Blue", colorClass: "bg-blue-500" },
      ];
      setAvailableTags(defaultTags);
      localStorage.setItem("karsaaz-all-tags", JSON.stringify(defaultTags));
    }
  }, [tagsVersion]);

  useEffect(() => {
    setCurrentPath(pathParam);
    setSelectedFiles([]);
    setDetailsFile(null);
  }, [pathParam]);

  const { fileViewMode, setFileViewMode, fileSortField, fileSortDirection } = useUIStore();

  const davPath = username ? buildFilePath(username, currentPath) : null;

  const { data: filesRaw, isLoading, error } = useFiles(davPath ?? "");
  const actions = useFileActions(davPath ?? "");
  const createFileMutation = useCreateFile(davPath ?? "");

  // Load recently opened files
  const { data: recentFiles, isLoading: isRecentLoading } = useRecentFiles(10);

  const files = useMemo(() => {
    if (!filesRaw) return [];

    let savedTagsMap: Record<string, string[]> = {};
    let savedFavsMap: Record<string, any> = {};
    if (typeof window !== "undefined") {
      const savedTags = localStorage.getItem("karsaaz-file-tags");
      if (savedTags) {
        try {
          savedTagsMap = JSON.parse(savedTags);
        } catch (e) {}
      }
      const savedFavs = localStorage.getItem("karsaaz-favorites");
      if (savedFavs) {
        try {
          savedFavsMap = JSON.parse(savedFavs);
        } catch (e) {}
      }
    }

    const hydrated = filesRaw.map((f) => ({
      ...f,
      tags: savedTagsMap[f.name] || [],
      isFavorite: !!savedFavsMap[normalizePath(f.path)],
    }));

    return hydrated.sort((a, b) => {
      if (a.type === "directory" && b.type !== "directory") return -1;
      if (a.type !== "directory" && b.type === "directory") return 1;
      const dir = fileSortDirection === "asc" ? 1 : -1;
      const field = fileSortField as keyof KarsaazFile;
      const av = a[field] ?? "";
      const bv = b[field] ?? "";
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filesRaw, fileSortField, fileSortDirection, tagsVersion]);

  // Apply filters dynamically
  const filteredFiles = useMemo(() => {
    let result = files;

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }

    // Type filter
    if (typeFilter !== "all") {
      if (typeFilter === "folder") {
        result = result.filter((f) => f.type === "directory");
      } else {
        result = result.filter((f) => {
          if (f.type === "directory") return false;
          return getFileIcon(f) === typeFilter;
        });
      }
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      result = result.filter((f) => {
        const modified = new Date(f.lastModified);
        const diffMs = now.getTime() - modified.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (dateFilter === "today") return diffDays <= 1;
        if (dateFilter === "7days") return diffDays <= 7;
        if (dateFilter === "30days") return diffDays <= 30;
        return true;
      });
    }

    // People filter
    if (peopleFilter !== "all") {
      if (peopleFilter === "shared") {
        result = result.filter((f) => f.isShared);
      } else if (peopleFilter === "mine") {
        result = result.filter((f) => !f.isShared);
      }
    }

    // Tag filter
    if (tagFilter !== "all") {
      result = result.filter((f) => Array.isArray(f.tags) && f.tags.includes(tagFilter));
    }

    return result;
  }, [files, searchQuery, typeFilter, dateFilter, peopleFilter, tagFilter]);

  // Bulk selection calculations
  const isAllSelected =
    filteredFiles.length > 0 &&
    selectedFiles.length === filteredFiles.length;

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(filteredFiles);
    } else {
      setSelectedFiles([]);
    }
  };

  function closeDialog() {
    setDialog({ type: null });
  }

  function handleNavigate(file: KarsaazFile) {
    if (file.type === "directory") {
      const nextPath = `${currentPath}/${file.name}`.replace("//", "/");
      router.push(`/files?path=${encodeURIComponent(nextPath)}`);
      setSelectedFiles([]);
      setDetailsFile(null);
    } else {
      setDetailsTab("activity");
      setDetailsFile(file);
    }
  }

  function handleAction(action: string, file: KarsaazFile) {
    switch (action) {
      case "office":
        if (username) {
          const filePath = `${currentPath}/${file.name}`.replace("//", "/");
          router.push(`/office?path=${encodeURIComponent(filePath)}`);
        }
        break;
      case "open": {
        const nextPath = `${currentPath}/${file.name}`.replace("//", "/");
        router.push(`/files?path=${encodeURIComponent(nextPath)}`);
        setSelectedFiles([]);
        setDetailsFile(null);
        break;
      }
      case "download":
        if (username) {
          const path = buildFilePath(username, `${currentPath}/${file.name}`);
          window.open(`/api/proxy${path}`, "_blank");
        }
        break;
      case "rename":
        setDialog({ type: "rename", file });
        break;
      case "delete":
        setDialog({ type: "delete", file });
        break;
      case "move":
        setDialog({ type: "move", file });
        break;
      case "copy":
        setDialog({ type: "copy", file });
        break;
      case "details":
        setDetailsTab("activity");
        setDetailsFile(file === detailsFile ? null : file);
        break;
      case "comments":
        setDetailsTab("activity");
        setDetailsFile(file);
        break;
      case "reminder":
        setDetailsTab("activity");
        setDetailsFile(file);
        break;
      case "share":
        setDialog({ type: "share", file });
        break;
      case "favorite":
        if (username) {
          const path = buildFilePath(username, `${currentPath}/${file.name}`);
          actions.toggleFavorite.mutate({ filePath: path, favorite: !file.isFavorite });
        }
        break;
      default:
        break;
    }
  }

  async function handleCreateFolder(name: string) {
    if (!davPath) return;
    await actions.createFolder.mutateAsync(name);
  }

  async function handleCreateFile(name: string) {
    if (!davPath) return;
    const mimeType = name.endsWith(".xlsx")
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    await createFileMutation.mutateAsync({ name, mimeType });
  }

  async function handleRename(newName: string) {
    if (!dialog.file || !username) return;
    const from = buildFilePath(username, `${currentPath}/${dialog.file.name}`);
    const to = buildFilePath(username, `${currentPath}/${newName}`);
    await actions.move.mutateAsync({ from, to });
  }

  async function handleDelete() {
    if (!dialog.file || !username) return;
    const path = buildFilePath(username, `${currentPath}/${dialog.file.name}`);
    await actions.deleteFile.mutateAsync(path);
  }

  async function handleMoveOrCopy(destination: string, mode: "move" | "copy") {
    if (!dialog.file || !username) return;
    const from = buildFilePath(username, `${currentPath}/${dialog.file.name}`);
    const to = buildFilePath(username, `${destination}/${dialog.file.name}`);
    if (mode === "move") {
      await actions.move.mutateAsync({ from, to });
    } else {
      await actions.copy.mutateAsync({ from, to });
    }
  }

  async function handleBulkDelete() {
    if (!username) return;
    for (const file of selectedFiles) {
      const path = buildFilePath(username, `${currentPath}/${file.name}`);
      await actions.deleteFile.mutateAsync(path);
    }
    setSelectedFiles([]);
    toast.success(`Deleted ${selectedFiles.length} items`);
  }

  async function handleBulkDownload() {
    if (!username) return;
    for (const file of selectedFiles) {
      if (file.type !== "directory") {
        const path = buildFilePath(username, `${currentPath}/${file.name}`);
        const a = document.createElement("a");
        a.href = `/api/proxy${path}`;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  async function handleBulkMove(destination: string) {
    if (!username) return;
    for (const file of selectedFiles) {
      const from = buildFilePath(username, `${currentPath}/${file.name}`);
      const to = buildFilePath(username, `${destination}/${file.name}`);
      await actions.move.mutateAsync({ from, to });
    }
    setSelectedFiles([]);
    toast.success(`Moved ${selectedFiles.length} items`);
  }

  async function handleBulkCopy(destination: string) {
    if (!username) return;
    for (const file of selectedFiles) {
      const from = buildFilePath(username, `${currentPath}/${file.name}`);
      const to = buildFilePath(username, `${destination}/${file.name}`);
      await actions.copy.mutateAsync({ from, to });
    }
    setSelectedFiles([]);
    toast.success(`Copied ${selectedFiles.length} items`);
  }

  const activeDetailsFile = useMemo(() => {
    if (!detailsFile) return null;
    const found = files.find((f) => f.path === detailsFile.path);
    if (found) return found;

    let isFavorite = detailsFile.isFavorite;
    if (typeof window !== "undefined") {
      const savedFavs = localStorage.getItem("karsaaz-favorites");
      if (savedFavs) {
        try {
          const savedFavsMap = JSON.parse(savedFavs);
          isFavorite = !!savedFavsMap[normalizePath(detailsFile.path)];
        } catch (e) {}
      }
    }
    return { ...detailsFile, isFavorite };
  }, [detailsFile, files]);

  const detailsFilePath = activeDetailsFile && username
    ? buildFilePath(username, `${currentPath}/${activeDetailsFile.name}`)
    : null;

  const folderName = currentPath === "/" ? "All files" : decodeURIComponent(currentPath.split("/").pop() || "");

  if (!username) return null;

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-background relative"
      style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 600 }}
    >
      {/* Scrollable Layout Content */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0 select-none">
        
        {/* Breadcrumbs (flat & borderless) */}
        {currentPath !== "/" && (
          <div className="px-6 pt-6 shrink-0 flex items-center">
            <FileBreadcrumbs
              path={currentPath}
              onNavigate={(p) => {
                router.push(`/files?path=${encodeURIComponent(p)}`);
                setSelectedFiles([]);
                setDetailsFile(null);
              }}
            />
          </div>
        )}

        {/* Page Header (Title + Description + Standalone "+ New" dropdown) */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 px-6 pt-4 pb-6 bg-background shrink-0">
          <div className="space-y-1.5 flex-1 pr-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{folderName}</h1>
            {/* <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Here you can add a description or any other info relevant to the folder. It will show as a &quot;Readme.md&quot; and in the web interface also embedded nicely up at the top.
            </p> */}
          </div>
          
          <div className="flex items-center shrink-0 self-end md:self-start pt-1">
            {/* "+ New" Gradient Button Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-sm cursor-pointer outline-none shrink-0">
                  <Plus className="h-4.5 w-4.5 stroke-[3]" />
                  <span>New</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1">
                <DropdownMenuItem onClick={() => setDialog({ type: "upload" })} className="gap-2.5 cursor-pointer font-semibold">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span>Upload files</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog({ type: "newFolder" })} className="gap-2.5 cursor-pointer font-semibold">
                  <FolderPlus className="h-4 w-4 text-muted-foreground" />
                  <span>New folder</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog({ type: "newWord" })} className="gap-2.5 cursor-pointer font-semibold">
                  <span className="text-base leading-none">📄</span>
                  <span>New Word document</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog({ type: "newExcel" })} className="gap-2.5 cursor-pointer font-semibold">
                  <span className="text-base leading-none">📊</span>
                  <span>New Excel spreadsheet</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Recently Opened Section (visible at root folder path) */}
        {currentPath === "/" && (
          <div className="px-6 py-6 border-t border-b bg-muted/5 shrink-0 select-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-foreground">Recently Opened</h2>
              <button 
                onClick={() => {
                  toast.info("Showing all files sorted by modification date");
                }}
                className="text-xs font-bold text-black hover:underline outline-none cursor-pointer"
              >
                View All
              </button>
            </div>
            {isRecentLoading ? (
              <div className="flex gap-8 overflow-x-auto pb-2 scrollbar-thin">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-[200px] rounded-lg shrink-0" />
                ))}
              </div>
            ) : recentFiles && recentFiles.length > 0 ? (
              <div className="flex gap-10 overflow-x-auto pb-2 scrollbar-thin">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => handleNavigate(file)}
                    className="flex items-center gap-3 shrink-0 cursor-pointer group py-1"
                  >
                    <div className="p-2.5 bg-muted/65 rounded-xl group-hover:bg-accent transition-colors shrink-0">
                      <FileIcon file={file} size="sm" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground group-hover:text-[#A855F7] transition-colors max-w-[180px]" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Recently edited</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic font-light">No recently opened files</p>
            )}
          </div>
        )}

        {/* Sticky FileToolbar */}
        <div className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
          <FileToolbar
            selectedCount={selectedFiles.length}
            onDeleteSelected={() => setDialog({ type: "bulkDelete" })}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            peopleFilter={peopleFilter}
            setPeopleFilter={setPeopleFilter}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            availableTags={availableTags}
            onCreateTag={(name, colorClass) => {
              const newTag = { name, colorClass };
              const next = [...availableTags, newTag];
              setAvailableTags(next);
              localStorage.setItem("karsaaz-all-tags", JSON.stringify(next));
              setTagsVersion((v) => v + 1);
            }}
            fileViewMode={fileViewMode}
            setFileViewMode={setFileViewMode}
            isAllSelected={isAllSelected}
            onToggleSelectAll={handleToggleSelectAll}
          />
        </div>

        {/* Main Area: Files list/grid */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <p className="font-semibold text-destructive">Failed to load files</p>
              <p className="text-xs">{String(error)}</p>
            </div>
          ) : fileViewMode === "grid" ? (
            <FileGrid
              files={filteredFiles}
              selectedFiles={selectedFiles}
              onNavigate={handleNavigate}
              onSelectionChange={setSelectedFiles}
              onAction={handleAction}
            />
          ) : (
            <FileList
              files={filteredFiles}
              selectedFiles={selectedFiles}
              onNavigate={handleNavigate}
              onSelectionChange={setSelectedFiles}
              onAction={handleAction}
            />
          )}
        </div>
      </div>

      {/* Blur backdrop – shown when drawer is open */}
      <AnimatePresence>
        {detailsFile && (
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 backdrop-blur-[2px] bg-black/10"
            onClick={() => setDetailsFile(null)}
          />
        )}
      </AnimatePresence>

      {/* Details panel – absolute overlay sliding in from the right */}
      <FileDetailsPanel
        file={activeDetailsFile}
        filePath={detailsFilePath}
        initialTab={detailsTab}
        onClose={() => setDetailsFile(null)}
        onAction={handleAction}
        onTagsChange={() => setTagsVersion((v) => v + 1)}
      />

      {/* Floating bulk action bar */}
      <BulkActionBar
        selectedFiles={selectedFiles}
        onClearSelection={() => setSelectedFiles([])}
        onDeleteSelected={() => setDialog({ type: "bulkDelete" })}
        onMoveSelected={() => setDialog({ type: "move" })}
        onCopySelected={() => setDialog({ type: "copy" })}
        onDownloadSelected={handleBulkDownload}
      />

      {/* ── Dialogs ── */}
      <NewFolderDialog
        open={dialog.type === "newFolder"}
        onOpenChange={(v) => !v && closeDialog()}
        onConfirm={handleCreateFolder}
      />

      <NewFileDialog
        open={dialog.type === "newWord"}
        onOpenChange={(v) => !v && closeDialog()}
        fileType="word"
        onConfirm={handleCreateFile}
      />

      <NewFileDialog
        open={dialog.type === "newExcel"}
        onOpenChange={(v) => !v && closeDialog()}
        fileType="excel"
        onConfirm={handleCreateFile}
      />

      {dialog.file && (
        <>
          <RenameDialog
            open={dialog.type === "rename"}
            onOpenChange={(v) => !v && closeDialog()}
            currentName={dialog.file.name}
            onConfirm={handleRename}
          />
          <DeleteDialog
            open={dialog.type === "delete"}
            onOpenChange={(v) => !v && closeDialog()}
            fileName={dialog.file.name}
            onConfirm={handleDelete}
          />
          <MoveDialog
            open={dialog.type === "move"}
            onOpenChange={(v) => !v && closeDialog()}
            sourceName={dialog.file.name}
            currentPath={currentPath}
            onConfirm={(dest) => handleMoveOrCopy(dest, "move")}
            mode="move"
          />
          <MoveDialog
            open={dialog.type === "copy"}
            onOpenChange={(v) => !v && closeDialog()}
            sourceName={dialog.file.name}
            currentPath={currentPath}
            onConfirm={(dest) => handleMoveOrCopy(dest, "copy")}
            mode="copy"
          />
          {dialog.type === "share" && (
            <ShareDialog
              open
              onOpenChange={(v) => !v && closeDialog()}
              file={dialog.file}
              filePath={buildFilePath(username, `${currentPath}/${dialog.file.name}`)}
            />
          )}
        </>
      )}

      {/* Bulk move/copy (no specific file, uses selectedFiles) */}
      {!dialog.file && dialog.type === "move" && (
        <MoveDialog
          open
          onOpenChange={(v) => !v && closeDialog()}
          sourceName={`${selectedFiles.length} items`}
          currentPath={currentPath}
          onConfirm={(dest) => handleBulkMove(dest)}
          mode="move"
        />
      )}
      {!dialog.file && dialog.type === "copy" && (
        <MoveDialog
          open
          onOpenChange={(v) => !v && closeDialog()}
          sourceName={`${selectedFiles.length} items`}
          currentPath={currentPath}
          onConfirm={(dest) => handleBulkCopy(dest)}
          mode="copy"
        />
      )}

      <BulkDeleteDialog
        open={dialog.type === "bulkDelete"}
        onOpenChange={(v) => !v && closeDialog()}
        count={selectedFiles.length}
        onConfirm={handleBulkDelete}
      />

      {/* Upload dialog */}
      <Dialog
        open={dialog.type === "upload"}
        onOpenChange={(v) => !v && closeDialog()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload files</DialogTitle>
          </DialogHeader>
          <UploadDropzone
            currentPath={currentPath}
            onClose={closeDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
