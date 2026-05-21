import type { Metadata } from "next";
import { PhotosView } from "./PhotosView";

export const metadata: Metadata = {
  title: "Photos",
};

export default function PhotosPage() {
  return <PhotosView />;
}
