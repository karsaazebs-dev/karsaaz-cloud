"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { usePhotos, useAlbums } from "@/lib/hooks/usePhotos";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Images, RefreshCw } from "lucide-react";
import Image from "next/image";

function AlbumCard({
  name,
  path,
  count,
  cover,
}: {
  name: string;
  path: string;
  count: number;
  cover?: { path: string };
}) {
  const encoded = encodeURIComponent(path);
  return (
    <Link href={`/photos/albums?path=${encoded}`} className="group block">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
        {cover ? (
          <img
            src={`/api/proxy/remote.php/dav${cover.path}`}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-semibold text-sm truncate">{name}</p>
          <p className="text-white/70 text-xs">{count} photos</p>
        </div>
      </div>
    </Link>
  );
}

export function PhotosView() {
  const { data: photos, isLoading: loadingPhotos, refetch: refetchPhotos } = usePhotos();
  const { data: albums, isLoading: loadingAlbums } = useAlbums();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Photos</h1>
          <p className="text-sm text-muted-foreground">
            {photos ? `${photos.length} photos` : "Loading..."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchPhotos()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Images className="h-4 w-4" />
            All Photos
          </TabsTrigger>
          <TabsTrigger value="albums" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Albums
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <PhotoGallery photos={photos ?? []} isLoading={loadingPhotos} />
        </TabsContent>

        <TabsContent value="albums" className="mt-4">
          {loadingAlbums ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : !albums?.length ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <FolderOpen className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No albums found</p>
              <p className="text-sm mt-1">Create folders containing photos to create albums</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  name={album.name}
                  path={album.path}
                  count={album.photos.length}
                  cover={album.cover}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
