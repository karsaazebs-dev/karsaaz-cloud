"use client";

import { useSharesByMe, SHARE_TYPE_LINK } from "@/lib/hooks/useSharing";
import { ShareListView } from "@/components/files/ShareListView";

export default function SharedByLinkPage() {
  const { data: shares, isLoading } = useSharesByMe();
  const links = shares?.filter((s) => s.share_type === SHARE_TYPE_LINK);

  return (
    <ShareListView
      title="Shared by link"
      description="Public links you created"
      shares={links}
      isLoading={isLoading}
      emptyText="No public links yet"
    />
  );
}
