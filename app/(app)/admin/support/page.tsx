"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LifeBuoy, BookOpen, MessageSquare, Bug } from "lucide-react";

// The support/subscription app is not installed on this instance: the admin
// support page exposes no `support-*` initial-state key. We therefore present
// the community-support resources rather than a (non-existent) subscription
// status. No subscription-key endpoint is fabricated.

interface ResourceDef {
  icon: typeof BookOpen;
  label: string;
  description: string;
  href: string;
}

const RESOURCES: ResourceDef[] = [
  {
    icon: BookOpen,
    label: "Documentation",
    description: "Administration and user guides for running your instance.",
    href: "https://docs.nextcloud.com",
  },
  {
    icon: MessageSquare,
    label: "Community forum",
    description: "Ask questions and share knowledge with other administrators.",
    href: "https://help.nextcloud.com",
  },
  {
    icon: Bug,
    label: "Issue tracker",
    description: "Report bugs and follow development on GitHub.",
    href: "https://github.com/nextcloud/server/issues",
  },
];

export default function AdminSupportPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-muted-foreground text-sm">
          Get help running and maintaining your instance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LifeBuoy className="h-4 w-4" />
            Community support
          </CardTitle>
          <CardDescription>
            This instance uses community support. No paid subscription is
            registered.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {RESOURCES.map((r) => {
            const Icon = r.icon;
            return (
              <a
                key={r.label}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
              >
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.description}
                  </p>
                </div>
              </a>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
