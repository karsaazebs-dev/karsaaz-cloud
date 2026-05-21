"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Folder,
  File as FileIcon,
  Download,
  Lock,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils/files";
import {
  listPublicShare,
  downloadPublicFile,
  PublicShareError,
  type PublicShareItem,
} from "@/lib/api/publicShare";
import { toast } from "sonner";

export function PublicShareView({ token }: { token: string }) {
  const [items, setItems] = useState<PublicShareItem[]>([]);
  const [subPath, setSubPath] = useState("");
  const [isSingleFile, setIsSingleFile] = useState(false);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (path: string, pw: string) => {
      setLoading(true);
      setError(null);
      try {
        const listing = await listPublicShare(token, path, pw || undefined);
        setItems(listing.items);
        setIsSingleFile(listing.isSingleFile);
        setNeedsPassword(false);
      } catch (e) {
        if (e instanceof PublicShareError && e.requiresPassword) {
          setNeedsPassword(true);
        } else {
          setError(e instanceof Error ? e.message : "Could not load share");
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load(subPath, password);
  }, [load, subPath, password]);

  async function handleDownload(item: PublicShareItem) {
    try {
      await downloadPublicFile(token, item.path, item.name, password || undefined);
    } catch {
      toast.error("Download failed");
    }
  }

  const crumbs = subPath ? subPath.split("/").filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b bg-background flex items-center px-6 gap-2 shrink-0">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          K
        </div>
        <span className="font-semibold">Karsaaz Cloud</span>
        <span className="text-muted-foreground text-sm ml-2">· Shared with you</span>
      </header>

      <main className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-2xl">
          {needsPassword ? (
            <PasswordGate
              value={pwInput}
              onChange={setPwInput}
              onSubmit={() => setPassword(pwInput)}
              loading={loading}
            />
          ) : loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-20 text-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="font-medium">This share is unavailable</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-background overflow-hidden">
              {/* Breadcrumbs */}
              {!isSingleFile && (
                <div className="flex items-center gap-1 px-4 py-2 border-b text-sm text-muted-foreground flex-wrap">
                  <button
                    className="hover:text-foreground"
                    onClick={() => setSubPath("")}
                  >
                    Shared folder
                  </button>
                  {crumbs.map((c, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" />
                      <button
                        className="hover:text-foreground"
                        onClick={() => setSubPath(crumbs.slice(0, i + 1).join("/"))}
                      >
                        {c}
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Items */}
              <ul className="divide-y">
                {items.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                    This folder is empty
                  </li>
                ) : (
                  items.map((item) => (
                    <li
                      key={item.path}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                    >
                      {item.isDirectory ? (
                        <Folder className="h-5 w-5 text-primary shrink-0" />
                      ) : (
                        <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <button
                        className="flex-1 min-w-0 text-left"
                        onClick={() =>
                          item.isDirectory ? setSubPath(item.path) : handleDownload(item)
                        }
                      >
                        <p className="font-medium truncate">{item.name}</p>
                        {!item.isDirectory && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(item.size)}
                          </p>
                        )}
                      </button>
                      {!item.isDirectory && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleDownload(item)}
                          aria-label={`Download ${item.name}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PasswordGate({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="mx-auto max-w-sm rounded-lg border bg-background p-6 mt-12">
      <div className="flex flex-col items-center text-center gap-2 mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-semibold">Password protected</h1>
        <p className="text-sm text-muted-foreground">
          This share is protected. Enter the password to continue.
        </p>
      </div>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="share-pw">Password</Label>
          <Input
            id="share-pw"
            type="password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
          />
        </div>
        <Button type="submit" className="w-full" disabled={!value || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
        </Button>
      </form>
    </div>
  );
}
