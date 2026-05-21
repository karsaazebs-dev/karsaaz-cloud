"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Monitor, Trash2, Plus, Copy, Check } from "lucide-react";
import { formatFileDate } from "@/lib/utils/files";
import {
  useAuthTokens,
  useCreateAuthToken,
  useDeleteAuthToken,
} from "@/lib/hooks/useAuthTokens";

export function DevicesAndSessions() {
  const { data: tokens, isLoading } = useAuthTokens();
  const createToken = useCreateAuthToken();
  const deleteToken = useDeleteAuthToken();

  const [name, setName] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function create() {
    const n = name.trim();
    if (!n) return;
    createToken.mutate(n, {
      onSuccess: (data) => {
        setGenerated(data.token);
        setName("");
      },
    });
  }

  function copy() {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Devices &amp; sessions</CardTitle>
        <CardDescription>
          Web, desktop and mobile clients currently logged in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token list */}
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading sessions…</p>
          ) : !tokens || tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            tokens.map((t) => {
              const Icon = t.type === 1 ? Smartphone : Monitor;
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{t.name}</span>
                      {t.current && (
                        <Badge variant="secondary" className="text-[10px]">
                          This device
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.lastActivity
                        ? `Last active ${formatFileDate(t.lastActivity * 1000)}`
                        : "Never used"}
                    </p>
                  </div>
                  {!t.current && t.canDelete !== false && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteToken.mutate(t.id)}
                      aria-label={`Revoke ${t.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* New app password */}
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium">Create a new app password</p>
          <p className="text-xs text-muted-foreground">
            Use an app password to log in a device or app without exposing your account password.
          </p>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="App name (e.g. Phone)"
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <Button
              className="h-9 shrink-0"
              onClick={create}
              disabled={!name.trim() || createToken.isPending}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create
            </Button>
          </div>

          {generated && (
            <div className="rounded-md border bg-muted/40 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Copy this password now — it won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono break-all">{generated}</code>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copy}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
