import type { Metadata } from "next";
import { ActivityView } from "./ActivityView";

export const metadata: Metadata = {
  title: "Activity",
};

export default function ActivityPage() {
  return <ActivityView />;
}
