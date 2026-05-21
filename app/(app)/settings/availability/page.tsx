import type { Metadata } from "next";
import { AvailabilitySettings } from "./AvailabilitySettings";

export const metadata: Metadata = { title: "Availability Settings" };

export default function AvailabilityPage() {
  return <AvailabilitySettings />;
}
