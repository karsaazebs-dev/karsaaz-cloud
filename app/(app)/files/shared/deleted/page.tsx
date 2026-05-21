"use client";

import { useDeletedShares, useUndeleteShare } from "@/lib/hooks/useSharing";
import { ShareListView } from "@/components/files/ShareListView";

export default function DeletedSharesPage() {
  const { data: shares, isLoading } = useDeletedShares();
  const undelete = useUndeleteShare();

  return (
    <ShareListView
      title="Deleted shares"
      description="Shares you removed — restore them within the retention window"
      shares={shares}
      isLoading={isLoading}
      emptyText="No deleted shares"
      action={{
        label: "Restore",
        onClick: (share) => undelete.mutate(share.id),
        pending: undelete.isPending,
      }}
    />
  );
}
