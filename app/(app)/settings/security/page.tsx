import type { Metadata } from "next";
import { SecuritySettings } from "./SecuritySettings";

export const metadata: Metadata = { title: "Security Settings" };

export default function SecurityPage() {
  return <SecuritySettings />;
}
