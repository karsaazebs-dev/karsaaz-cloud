import type { Metadata } from "next";
import { FileBrowser } from "@/components/files/FileBrowser";

export const metadata: Metadata = {
  title: "Tags",
};

export default function TagsPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
        <p className="text-sm text-muted-foreground">
          Browse files from the main file view and manage tags in file details.
        </p>
      </div>
      <div className="-mx-6 -mb-6">
        <FileBrowser initialPath="/" />
      </div>
    </div>
  );
}
