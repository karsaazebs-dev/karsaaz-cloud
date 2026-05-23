import { formatDistanceToNow } from "date-fns";
import type { KarsaazFile } from "@/lib/types/file.types";

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatFileDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getFileIcon(file: KarsaazFile): string {
  if (file.type === "directory") return "folder";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"];
  const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "wmv"];
  const audioExts = ["mp3", "m4a", "ogg", "wav", "flac", "aac"];
  const docExts = ["doc", "docx", "odt"];
  const sheetExts = ["xls", "xlsx", "ods", "csv"];
  const slideExts = ["ppt", "pptx", "odp"];
  const pdfExts = ["pdf"];
  const codeExts = ["js", "ts", "jsx", "tsx", "py", "php", "rb", "go", "rs", "java", "c", "cpp", "cs", "html", "css", "json", "xml", "yaml", "yml", "sh", "bash"];
  const archiveExts = ["zip", "tar", "gz", "rar", "7z", "bz2"];

  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (audioExts.includes(ext)) return "audio";
  if (docExts.includes(ext)) return "document";
  if (sheetExts.includes(ext)) return "spreadsheet";
  if (slideExts.includes(ext)) return "presentation";
  if (pdfExts.includes(ext)) return "pdf";
  if (codeExts.includes(ext)) return "code";
  if (archiveExts.includes(ext)) return "archive";
  return "file";
}

export function getMimeColor(file: KarsaazFile): string {
  const icon = getFileIcon(file);
  const colors: Record<string, string> = {
    folder: "text-yellow-500",
    image: "text-purple-500",
    video: "text-red-500",
    audio: "text-pink-500",
    document: "text-blue-500",
    spreadsheet: "text-green-500",
    presentation: "text-orange-500",
    pdf: "text-red-600",
    code: "text-cyan-500",
    archive: "text-amber-600",
    file: "text-gray-400",
  };
  return colors[icon] ?? "text-gray-400";
}

export function buildFilePath(username: string, folder: string): string {
  const clean = folder.replace(/^\/+|\/+$/g, "");
  return `/remote.php/dav/files/${encodeURIComponent(username)}${clean ? `/${clean}` : ""}`;
}

export function getParentPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join("/")}` : "/";
}

export function getFolderSegments(path: string): Array<{ name: string; path: string }> {
  const parts = path.split("/").filter(Boolean);
  const segments: Array<{ name: string; path: string }> = [{ name: "Files", path: "/" }];
  let accumulated = "";
  for (const part of parts) {
    accumulated += `/${part}`;
    segments.push({ name: decodeURIComponent(part), path: accumulated });
  }
  return segments;
}

export function normalizePath(path: string): string {
  return path.replace(/^\/remote\.php\/dav/, "");
}

export function getRelativePath(username: string, fullPath: string): string {
  let path = fullPath;
  const davPrefix = `/remote.php/dav/files/${username}`;
  const filesPrefix = `/files/${username}`;
  
  if (path.startsWith(davPrefix)) {
    path = path.slice(davPrefix.length);
  } else if (path.startsWith(filesPrefix)) {
    path = path.slice(filesPrefix.length);
  }
  
  return path.startsWith("/") ? path : "/" + path;
}

export interface FavTreeNode {
  name: string;
  path: string;
  type: "directory" | "file";
  file?: KarsaazFile;
  children: FavTreeNode[];
}

export function buildFavTree(favorites: KarsaazFile[], username: string): FavTreeNode[] {
  const root: FavTreeNode = { name: "", path: "", type: "directory", children: [] };

  for (const file of favorites) {
    const relPath = getRelativePath(username, file.path);
    const segments = relPath.split("/").filter(Boolean);
    
    let current = root;
    let accumulatedPath = "";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      accumulatedPath += "/" + segment;
      const isLast = i === segments.length - 1;

      let child = current.children.find((c) => c.name === segment);
      if (!child) {
        child = {
          name: segment,
          path: isLast ? file.path : `/files/${username}${accumulatedPath}`,
          type: isLast ? file.type : "directory",
          children: [],
        };
        if (isLast) {
          child.file = file;
        }
        current.children.push(child);
      } else {
        if (isLast) {
          child.file = file;
          child.type = file.type;
          child.path = file.path;
        }
      }
      current = child;
    }
  }

  return root.children;
}


