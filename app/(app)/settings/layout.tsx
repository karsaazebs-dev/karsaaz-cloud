import type { Metadata } from "next";
import { SettingsLayout } from "@/components/settings/SettingsLayout";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsGroupLayout({ children }: { children: React.ReactNode }) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
