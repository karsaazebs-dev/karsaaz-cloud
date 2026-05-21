"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { useAlbumPhotos } from "@/lib/hooks/usePhotos";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function AlbumView() {
  const params = useSearchParams();
  const path = params.get("path") ?? "";
  const albumName = path.split("/").pop() ?? "Album";

  const { data: photos, isLoading } = useAlbumPhotos(path);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/photos">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{albumName}</h1>
          <p className="text-sm text-muted-foreground">
            {photos ? `${photos.length} photos` : "Loading..."}
          </p>
        </div>
      </div>
      <PhotoGallery photos={photos ?? []} isLoading={isLoading} />
    </div>
  );
}
