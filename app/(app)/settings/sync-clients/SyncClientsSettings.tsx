"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Smartphone,
  Apple,
  AppWindow,
  KeyRound,
  ExternalLink,
} from "lucide-react";

type ClientLink = {
  href: string;
  label: string;
};

type ClientApp = {
  icon: typeof Monitor;
  title: string;
  description: string;
  links: ClientLink[];
};

const CLIENTS: ClientApp[] = [
  {
    icon: Monitor,
    title: "Desktop client",
    description: "Sync your files on Windows, macOS and Linux.",
    links: [{ href: "https://nextcloud.com/install/#install-clients", label: "Download" }],
  },
  {
    icon: Smartphone,
    title: "Android app",
    description: "Access your files on the go from your Android device.",
    links: [
      {
        href: "https://play.google.com/store/apps/details?id=com.nextcloud.client",
        label: "Google Play",
      },
      {
        href: "https://f-droid.org/packages/com.nextcloud.client/",
        label: "F-Droid",
      },
    ],
  },
  {
    icon: Apple,
    title: "iOS app",
    description: "Access your files on the go from your iPhone or iPad.",
    links: [
      {
        href: "https://apps.apple.com/app/nextcloud/id1125420102",
        label: "App Store",
      },
    ],
  },
];

export function SyncClientsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Mobile &amp; desktop</h2>
        <p className="text-sm text-muted-foreground">
          Download the apps to sync and access your files from anywhere.
        </p>
      </div>

      {/* Download clients */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CLIENTS.map(({ icon: Icon, title, description, links }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {links.map((link) => (
                <Button key={link.href} asChild size="sm" variant="outline">
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* App passwords note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            Connecting a client
          </CardTitle>
          <CardDescription>
            For security, log in to a client with a dedicated app password instead of
            your account password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/settings/security">
              <AppWindow className="h-4 w-4" />
              Create an app password
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
