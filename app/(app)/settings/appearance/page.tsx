import type { Metadata } from "next";
import { AppearanceSettings } from "./AppearanceSettings";

export const metadata: Metadata = { title: "Appearance and accessibility" };

export default function AppearancePage() {
  return <AppearanceSettings />;
}
