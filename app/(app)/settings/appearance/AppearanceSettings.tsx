"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Palette, Check, Accessibility } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useThemes,
  useEnableTheme,
  useDisableTheme,
  type Theme,
} from "@/lib/hooks/useAppearance";
import { THEME_TYPE_THEME } from "@/lib/api/appearance";

export function AppearanceSettings() {
  const { data: themes, isLoading } = useThemes();
  const enable = useEnableTheme();
  const disable = useDisableTheme();

  const pending = enable.isPending || disable.isPending;

  const appearanceThemes = (themes ?? []).filter(
    (t) => t.type === THEME_TYPE_THEME
  );
  const accessibilityThemes = (themes ?? []).filter(
    (t) => t.type !== THEME_TYPE_THEME
  );

  function selectAppearance(theme: Theme) {
    if (theme.enabled || pending) return;
    // The appearance themes are mutually exclusive: enabling one disables the
    // rest server-side, so we only need to enable the selected theme.
    enable.mutate(theme.id);
  }

  function toggleAccessibility(theme: Theme) {
    if (pending) return;
    if (theme.enabled) {
      disable.mutate(theme.id);
    } else {
      enable.mutate(theme.id);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Appearance and accessibility</h2>
        <p className="text-sm text-muted-foreground">
          Set a theme that matches your taste and accessibility needs.
        </p>
      </div>

      {/* Appearance themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose how the interface looks. Only one theme can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : appearanceThemes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No themes available.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {appearanceThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={theme.enabled}
                  aria-label={theme.enableLabel}
                  onClick={() => selectAppearance(theme)}
                  disabled={pending}
                  className={cn(
                    "relative flex flex-col items-start gap-1 rounded-md border p-4 text-left transition-colors",
                    "hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    theme.enabled
                      ? "border-primary bg-accent"
                      : "border-border"
                  )}
                >
                  {theme.enabled && (
                    <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />
                  )}
                  <span className="text-sm font-medium">{theme.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {theme.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accessibility toggles (fonts, etc.) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Accessibility className="h-4 w-4" />
            Accessibility
          </CardTitle>
          <CardDescription>
            Additional options to make the interface easier to use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : accessibilityThemes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No accessibility options available.
            </p>
          ) : (
            accessibilityThemes.map((theme) => (
              <div
                key={theme.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{theme.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {theme.description}
                  </p>
                </div>
                <Switch
                  checked={theme.enabled}
                  onCheckedChange={() => toggleAccessibility(theme)}
                  disabled={pending}
                  aria-label={theme.enableLabel}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
