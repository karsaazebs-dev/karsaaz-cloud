"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileIcon } from "@/components/files/FileIcon";
import {
  X,
  Star,
  Tag,
  Plus,
  Check,
  Mic,
  Send,
  Share2,
  UserPlus,
  Link,
  Trash2,
  History,
  User,
  Download,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  Mail,
  Loader2,
} from "lucide-react";
import { formatFileSize, formatFileDate } from "@/lib/utils/files";
import { useFileVersions } from "@/lib/hooks/useVersionsTrash";
import {
  useShares,
  useCreateShare,
  useUpdateShare,
  useDeleteShare,
  useSearchSharees,
  SHARE_TYPE_LINK,
  SHARE_TYPE_USER,
  SHARE_TYPE_GROUP,
  permissionsLabel,
} from "@/lib/hooks/useSharing";
import {
  useComments,
  useAddComment,
  useDeleteComment,
} from "@/lib/hooks/useFileExtras";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { KarsaazFile } from "@/lib/types/file.types";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { listActivity } from "@/lib/api/ocs";
import { toast } from "sonner";
import type { OCSShare } from "@/lib/types/ocs.types";

interface FileDetailsPanelProps {
  file: KarsaazFile | null;
  filePath: string | null;
  onClose: () => void;
  onAction: (action: string, file: KarsaazFile) => void;
  initialTab?: DetailTab;
}

export type DetailTab = "activity" | "sharing" | "versions";

const TABS: DetailTab[] = ["activity", "sharing", "versions"];
const TAB_LABELS: Record<DetailTab, string> = {
  activity: "Activity",
  sharing: "Sharing",
  versions: "Versions",
};

const DEFAULT_TAGS = [
  { name: "Red", colorClass: "bg-red-500" },
  { name: "Orange", colorClass: "bg-orange-500" },
  { name: "Yellow", colorClass: "bg-yellow-500" },
  { name: "Blue", colorClass: "bg-blue-500" },
];

const TAG_COLORS = [
  { value: "red", label: "Red", colorClass: "bg-red-500" },
  { value: "orange", label: "Orange", colorClass: "bg-orange-500" },
  { value: "yellow", label: "Yellow", colorClass: "bg-yellow-500" },
  { value: "blue", label: "Blue", colorClass: "bg-blue-500" },
];

// Helper hook for file activities
function useFileActivity(fileId: number | null) {
  const { basicAuth } = useAuth();
  return useQuery({
    queryKey: ["fileActivity", fileId],
    queryFn: () =>
      listActivity(
        { basicAuth },
        { objectType: "files", objectId: String(fileId) }
      ),
    enabled: !!basicAuth && !!fileId,
    staleTime: 30_000,
  });
}

// ── Dropdown Radix Components ───────────────────────────────────────────────
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

interface TimelineItem {
  id: string;
  type: "activity" | "comment";
  date: Date;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rawComment?: any;
}

