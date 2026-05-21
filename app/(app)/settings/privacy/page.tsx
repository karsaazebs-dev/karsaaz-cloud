"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ExternalLink } from "lucide-react";
import { useAppConfigValues } from "@/lib/hooks/useAppConfig";

// Legal links are stored under the `theming` app and surfaced in the footer.
const APP = "theming";
const KEYS = ["privacyUrl", "imprintUrl"];

interface LinkDef {
  key: string;
  label: string;
  description: string;
}

const LINKS: LinkDef[] = [
  {
    key: "privacyUrl",
    label: "Privacy policy",
    description: "How your personal data is collected, used and protected.",
  },
  {
    key: "imprintUrl",
    label: "Legal notice",
    description: "Imprint and legal information about this service.",
  },
];

export default function PrivacyPage() {
  const { data: values, isLoading } = useAppConfigValues(APP, KEYS);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold">Privacy</h2>
        <p className="text-sm text-muted-foreground">
          Legal information and privacy resources for this service.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Legal links
          </CardTitle>
          <CardDescription>
            These links are configured by your administrator under Theming.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading
            ? Array.from({ length: LINKS.length }).map((_, i) => (
                <div key={i} className="py-3 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              ))
            : LINKS.map((def) => {
                const url = values?.[def.key]?.trim() ?? "";
                return (
                  <div
                    key={def.key}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{def.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {def.description}
                      </p>
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline shrink-0"
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0">
                        Not configured
                      </span>
                    )}
                  </div>
                );
              })}
        </CardContent>
      </Card>
    </div>
  );
}
