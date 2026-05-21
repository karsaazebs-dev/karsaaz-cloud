"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, RotateCcw } from "lucide-react";
import {
  usePersonalSharingSettings,
  useSetDefaultAccept,
  useSetShareFolder,
  useResetShareFolder,
} from "@/lib/hooks/usePersonalSharing";

export default function PersonalSharingPage() {
  const { data, isLoading } = usePersonalSharingSettings();
  const setAccept = useSetDefaultAccept();
  const setFolder = useSetShareFolder();
  const resetFolder = useResetShareFolder();

  const [folder, setFolder_] = useState("");

  useEffect(() => {
    if (data) setFolder_(data.shareFolder || data.defaultShareFolder || "");
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Sharing</h2>
        <p className="text-sm text-muted-foreground">Control how shares reach you and where they land.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incoming shares</CardTitle>
              <CardDescription>What happens when someone shares with you.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Accept shares automatically</p>
                  <p className="text-xs text-muted-foreground">
                    {data?.enforceAccept
                      ? "Enforced by the administrator."
                      : "Add shared files to your account without confirming each one."}
                  </p>
                </div>
                <Switch
                  checked={data?.acceptDefault ?? true}
                  disabled={data?.enforceAccept || setAccept.isPending}
                  onCheckedChange={(checked) => setAccept.mutate(checked)}
                  aria-label="Accept shares automatically"
                />
              </div>
            </CardContent>
          </Card>

          {data?.allowCustomShareFolder && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share folder</CardTitle>
                <CardDescription>Where files shared with you are placed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="share-folder">Folder path</Label>
                  <Input
                    id="share-folder"
                    value={folder}
                    onChange={(e) => setFolder_(e.target.value)}
                    placeholder={data?.defaultShareFolder || "/"}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setFolder.mutate(folder)}
                    disabled={setFolder.isPending || !folder.trim()}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => resetFolder.mutate()}
                    disabled={resetFolder.isPending}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to default
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
