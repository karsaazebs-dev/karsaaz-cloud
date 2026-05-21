import type { Metadata } from "next";
import { RecentFilesWidget } from "@/components/dashboard/widgets/RecentFilesWidget";

export const metadata: Metadata = {
  title: "Recent",
};

export default function RecentFilesPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recent files</h1>
        <p className="text-sm text-muted-foreground">
          Recently modified files from your account
        </p>
      </div>
      <RecentFilesWidget />
    </div>
  );
}
