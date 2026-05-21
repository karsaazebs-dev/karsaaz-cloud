"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, File, Folder, X, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api/client";
import type { OCSResponse } from "@/lib/types/ocs.types";
import { formatFileSize } from "@/lib/utils/files";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

const RECENT_KEY = "karsaaz-recent-searches";

interface SearchResult {
  thumbnailUrl?: string;
  title: string;
  subline: string;
  resourceUrl: string;
  icon: string;
  rounded?: boolean;
  attributes?: Record<string, string>;
}

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(q: string): void {
  if (!q.trim()) return;
  const prev = loadRecent().filter((x) => x !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 8)));
}

function clearRecent(): void {
  localStorage.removeItem(RECENT_KEY);
}

function useSearch(query: string, basicAuth: string | undefined) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return {} as Record<string, SearchResult[]>;
      const url = `/search/providers/files/search?term=${encodeURIComponent(query)}&from=%2Ffiles`;
      try {
        const data = await apiFetch<OCSResponse<{ entries: SearchResult[] }>>(
          `/ocs/v2.php${url}?format=json`,
          { basicAuth: basicAuth! }
        );
        return { Files: data.ocs.data.entries } as Record<string, SearchResult[]>;
      } catch {
        return {} as Record<string, SearchResult[]>;
      }
    },
    enabled: !!basicAuth && query.length >= 2,
    staleTime: 30_000,
  });
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const { data: results, isLoading } = useSearch(debouncedQuery, basicAuth);

  useEffect(() => {
    if (open) {
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      saveRecent(query);
      setRecent(loadRecent());
      // Navigate to files for file results
      const path = result.attributes?.path ?? result.resourceUrl;
      if (path.startsWith("/")) {
        router.push(`/files?path=${encodeURIComponent(path)}`);
      } else {
        window.open(result.resourceUrl, "_blank");
      }
      onClose();
    },
    [query, router, onClose]
  );

  const allResults = Object.entries(results ?? {}).flatMap(([, items]) => items ?? []);
  const hasResults = allResults.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files and folders…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border px-1.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!query && recent.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">Recent</span>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { clearRecent(); setRecent([]); }}
                >
                  Clear
                </button>
              </div>
              {recent.map((r) => (
                <button
                  key={r}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-accent text-sm text-left"
                  onClick={() => setQuery(r)}
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {r}
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && isLoading && (
            <div className="p-3 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2">
                  <Skeleton className="h-7 w-7 rounded" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.length >= 2 && !isLoading && !hasResults && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
              <Search className="h-8 w-8 mb-2 opacity-20" />
              <p>No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {Object.entries(results ?? {}).map(([group, items]) =>
            items && items.length > 0 ? (
              <div key={group} className="p-2">
                <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {group}
                </p>
                {items.map((item, i) => (
                  <button
                    key={i}
                    className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-accent text-left group"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="h-7 w-7 rounded bg-muted flex items-center justify-center shrink-0">
                      {item.attributes?.type === "dir" ? (
                        <Folder className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <File className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.subline}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : null
          )}
        </div>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center gap-3">
          <span><kbd className="px-1 rounded border">↑↓</kbd> navigate</span>
          <span><kbd className="px-1 rounded border">↵</kbd> select</span>
          <span><kbd className="px-1 rounded border">ESC</kbd> close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useSearchModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  return { open, setOpen, onClose: () => setOpen(false) };
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