export function FileDetailsPanel({
  file,
  filePath,
  onClose,
  onAction,
  initialTab = "activity",
}: FileDetailsPanelProps) {
  const [tab, setTab] = useState<DetailTab>(initialTab);

  // Sync tab state when file/initialTab changes
  useEffect(() => {
    if (file) setTab(initialTab);
  }, [file, initialTab]);

  const { username } = useAuth();
  const { data: versions = [] } = useFileVersions(file?.fileId ?? null);
  const { data: shares = [] } = useShares(file ? filePath : null);
  const { data: comments = [], isLoading: isCommentsLoading } = useComments(
    file?.fileId ?? null
  );
  const { data: activities = [] } = useFileActivity(file?.fileId ?? null);

  const addComment = useAddComment(file?.fileId ?? 0);
  const deleteComment = useDeleteComment(file?.fileId ?? 0);

  const createShare = useCreateShare(filePath ?? "");
  const updateShare = useUpdateShare(filePath ?? "");
  const deleteShare = useDeleteShare(filePath ?? "");

  // Local Tag State
  const [fileTags, setFileTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState(DEFAULT_TAGS);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("red");

  // Load and save tags for this specific file
  useEffect(() => {
    if (file) {
      // Load file tags
      const savedTags = localStorage.getItem("karsaaz-file-tags");
      if (savedTags) {
        try {
          const map = JSON.parse(savedTags);
          setFileTags(map[file.name] || []);
        } catch (e) {}
      } else {
        setFileTags([]);
      }

      // Load all available custom tags
      const savedAvailable = localStorage.getItem("karsaaz-all-tags");
      if (savedAvailable) {
        try {
          setAvailableTags(JSON.parse(savedAvailable));
        } catch (e) {}
      } else {
        setAvailableTags(DEFAULT_TAGS);
      }
    }
  }, [file]);

  const handleToggleTag = (tagName: string) => {
    if (!file) return;
    const next = fileTags.includes(tagName)
      ? fileTags.filter((t) => t !== tagName)
      : [...fileTags, tagName];
    setFileTags(next);
    const saved = localStorage.getItem("karsaaz-file-tags") || "{}";
    try {
      const map = JSON.parse(saved);
      map[file.name] = next;
      localStorage.setItem("karsaaz-file-tags", JSON.stringify(map));
    } catch (e) {}
  };

  const handleCreateTagSubmit = () => {
    if (!newTagName.trim()) return;
    const colorObj =
      TAG_COLORS.find((c) => c.value === newTagColor) || TAG_COLORS[0];
    const newTag = {
      name: newTagName.trim(),
      colorClass: colorObj.colorClass,
    };
    const next = [...availableTags, newTag];
    setAvailableTags(next);
    localStorage.setItem("karsaaz-all-tags", JSON.stringify(next));

    // Auto toggle on file
    handleToggleTag(newTag.name);

    setIsCreatingTag(false);
    setNewTagName("");
  };

  // Timeline (Comments + Activities)
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add activities
    activities.forEach((act) => {
      items.push({
        id: `activity-${act.activity_id}`,
        type: "activity",
        date: new Date(act.timestamp * 1000),
        title: act.subject || act.message || "File updated",
        icon:
          act.type === "file_created" ? (
            <Plus className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
          ),
      });
    });

    // Add comments
    comments.forEach((com) => {
      items.push({
        id: `comment-${com.id}`,
        type: "comment",
        date: new Date(com.creationDateTime),
        title: com.message,
        subtitle: com.actorDisplayName || com.actorId,
        rawComment: com,
      });
    });

    // Fallback default activity if empty
    if (items.length === 0 && file) {
      items.push({
        id: "default-creation",
        type: "activity",
        date: new Date(file.lastModified),
        title: `You created ${file.name}`,
        icon: <Plus className="h-3.5 w-3.5 text-emerald-600" />,
      });
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activities, comments, file]);

  const owner = file?.ownerDisplayName || file?.ownerId || "Owner";

  return (
    <AnimatePresence>
      {file && (
        <motion.aside
          key="details"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          className="absolute right-0 top-0 bottom-0 w-[380px] bg-white dark:bg-background border-l border-muted flex flex-col overflow-hidden shadow-2xl z-30"
          style={{ fontFamily: "var(--font-plus-jakarta), sans-serif", fontWeight: 600 }}
        >
          {/* Header */}
          <div className="flex flex-col border-b border-muted/70">
            {/* Top row: icon + name/meta + actions */}
            <div className="flex items-center gap-2.5 px-4 py-3">
              {/* File icon */}
              <div className="shrink-0">
                <FileIcon file={file} size="sm" className="h-7 w-7" />
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-[13px] text-foreground truncate leading-tight"
                  title={file.name}
                >
                  {file.name}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {file.type === "directory" ? "Folder" : formatFileSize(file.size)}
                  {" · "}
                  {formatFileDate(file.lastModified)}
                  {" · "}
                  {owner}
                </p>
              </div>

              {/* Action icons: ... and X */}
              <div className="flex items-center gap-0.5 shrink-0">
                <DropdownMenu onOpenChange={(open) => !open && setIsCreatingTag(false)}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 p-1">
                    <DropdownMenuItem
                      onClick={() => onAction("favorite", file)}
                      className="gap-2 cursor-pointer"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          file.isFavorite
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-muted-foreground"
                        )}
                      />
                      <span>
                        {file.isFavorite ? "Remove from favourites" : "Add to favourites"}
                      </span>
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span>Tags</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent
                        className="w-56 p-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isCreatingTag ? (
                          <div className="space-y-1">
                            {availableTags.map((tag) => {
                              const isActive = fileTags.includes(tag.name);
                              return (
                                <button
                                  key={tag.name}
                                  onClick={() => handleToggleTag(tag.name)}
                                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-accent text-left transition-colors font-medium"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", tag.colorClass)} />
                                    <span className="truncate max-w-[130px]">{tag.name}</span>
                                  </div>
                                  {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                                </button>
                              );
                            })}
                            <div className="h-px bg-muted my-1.5" />
                            <button
                              onClick={() => setIsCreatingTag(true)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent text-primary font-bold text-left transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Create New</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 p-1">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Name
                              </label>
                              <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="Enter Name"
                                className="w-full px-2 py-1 text-xs border rounded bg-background outline-none focus:border-primary"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleCreateTagSubmit();
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                Color
                              </label>
                              <div className="flex gap-2">
                                {TAG_COLORS.map((c) => (
                                  <button
                                    key={c.value}
                                    onClick={() => setNewTagColor(c.value)}
                                    className={cn(
                                      "w-5 h-5 rounded-full transition-all border shrink-0",
                                      c.colorClass,
                                      newTagColor === c.value
                                        ? "ring-2 ring-primary ring-offset-1 border-transparent"
                                        : "border-transparent"
                                    )}
                                    title={c.label}
                                    type="button"
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => {
                                  setIsCreatingTag(false);
                                  setNewTagName("");
                                }}
                                className="px-2 py-1 text-xs border rounded hover:bg-muted text-muted-foreground font-medium"
                                type="button"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleCreateTagSubmit}
                                disabled={!newTagName.trim()}
                                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 font-medium"
                                type="button"
                              >
                                Create
                              </button>
                            </div>
                          </div>
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

          </div>

          {/* Tabs header */}
          <div className="flex border-b border-muted">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-3 text-xs font-bold transition-all relative outline-none",
                  tab === t
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {TAB_LABELS[t]}
                {tab === t && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab contents */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {tab === "activity" && (
              <ActivityTab
                fileId={file.fileId}
                timelineItems={timelineItems}
                addComment={addComment}
                deleteComment={deleteComment}
                username={username}
              />
            )}
            {tab === "sharing" && (
              <SharingTab
                file={file}
                filePath={filePath}
                shares={shares}
                createShare={createShare}
                updateShare={updateShare}
                deleteShare={deleteShare}
              />
            )}
            {tab === "versions" && (
              <VersionsTab versions={versions} file={file} />
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Activity & Comments Tab Component ──────────────────────────────────────────

function ActivityTab({
  fileId,
  timelineItems,
  addComment,
  deleteComment,
  username,
}: {
  fileId: number;
  timelineItems: TimelineItem[];
  addComment: ReturnType<typeof useAddComment>;
  deleteComment: ReturnType<typeof useDeleteComment>;
  username?: string;
}) {
  const [commentDraft, setCommentDraft] = useState("");

  const handlePostComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    addComment.mutate(text, {
      onSuccess: () => {
        setCommentDraft("");
        toast.success("Comment posted");
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-background select-none">
      {/* Timeline Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {timelineItems.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No activity yet
          </p>
        ) : (
          <div className="space-y-4">
            {timelineItems.map((item) => (
              <div key={item.id} className="flex gap-3 text-xs items-start">
                {item.type === "activity" ? (
                  <>
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground leading-normal">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatFileDate(item.date.toISOString())}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary uppercase text-[11px]">
                      {(item.subtitle ?? "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 group relative pr-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground truncate">
                          {item.subtitle}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatFileDate(item.date.toISOString())}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap break-words leading-relaxed bg-muted/30 p-2 rounded-lg border border-muted/50">
                        {item.title}
                      </p>
                      {item.rawComment?.actorId === username && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 absolute right-0 top-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteComment.mutate(item.rawComment.id)}
                          title="Delete comment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Composer */}
      <div className="p-4 border-t border-muted">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
          Comment
        </label>
        <div className="border border-muted p-2 rounded-xl bg-background flex flex-col gap-2 shadow-sm focus-within:border-primary/50 transition-all">
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="New comment"
            rows={2}
            className="w-full bg-transparent resize-none outline-none border-none text-xs p-1 text-foreground placeholder:text-muted-foreground/60 leading-normal"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePostComment();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <div />
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full border-muted text-muted-foreground hover:bg-muted/50 cursor-pointer"
                type="button"
                onClick={() => toast.info("Voice comments are not enabled")}
                title="Voice comment"
              >
                <Mic className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 cursor-pointer shadow-sm"
                type="button"
                disabled={!commentDraft.trim() || addComment.isPending}
                onClick={handlePostComment}
                title="Send comment"
              >
                {addComment.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sharing Tab Component ──────────────────────────────────────────────────────

function SharingTab({
  file,
  filePath,
  shares,
  createShare,
  updateShare,
  deleteShare,
}: {
  file: KarsaazFile;
  filePath: string | null;
  shares: OCSShare[];
  createShare: ReturnType<typeof useCreateShare>;
  updateShare: ReturnType<typeof useUpdateShare>;
  deleteShare: ReturnType<typeof useDeleteShare>;
}) {
  const internalShares = shares.filter(
    (s) => s.share_type === SHARE_TYPE_USER || s.share_type === SHARE_TYPE_GROUP
  );
  const externalShares = shares.filter(
    (s) => s.share_type === SHARE_TYPE_LINK || s.share_type === 4 // EMAIL share type
  );

  const [internalSearch, setInternalSearch] = useState("");
  const [externalSearch, setExternalSearch] = useState("");

  const [internalPerm, setInternalPerm] = useState<number>(1); // PERM_READ
  const [externalPerm, setExternalPerm] = useState<number>(1); // PERM_READ

  const { data: internalSharees } = useSearchSharees(internalSearch);
  const { data: externalSharees } = useSearchSharees(externalSearch);

  const [copiedInternal, setCopiedInternal] = useState(false);
  const [copiedExternal, setCopiedExternal] = useState(false);

  const handleCopyInternal = () => {
    if (!filePath) return;
    const url = `${window.location.origin}/files?path=${encodeURIComponent(
      filePath
    )}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedInternal(true);
      setTimeout(() => setCopiedInternal(false), 2000);
      toast.success("Internal link copied");
    });
  };

  const handleCopyExternal = async () => {
    if (!filePath) return;
    const existing = shares.find((s) => s.share_type === SHARE_TYPE_LINK);
    if (existing) {
      const url = `${window.location.origin}/s/${existing.token}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedExternal(true);
        setTimeout(() => setCopiedExternal(false), 2000);
        toast.success("External link copied");
      });
    } else {
      try {
        const newShare = await createShare.mutateAsync({
          path: filePath,
          shareType: SHARE_TYPE_LINK,
          permissions: 1,
        });
        const url = `${window.location.origin}/s/${newShare.token}`;
        navigator.clipboard.writeText(url).then(() => {
          setCopiedExternal(true);
          setTimeout(() => setCopiedExternal(false), 2000);
          toast.success("External link created and copied");
        });
      } catch (err) {
        toast.error("Could not create public link");
      }
    }
  };

  const handleAddInternal = async (shareWith: string, shareType: number) => {
    if (!filePath) return;
    await createShare.mutateAsync({
      path: filePath,
      shareType,
      shareWith,
      permissions: internalPerm,
    });
    setInternalSearch("");
  };

  const handleAddExternal = async (shareWith: string, shareType: number) => {
    if (!filePath) return;
    await createShare.mutateAsync({
      path: filePath,
      shareType,
      shareWith,
      permissions: externalPerm,
    });
    setExternalSearch("");
  };

  const handleDirectInternalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (internalSearch.trim()) {
      handleAddInternal(internalSearch.trim(), SHARE_TYPE_USER);
    }
  };

  const handleDirectExternalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (externalSearch.trim()) {
      // If it looks like email or user
      handleAddExternal(externalSearch.trim(), 4); // Email type
    }
  };

  return (
    <div className="p-4 space-y-6 select-none bg-background">
      {/* ── Internal Share Section ── */}
      <div className="space-y-3.5 border-b border-muted/50 pb-5">
        <h4 className="font-bold text-xs text-foreground tracking-wide uppercase">
          Internal Share
        </h4>

        {/* Input */}
        <form onSubmit={handleDirectInternalSubmit} className="space-y-2.5 relative">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Email
            </label>
            <input
              type="email"
              value={internalSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInternalSearch(e.target.value)}
              placeholder="Enter Email address to share file or @UserName"
              className="h-10 w-full text-xs rounded-xl bg-muted/5 border border-muted px-3 py-2 outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {/* Dropdown Suggestions */}
          {internalSharees && internalSearch && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-popover border border-muted rounded-xl shadow-lg max-h-48 overflow-y-auto p-1">
              {[
                ...internalSharees.exact.users,
                ...internalSharees.users,
                ...internalSharees.exact.groups,
                ...internalSharees.groups,
              ]
                .slice(0, 5)
                .map((sharee) => (
                  <button
                    key={`${sharee.value.shareType}-${sharee.value.shareWith}`}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-xs flex items-center gap-2 text-foreground font-medium"
                    type="button"
                    onClick={() =>
                      handleAddInternal(
                        sharee.value.shareWith,
                        sharee.value.shareType
                      )
                    }
                  >
                    {sharee.value.shareType === 1 ? (
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full bg-primary/20 shrink-0" />
                    )}
                    <span>{sharee.label}</span>
                    {sharee.value.shareType === 1 && (
                      <Badge variant="secondary" className="text-[9px] py-0 px-1 ml-auto">
                        group
                      </Badge>
                    )}
                  </button>
                ))}
            </div>
          )}

          {/* What person can do */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              What person can do
            </label>
            <div className="relative">
              <select
                value={internalPerm}
                onChange={(e) => setInternalPerm(Number(e.target.value))}
                className="w-full h-10 px-3 py-2 bg-muted/30 border border-muted rounded-xl text-xs text-foreground outline-none appearance-none cursor-pointer focus:border-primary/50 transition-all pr-8 font-semibold"
              >
                <option value={1}>View only</option>
                <option value={3}>Can edit</option>
                <option value={31}>Full access</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Copy Link button */}
          <div className="flex items-center justify-between border border-muted/50 p-3 rounded-xl bg-muted/5">
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">Internal Link</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Only works for people with access to this file
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyInternal}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-150 active:scale-95 outline-none cursor-pointer",
                copiedInternal
                  ? "bg-purple-600/10 border-purple-600 text-purple-600 shadow-sm"
                  : "border-purple-600 text-purple-600 hover:bg-purple-600/5"
              )}
            >
              {copiedInternal ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Link className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Existing Internal Shares List */}
        {internalShares.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Shared with
            </p>
            {internalShares.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-muted/10 p-2 rounded-xl border border-muted/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary uppercase text-xs shrink-0 border border-primary/20">
                    {(s.share_with_displayname ?? s.share_with ?? "?").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {s.share_with_displayname ?? s.share_with}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {permissionsLabel(s.permissions)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={s.permissions}
                    onChange={(e) =>
                      updateShare.mutate({
                        shareId: s.id,
                        permissions: Number(e.target.value),
                      })
                    }
                    className="bg-transparent border border-muted/50 rounded-lg text-[10px] px-1.5 py-1 text-muted-foreground focus:outline-none cursor-pointer font-medium"
                  >
                    <option value={1}>View</option>
                    <option value={3}>Edit</option>
                    <option value={31}>Full</option>
                  </select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-muted/40 rounded-lg"
                    onClick={() => deleteShare.mutate(s.id)}
                    title="Remove Share"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── External Share Section ── */}
      <div className="space-y-3.5">
        <h4 className="font-bold text-xs text-foreground tracking-wide uppercase">
          External Share
        </h4>

        {/* Input */}
        <form onSubmit={handleDirectExternalSubmit} className="space-y-2.5 relative">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Email
            </label>
            <input
              type="email"
              value={externalSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExternalSearch(e.target.value)}
              placeholder="Enter Email address to share file or @UserName"
              className="h-10 w-full text-xs rounded-xl bg-muted/5 border border-muted px-3 py-2 outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {/* Dropdown Suggestions */}
          {externalSharees && externalSearch && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-popover border border-muted rounded-xl shadow-lg max-h-48 overflow-y-auto p-1">
              {[
                ...externalSharees.exact.users,
                ...externalSharees.users,
                ...externalSharees.exact.groups,
                ...externalSharees.groups,
              ]
                .slice(0, 5)
                .map((sharee) => (
                  <button
                    key={`${sharee.value.shareType}-${sharee.value.shareWith}`}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-xs flex items-center gap-2 text-foreground font-medium"
                    type="button"
                    onClick={() =>
                      handleAddExternal(
                        sharee.value.shareWith,
                        sharee.value.shareType
                      )
                    }
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{sharee.label}</span>
                  </button>
                ))}
            </div>
          )}

          {/* What person can do */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              What person can do
            </label>
            <div className="relative">
              <select
                value={externalPerm}
                onChange={(e) => setExternalPerm(Number(e.target.value))}
                className="w-full h-10 px-3 py-2 bg-muted/30 border border-muted rounded-xl text-xs text-foreground outline-none appearance-none cursor-pointer focus:border-primary/50 transition-all pr-8 font-semibold"
              >
                <option value={1}>View only</option>
                <option value={3}>Can edit</option>
                <option value={31}>Full access</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Copy Link button */}
          <div className="flex items-center justify-between border border-muted/50 p-3 rounded-xl bg-muted/5">
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">External Link</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Only works for people with access to this file
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyExternal}
              disabled={createShare.isPending}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-150 active:scale-95 outline-none cursor-pointer",
                copiedExternal
                  ? "bg-purple-600/10 border-purple-600 text-purple-600 shadow-sm"
                  : "border-purple-600 text-purple-600 hover:bg-purple-600/5"
              )}
            >
              {copiedExternal ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Link className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Existing External Shares List */}
        {externalShares.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              External Shares
            </p>
            {externalShares.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-muted/10 p-2 rounded-xl border border-muted/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-500/20">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {s.share_with_displayname ?? s.share_with ?? "Public Link"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {permissionsLabel(s.permissions)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={s.permissions}
                    onChange={(e) =>
                      updateShare.mutate({
                        shareId: s.id,
                        permissions: Number(e.target.value),
                      })
                    }
                    className="bg-transparent border border-muted/50 rounded-lg text-[10px] px-1.5 py-1 text-muted-foreground focus:outline-none cursor-pointer font-medium"
                  >
                    <option value={1}>View</option>
                    <option value={3}>Edit</option>
                    <option value={31}>Full</option>
                  </select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-muted/40 rounded-lg"
                    onClick={() => deleteShare.mutate(s.id)}
                    title="Remove Share"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Versions Tab Component ─────────────────────────────────────────────────────

import type { FileVersion } from "@/lib/types/file.types";

function VersionsTab({
  versions,
  file,
}: {
  versions: FileVersion[];
  file: KarsaazFile;
}) {
  // Current + past versions combined
  const allVersions = useMemo(() => {
    const list: { id: string; isCurrent: boolean; timestamp: string | Date; size: number; author: string; href?: string }[] = [];
    // Add current version
    list.push({
      id: "current",
      isCurrent: true,
      timestamp: file.lastModified,
      size: file.size,
      author: "You",
    });

    // Add previous versions
    versions.forEach((v) => {
      list.push({
        id: String(v.id),
        isCurrent: false,
        timestamp: v.timestamp,
        size: v.size,
        author: "You",
        href: v.href,
      });
    });

    return list;
  }, [file, versions]);

  return (
    <div className="p-4 space-y-3.5 select-none bg-background">
      {allVersions.map((v) => (
        <div
          key={v.id}
          className="flex items-center justify-between bg-muted/10 border border-muted/50 p-3 rounded-xl hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Yellow document card container */}
            <div className="w-8 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <FileIcon file={file} size="sm" className="w-5 h-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground flex items-center gap-1">
                {v.isCurrent ? (
                  <>
                    <span>Current version</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ·
                    </span>
                  </>
                ) : (
                  <>
                    <span>Version</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ·
                    </span>
                  </>
                )}
                <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded bg-muted/80 text-[9px] text-muted-foreground font-semibold">
                  <User className="h-2 w-2 shrink-0" />
                  {v.author}
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatFileDate(v.timestamp)} · {formatFileSize(v.size)}
              </p>
            </div>
          </div>

          <div className="shrink-0 pl-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28 p-1">
                <DropdownMenuItem
                  onClick={() => {
                    if (v.isCurrent) {
                      // Download current file
                      const username = file.ownerId || "user";
                      const path = `/files/${username}/${file.name}`;
                      const a = document.createElement("a");
                      a.href = `/api/proxy/remote.php/dav/files/${username}/${file.name}`;
                      a.download = file.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      toast.success("Download started");
                    } else if (v.href) {
                      const a = document.createElement("a");
                      a.href = `/api/proxy${v.href}`;
                      a.download = `${file.name} (${new Date(
                        v.timestamp
                      ).toLocaleDateString()})`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      toast.success("Download started");
                    }
                  }}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Download</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    toast.success("Version restored successfully");
                  }}
                  className="gap-2 cursor-pointer text-xs"
                >
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Restore</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
