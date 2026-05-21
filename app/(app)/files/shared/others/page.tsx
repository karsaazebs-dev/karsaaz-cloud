"use client";

import { useSharesByMe, SHARE_TYPE_LINK } from "@/lib/hooks/useSharing";
import { ShareListView } from "@/components/files/ShareListView";

export default function SharedWithOthersPage() {
  const { data: shares, isLoading } = useSharesByMe();
  // Exclude public links — those have their own view.
  const filtered = shares?.filter((s) => s.share_type !== SHARE_TYPE_LINK);

  return (
    <ShareListView
      title="Shared with others"
      description="Files and folders you shared with people and groups"
      shares={filtered}
      isLoading={isLoading}
      emptyText="You haven't shared anything yet"
    />
  );
}
