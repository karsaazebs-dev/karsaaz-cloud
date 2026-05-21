import { Suspense } from "react";
import { OfficeEditor } from "./OfficeEditor";

export default function OfficePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <OfficeEditor />
    </Suspense>
  );
}
