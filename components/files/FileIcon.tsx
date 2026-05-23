"use client";

import { useState } from "react";
import {
  Image as LucideImage,
  Video,
  Music,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  FileCode,
  Archive,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFileIcon, getMimeColor } from "@/lib/utils/files";
import type { KarsaazFile } from "@/lib/types/file.types";
import { GroupFolderIcon } from "@/components/icons/CustomIcons";

interface FileIconProps {
  file: KarsaazFile;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const iconMap: Record<string, React.ElementType> = {
  folder: GroupFolderIcon,
  image: LucideImage,
  video: Video,
  audio: Music,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: BookOpen,
  pdf: File,
  code: FileCode,
  archive: Archive,
  file: File,
};

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
};

export function FileIcon({ file, className, size = "md" }: FileIconProps) {
  const iconType = getFileIcon(file);
  const colorClass = getMimeColor(file);
  const Icon = iconMap[iconType] ?? File;

  const isImage = iconType === "image";
  const [imgError, setImgError] = useState(false);

  if (isImage && file.path && !imgError) {
    const imageUrl = `/api/proxy/remote.php/dav${file.path}`;
    return (
      <img
        src={imageUrl}
        alt={file.name}
        className={cn(
          sizeMap[size],
          "object-cover rounded-sm border border-black/10 shrink-0",
          className
        )}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <Icon className={cn(sizeMap[size], colorClass, className)} aria-hidden="true" />
  );
}

