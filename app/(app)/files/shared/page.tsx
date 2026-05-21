"use client";

import { useSharedWithMe } from "@/lib/hooks/useDashboard";
import { ShareListView } from "@/components/files/ShareListView";

export default function SharedWithYouPage() {
  const { data: shares, isLoading } = useSharedWithMe();

  return (
    <ShareListView
      title="Shared with you"
      description="Files and folders other people shared with you"
      shares={shares}
      isLoading={isLoading}
      emptyText="Nothing shared with you yet"
    />
  );
}
