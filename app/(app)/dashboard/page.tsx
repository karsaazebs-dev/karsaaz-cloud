import type { Metadata } from "next";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="p-6">
      <DashboardGrid />
    </div>
  );
}
