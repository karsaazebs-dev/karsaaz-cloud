"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { listGroups, createGroup, deleteGroup } from "@/lib/api/ocs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

export default function AdminGroupsPage() {
  const { basicAuth } = useAuth();
  const opts = { basicAuth };
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState("");

  const { data: groups, isLoading } = useQuery({
    queryKey: ["admin-groups", search],
    queryFn: () => listGroups(opts, search || undefined),
    enabled: !!basicAuth,
  });

  const createMut = useMutation({
    mutationFn: () => createGroup(opts, newGroup),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-groups"] });
      toast.success(`Group "${newGroup}" created`);
      setNewGroup("");
      setCreateOpen(false);
    },
    onError: () => toast.error("Failed to create group"),
  });

  const deleteMut = useMutation({
    mutationFn: (groupId: string) => deleteGroup(opts, groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-groups"] });
      toast.success("Group deleted");
    },
    onError: () => toast.error("Failed to delete group"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Group
        </Button>
      </div>

      <Input
        placeholder="Filter groups…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <div className="rounded-lg border divide-y">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        {groups?.map((g) => (
          <div key={g} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UsersRound className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1 font-medium text-sm">{g}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => { if (confirm(`Delete group "${g}"?`)) deleteMut.mutate(g); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {!isLoading && groups?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No groups found</div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Group name"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newGroup && createMut.mutate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={!newGroup || createMut.isPending}
            >
              {createMut.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
