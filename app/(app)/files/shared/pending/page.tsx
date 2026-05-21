"use client";

import { usePendingShares } from "@/lib/hooks/useSharing";
import { ShareListView } from "@/components/files/ShareListView";

export default function PendingSharesPage() {
  const { data: shares, isLoading } = usePendingShares();

  return (
    <ShareListView
      title="Pending shares"
      description="Shares awaiting your acceptance"
      shares={shares}
      isLoading={isLoading}
      emptyText="No pending shares"
    />
  );
}
