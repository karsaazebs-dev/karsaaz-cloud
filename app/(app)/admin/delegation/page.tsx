"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShieldQuestion, Plus } from "lucide-react";
import {
  useDelegationData,
  useSaveAuthorizedGroups,
} from "@/lib/hooks/useDelegation";
import { authGroupId } from "@/lib/api/delegation";

export default function AdminDelegationPage() {
  const { data, isLoading } = useDelegationData();
  const save = useSaveAuthorizedGroups();

  // class -> set of authorized gids
  const authByClass = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const entry of data?.authorized ?? []) {
      const gid = authGroupId(entry);
      if (!gid) continue;
      map.set(entry.class, [...(map.get(entry.class) ?? []), gid]);
    }
    return map;
  }, [data?.authorized]);

  function toggleGroup(className: string, gid: string, checked: boolean) {
    const current = authByClass.get(className) ?? [];
    const next = checked ? [...current, gid] : current.filter((g) => g !== gid);
    save.mutate({ className, gids: next });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Administration privileges</h1>
        <p className="text-muted-foreground text-sm">
          Delegate access to specific admin settings to non-admin groups.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldQuestion className="h-4 w-4" />
            Delegated settings
          </CardTitle>
          <CardDescription>Choose which groups may manage each settings area.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !data || data.settings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No delegatable settings available.</p>
          ) : (
            data.settings.map((setting) => {
              const selected = authByClass.get(setting.class) ?? [];
              const selectedNames = selected
                .map((gid) => data.groups.find((g) => g.gid === gid)?.displayName ?? gid)
                .filter(Boolean);
              return (
                <div
                  key={setting.class}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{setting.sectionName}</p>
                    {selectedNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedNames.map((n) => (
                          <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Admins only</p>
                    )}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 shrink-0">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Groups
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-2 max-h-72 overflow-y-auto">
                      {data.groups.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2">No groups</p>
                      ) : (
                        data.groups.map((g) => {
                          const checked = selected.includes(g.gid);
                          return (
                            <label
                              key={g.gid}
                              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm cursor-pointer"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(c) => toggleGroup(setting.class, g.gid, !!c)}
                                disabled={save.isPending}
                              />
                              <span className="truncate">{g.displayName}</span>
                            </label>
                          );
                        })
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
