"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useAppConfigValues, useSetAppConfigValue } from "@/lib/hooks/useAppConfig";

// Confirmed live: the survey_client app stores the monthly-report opt-in as
// appconfig app `survey_client` key `enabled` ("yes"/"no"). Default is off.
const APP = "survey_client";
const KEY = "enabled";

const REPORTED = [
  "Server environment (PHP, database type and version, web server)",
  "Number of users, files and shares (counts only, no contents)",
  "Enabled apps and their versions",
  "Configured background job and memory cache backends",
];

export default function AdminUsageSurveyPage() {
  const { data: values, isLoading } = useAppConfigValues(APP, [KEY]);
  const setValue = useSetAppConfigValue(APP);

  const enabled = values?.[KEY] === "yes";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Usage survey</h1>
        <p className="text-muted-foreground text-sm">
          Help improve the platform by sending anonymous usage statistics.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Monthly reports
          </CardTitle>
          <CardDescription>
            When enabled, an anonymized report is sent automatically once a
            month. No personal data or file contents are ever included.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Send usage statistics</p>
              <p className="text-xs text-muted-foreground">
                Toggle automatic monthly reporting.
              </p>
            </div>
            {isLoading ? (
              <Skeleton className="h-5 w-9 rounded-full" />
            ) : (
              <Switch
                checked={enabled}
                onCheckedChange={(checked) =>
                  setValue.mutate(
                    { key: KEY, value: checked ? "yes" : "no" },
                    { onSuccess: () => toast.success("Saved") }
                  )
                }
                aria-label="Send usage statistics"
              />
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium">What is reported</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc pl-4">
              {REPORTED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
