import type { Metadata } from "next";
import { FileBrowser } from "@/components/files/FileBrowser";

export const metadata: Metadata = {
  title: "Files",
};

export default function FilesPage() {
  return (
    <div className="-m-6 h-[calc(100vh-8rem)]">
      <FileBrowser initialPath="/" />
    </div>
  );
}
