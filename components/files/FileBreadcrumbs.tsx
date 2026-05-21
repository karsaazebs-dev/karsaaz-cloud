"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFolderSegments } from "@/lib/utils/files";

interface FileBreadcrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function FileBreadcrumbs({ path, onNavigate }: FileBreadcrumbsProps) {
  const segments = getFolderSegments(path);

  return (
    <nav aria-label="Folder path" className="flex items-center gap-1 text-sm min-w-0">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={seg.path} className="flex items-center gap-1 min-w-0">
            {i > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            {isLast ? (
              <span
                className="font-medium text-foreground truncate max-w-[200px]"
                aria-current="page"
              >
                {i === 0 ? (
                  <Home className="h-4 w-4 inline-block" />
                ) : (
                  seg.name
                )}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(seg.path)}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors truncate max-w-[160px]",
                  i === 0 && "shrink-0"
                )}
              >
                {i === 0 ? <Home className="h-4 w-4 inline-block" /> : seg.name}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
