"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link2,
  Users,
  Copy,
  Trash2,
  Plus,
  Loader2,
  Globe,
  Lock,
} from "lucide-react";
import {
  useShares,
  useCreateShare,
  useUpdateShare,
  useDeleteShare,
  useSearchSharees,
  SHARE_TYPE_LINK,
  SHARE_TYPE_USER,
  SHARE_TYPE_GROUP,
  PERM_READ,
  PERM_ALL,
  permissionsLabel,
} from "@/lib/hooks/useSharing";
import { cn } from "@/lib/utils";
import { getBackendOrigin } from "@/lib/utils/backend";
import { toast } from "sonner";
import type { KarsaazFile } from "@/lib/types/file.types";
import type { OCSShare } from "@/lib/types/ocs.types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  file: KarsaazFile;
  filePath: string;
}

export function ShareDialog({ open, onOpenChange, file, filePath }: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState<"link" | "users">("link");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: shares = [], isLoading } = useShares(open ? filePath : null);
  const createShare = useCreateShare(filePath);
  const updateShare = useUpdateShare(filePath);
  const deleteShare = useDeleteShare(filePath);
  const { data: sharees } = useSearchSharees(searchQuery);

  const publicLinks = shares.filter((s) => s.share_type === SHARE_TYPE_LINK);
  const userShares = shares.filter(
    (s) => s.share_type === SHARE_TYPE_USER || s.share_type === SHARE_TYPE_GROUP
  );

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied"));
  }

  function buildPublicUrl(token: string) {
    return `${getBackendOrigin()}/s/${token}`;
  }

  async function handleCreatePublicLink() {
    await createShare.mutateAsync({
      path: filePath,
      shareType: SHARE_TYPE_LINK,
      permissions: PERM_READ,
    });
  }

  async function handleAddUser(shareWith: string, shareType: number) {
    await createShare.mutateAsync({
      path: filePath,
      shareType,
      shareWith,
      permissions: PERM_ALL,
    });
    setSearchQuery("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Share — <span className="font-normal text-muted-foreground truncate max-w-xs">{file.name}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <TabButton active={activeTab === "link"} onClick={() => setActiveTab("link")}>
            <Link2 className="h-4 w-4 mr-1.5" /> Public link
          </TabButton>
          <TabButton active={activeTab === "users"} onClick={() => setActiveTab("users")}>
            <Users className="h-4 w-4 mr-1.5" /> Users & groups
          </TabButton>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* ── Public link tab ── */}
            {activeTab === "link" && (
              <div className="space-y-3">
                {publicLinks.length === 0 ? (
                  <div className="text-center py-4">
                    <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No public link yet</p>
                    <Button
                      onClick={handleCreatePublicLink}
                      disabled={createShare.isPending}
                      size="sm"
                    >
                      {createShare.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create public link
                    </Button>
                  </div>
                ) : (
                  publicLinks.map((share) => (
                    <PublicLinkRow
                      key={share.id}
                      share={share}
                      onCopy={() => copyLink(buildPublicUrl(share.token ?? ""))}
                      onDelete={() => deleteShare.mutate(share.id)}
                      onUpdate={(payload) => updateShare.mutate({ shareId: share.id, ...payload })}
                    />
                  ))
                )}

                {publicLinks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreatePublicLink}
                    disabled={createShare.isPending}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add another link
                  </Button>
                )}
              </div>
            )}

            {/* ── Users & groups tab ── */}
            {activeTab === "users" && (
              <div className="space-y-3">
                {/* Search input */}
                <div className="relative">
                  <Input
                    placeholder="Search users or groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {sharees && searchQuery && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                      {[
                        ...sharees.exact.users,
                        ...sharees.users,
                        ...sharees.exact.groups,
                        ...sharees.groups,
                      ]
                        .slice(0, 8)
                        .map((sharee) => (
                          <button
                            key={`${sharee.value.shareType}-${sharee.value.shareWith}`}
                            className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
                            onClick={() =>
                              handleAddUser(sharee.value.shareWith, sharee.value.shareType)
                            }
                          >
                            {sharee.value.shareType === SHARE_TYPE_GROUP ? (
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <div className="h-3.5 w-3.5 rounded-full bg-primary/20 flex-shrink-0" />
                            )}
                            <span>{sharee.label}</span>
                            {sharee.value.shareType === SHARE_TYPE_GROUP && (
                              <Badge variant="secondary" className="text-[10px] py-0">group</Badge>
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Existing user shares */}
                {userShares.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    Not shared with anyone yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userShares.map((share) => (
                      <UserShareRow
                        key={share.id}
                        share={share}
                        onDelete={() => deleteShare.mutate(share.id)}
                        onUpdate={(payload) => updateShare.mutate({ shareId: share.id, ...payload })}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function PublicLinkRow({
  share,
  onCopy,
  onDelete,
  onUpdate,
}: {
  share: OCSShare;
  onCopy: () => void;
  onDelete: () => void;
  onUpdate: (p: { permissions?: number; password?: string; expireDate?: string }) => void;
}) {
  const url = `${getBackendOrigin()}/s/${share.token ?? ""}`;

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          readOnly
          value={url}
          className="flex-1 text-xs bg-muted rounded px-2 py-1 truncate focus:outline-none"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCopy} title="Copy link">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
          title="Remove link"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Permissions */}
      <div className="flex items-center gap-2">
        <Select
          defaultValue={String(share.permissions)}
          onValueChange={(v: string) => onUpdate({ permissions: Number(v) })}
        >
          <SelectTrigger className="h-7 text-xs w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(PERM_READ)}>View only</SelectItem>
            <SelectItem value={String(PERM_READ | 2 | 4)}>Can edit</SelectItem>
            <SelectItem value={String(PERM_ALL)}>Full access</SelectItem>
          </SelectContent>
        </Select>

        {share.expiration && (
          <Badge variant="outline" className="text-xs">
            Expires {new Date(share.expiration).toLocaleDateString()}
          </Badge>
        )}
      </div>
    </div>
  );
}

function UserShareRow({
  share,
  onDelete,
  onUpdate,
}: {
  share: OCSShare;
  onDelete: () => void;
  onUpdate: (p: { permissions?: number }) => void;
}) {
  const isGroup = share.share_type === SHARE_TYPE_GROUP;

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        {isGroup ? (
          <Users className="h-4 w-4 text-primary" />
        ) : (
          <span className="text-xs font-semibold text-primary uppercase">
            {(share.share_with_displayname ?? share.share_with ?? "?").charAt(0)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {share.share_with_displayname ?? share.share_with}
        </p>
        {isGroup && <p className="text-xs text-muted-foreground">Group</p>}
      </div>

      <Select
        defaultValue={String(share.permissions)}
        onValueChange={(v: string) => onUpdate({ permissions: Number(v) })}
      >
        <SelectTrigger className="h-7 text-xs w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={String(PERM_READ)}>View</SelectItem>
          <SelectItem value={String(PERM_READ | 2 | 4)}>Edit</SelectItem>
          <SelectItem value={String(PERM_ALL)}>Full</SelectItem>
        </SelectContent>
      </Select>

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={onDelete}
        title="Remove share"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
