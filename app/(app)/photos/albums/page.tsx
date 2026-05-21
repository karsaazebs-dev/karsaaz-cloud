import { Suspense } from "react";
import { AlbumView } from "./AlbumView";

export default function AlbumPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-48"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <AlbumView />
    </Suspense>
  );
}
