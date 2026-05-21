"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  listUsers,
  getUser,
  createUser,
  deleteUser,
  enableUser,
  disableUser,
  listGroups,
} from "@/lib/api/ocs";
import type { OCSUser } from "@/lib/types/ocs.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, UserPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { formatFileDate } from "@/lib/utils/files";

export default function AdminUsersPage() {
  const { basicAuth } = useAuth();
  const opts = { basicAuth };
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<OCSUser | null>(null);

  const { data: userIds, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => listUsers(opts, { search: search || undefined, limit: 100 }),
    enabled: !!basicAuth,
  });

  const { data: groups } = useQuery({
    queryKey: ["admin-groups"],
    queryFn: () => listGroups(opts),
    enabled: !!basicAuth,
  });

  const enableMut = useMutation({
    mutationFn: (uid: string) => enableUser(opts, uid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User enabled"); },
    onError: () => toast.error("Failed"),
  });

  const disableMut = useMutation({
    mutationFn: (uid: string) => disableUser(opts, uid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User disabled"); },
    onError: () => toast.error("Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (uid: string) => deleteUser(opts, uid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User deleted"); },
    onError: () => toast.error("Failed"),
  });

  async function openDetail(uid: string) {
    const u = await getUser(opts, uid);
    setDetailUser(u);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> New User
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium">User</th>
              <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Groups</th>
              <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Status</th>
              <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Last login</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-2"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-2 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-2 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-2 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-2 py-2" />
                </tr>
              ))}
            {userIds?.map((uid) => (
              <UserRow
                key={uid}
                uid={uid}
                opts={opts}
                onDetail={openDetail}
                onEnable={() => enableMut.mutate(uid)}
                onDisable={() => disableMut.mutate(uid)}
                onDelete={() => { if (confirm(`Delete ${uid}?`)) deleteMut.mutate(uid); }}
              />
            ))}
          </tbody>
        </table>
        {!isLoading && userIds?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No users found</div>
        )}
      </div>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        opts={opts}
        groups={groups ?? []}
        onCreated={() => qc.invalidateQueries({ queryKey: ["admin-users"] })}
      />

      {detailUser && (
        <UserDetailDialog user={detailUser} onClose={() => setDetailUser(null)} />
      )}
    </div>
  );
}

function UserRow({
  uid,
  opts,
  onDetail,
  onEnable,
  onDisable,
  onDelete,
}: {
  uid: string;
  opts: { basicAuth: string };
  onDetail: (uid: string) => void;
  onEnable: () => void;
  onDisable: () => void;
  onDelete: () => void;
}) {
  const { data: user } = useQuery({
    queryKey: ["admin-user", uid],
    queryFn: () => getUser(opts, uid),
    enabled: !!opts.basicAuth,
    staleTime: 60_000,
  });

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-2">
        <button
          className="text-left"
          onClick={() => user && onDetail(uid)}
        >
          <div className="font-medium">{user?.displayname ?? uid}</div>
          <div className="text-xs text-muted-foreground">{user?.email ?? ""}</div>
        </button>
      </td>
      <td className="px-4 py-2 hidden sm:table-cell">
        <div className="flex flex-wrap gap-1">
          {user?.groups?.slice(0, 3).map((g) => (
            <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
          ))}
          {(user?.groups?.length ?? 0) > 3 && (
            <Badge variant="secondary" className="text-xs">+{user!.groups.length - 3}</Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-2 hidden md:table-cell">
        {user && (
          <Badge variant={user.enabled ? "default" : "destructive"}>
            {user.enabled ? "Active" : "Disabled"}
          </Badge>
        )}
      </td>
      <td className="px-4 py-2 hidden lg:table-cell text-muted-foreground text-xs">
        {user?.last_login
          ? formatFileDate(user.last_login * 1000)
          : "Never"}
      </td>
      <td className="px-2 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDetail(uid)}>View details</DropdownMenuItem>
            {user?.enabled ? (
              <DropdownMenuItem onClick={onDisable}>Disable</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onEnable}>Enable</DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={onDelete}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function CreateUserDialog({
  open,
  onClose,
  opts,
  groups,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  opts: { basicAuth: string };
  groups: string[];
  onCreated: () => void;
}) {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      createUser(opts, {
        userid: uid,
        password,
        email,
        groups: selectedGroup ? [selectedGroup] : [],
      }),
    onSuccess: () => {
      toast.success(`User "${uid}" created`);
      onCreated();
      onClose();
      setUid(""); setEmail(""); setPassword(""); setSelectedGroup("");
    },
    onError: () => toast.error("Failed to create user"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Username *</label>
            <Input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="john.doe" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Password *</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Group</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="">— none —</option>
              {groups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={!uid || !password || mut.isPending}
          >
            {mut.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserDetailDialog({ user, onClose }: { user: OCSUser; onClose: () => void }) {
  const usedGB = ((user.quota?.used ?? 0) / 1e9).toFixed(2);
  const totalGB = user.quota?.total > 0 ? `/ ${(user.quota.total / 1e9).toFixed(2)} GB` : "";
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user.displayname || user.id}</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Username</dt><dd>{user.id}</dd>
          <dt className="text-muted-foreground">Email</dt><dd>{user.email || "—"}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd><Badge variant={user.enabled ? "default" : "destructive"}>{user.enabled ? "Active" : "Disabled"}</Badge></dd>
          <dt className="text-muted-foreground">Groups</dt><dd>{user.groups?.join(", ") || "—"}</dd>
          <dt className="text-muted-foreground">Storage</dt><dd>{usedGB} GB {totalGB}</dd>
          <dt className="text-muted-foreground">Last login</dt>
          <dd>{user.last_login ? formatFileDate(user.last_login * 1000) : "Never"}</dd>
          <dt className="text-muted-foreground">Backend</dt><dd>{user.backend || "—"}</dd>
        </dl>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
