import {
  Folder,
  Image,
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

interface FileIconProps {
  file: KarsaazFile;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const iconMap: Record<string, React.ElementType> = {
  folder: Folder,
  image: Image,
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

  return (
    <Icon className={cn(sizeMap[size], colorClass, className)} aria-hidden="true" />
  );
}
