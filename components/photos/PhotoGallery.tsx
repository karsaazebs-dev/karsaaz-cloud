"use client";

import { useState, useMemo } from "react";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Skeleton } from "@/components/ui/skeleton";
import type { KarsaazFile } from "@/lib/types/file.types";
import { Images } from "lucide-react";

interface PhotoGalleryProps {
  photos: KarsaazFile[];
  isLoading?: boolean;
}

export function PhotoGallery({ photos, isLoading }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const albumPhotos = useMemo(
    () =>
      photos.map((p) => ({
        src: `/api/proxy/remote.php/dav${p.path}`,
        width: 400,
        height: 300,
        alt: p.name,
        key: p.id,
        download: `/api/proxy/remote.php/dav${p.path}`,
        title: p.name,
      })),
    [photos]
  );

  const lightboxSlides = useMemo(
    () =>
      photos.map((p) => ({
        src: `/api/proxy/remote.php/dav${p.path}`,
        alt: p.name,
        download: `/api/proxy/remote.php/dav${p.path}`,
        title: p.name,
        description: `${p.name}`,
      })),
    [photos]
  );

  if (isLoading) {
    return (
      <div className="columns-2 sm:columns-3 md:columns-4 gap-2 space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-full rounded-md"
            style={{ height: `${100 + (i % 4) * 50}px`, breakInside: "avoid", marginBottom: "8px" }}
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Images className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">No photos found</p>
        <p className="text-sm mt-1">Upload photos to your Photos or Camera folder</p>
      </div>
    );
  }

  return (
    <>
      <PhotoAlbum
        layout="masonry"
        photos={albumPhotos}
        spacing={8}
        columns={(containerWidth) => {
          if (containerWidth < 400) return 2;
          if (containerWidth < 700) return 3;
          if (containerWidth < 1000) return 4;
          return 5;
        }}
        onClick={({ index }) => setLightboxIndex(index)}
      />

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        slides={lightboxSlides}
        close={() => setLightboxIndex(-1)}
        plugins={[Download, Slideshow, Thumbnails, Zoom]}
        styles={{ container: { backgroundColor: "rgba(0,0,0,.9)" } }}
      />
    </>
  );
}
