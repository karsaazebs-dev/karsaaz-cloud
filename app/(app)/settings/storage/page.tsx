import type { Metadata } from "next";
import { StorageSettings } from "./StorageSettings";

export const metadata: Metadata = { title: "Storage Settings" };

export default function StoragePage() {
  return <StorageSettings />;
}
