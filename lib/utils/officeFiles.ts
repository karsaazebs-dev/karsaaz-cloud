// Office file extension detection

const WRITER_EXTS = new Set([
  "odt", "ott", "odm", "doc", "docx", "docm", "dotx", "dotm", "rtf", "txt",
]);
const CALC_EXTS = new Set([
  "ods", "ots", "xls", "xlsx", "xlsm", "xltx", "xltm", "csv",
]);
const IMPRESS_EXTS = new Set([
  "odp", "otp", "ppt", "pptx", "pptm", "potx", "potm",
]);
const DRAW_EXTS = new Set(["odg", "otg", "svg"]);

export type OfficeApp = "writer" | "calc" | "impress" | "draw";

export function getOfficeApp(filename: string): OfficeApp | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (WRITER_EXTS.has(ext)) return "writer";
  if (CALC_EXTS.has(ext)) return "calc";
  if (IMPRESS_EXTS.has(ext)) return "impress";
  if (DRAW_EXTS.has(ext)) return "draw";
  return null;
}

export function isOfficeFile(filename: string): boolean {
  return getOfficeApp(filename) !== null;
}
