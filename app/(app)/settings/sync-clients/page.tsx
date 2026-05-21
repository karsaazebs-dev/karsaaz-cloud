import type { Metadata } from "next";
import { SyncClientsSettings } from "./SyncClientsSettings";

export const metadata: Metadata = { title: "Mobile & desktop" };

export default function SyncClientsPage() {
  return <SyncClientsSettings />;
}
