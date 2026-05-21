"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Upload, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAppConfigValues } from "@/lib/hooks/useAppConfig";
import {
  useUpdateThemingSetting,
  useUploadThemingImage,
  useUndoThemingSetting,
} from "@/lib/hooks/useTheming";
import type { ThemingImageKey } from "@/lib/api/theming";
import { getBackendOrigin } from "@/lib/utils/backend";

const APP = "theming";
const KEYS = ["name", "slogan", "url", "color"];

export default function AdminThemingPage() {
  const { data: values, isLoading } = useAppConfigValues(APP, KEYS);
  const updateSetting = useUpdateThemingSetting();

  const [form, setForm] = useState({ name: "", slogan: "", url: "", color: "#0082c9" });

  useEffect(() => {
    if (values) {
      setForm({
        name: values.name || "Karsaaz Cloud",
        slogan: values.slogan || "",
        url: values.url || "",
        color: values.color || "#0082c9",
      });
    }
  }, [values]);

  function save() {
    const fields: { setting: "name" | "slogan" | "url" | "color"; value: string }[] = [
      { setting: "name", value: form.name },
      { setting: "slogan", value: form.slogan },
      { setting: "url", value: form.url },
      { setting: "color", value: form.color },
    ];
    Promise.all(fields.map((f) => updateSetting.mutateAsync(f)))
      .then(() => toast.success("Theme saved"))
      .catch(() => toast.error("Could not save theme"));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Theming</h1>
        <p className="text-muted-foreground text-sm">Customize the look of your Karsaaz Cloud instance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Branding shown across the web interface and login page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-1/2" />
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="t-name">Name</Label>
                <Input id="t-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-slogan">Slogan</Label>
                <Input id="t-slogan" value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-url">Web link</Label>
                <Input id="t-url" type="url" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-color">Primary color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="t-color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="h-9 w-14 rounded-md border bg-background cursor-pointer"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-32 font-mono"
                  />
                </div>
              </div>

              <Button onClick={save} disabled={updateSetting.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {updateSetting.isPending ? "Saving…" : "Save theme"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo &amp; images</CardTitle>
          <CardDescription>Upload a logo and login background. PNG, JPG or SVG.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ImageUpload imageKey="logo" label="Logo" />
          <ImageUpload imageKey="background" label="Login background" />
        </CardContent>
      </Card>
    </div>
  );
}

function ImageUpload({ imageKey, label }: { imageKey: ThemingImageKey; label: string }) {
  const upload = useUploadThemingImage();
  const undo = useUndoThemingSetting();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cacheBust, setCacheBust] = useState(0);

  // Preview the currently-applied image straight from the backend.
  const previewUrl = `${getBackendOrigin()}/index.php/apps/theming/image/${imageKey}?v=${cacheBust}`;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    upload.mutate(
      { key: imageKey, file },
      { onSuccess: () => setCacheBust(Date.now()) }
    );
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex h-20 items-center justify-center rounded-md border bg-muted/30 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={label}
          className="max-h-16 max-w-full object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          <Upload className="h-4 w-4 mr-1.5" />
          {upload.isPending ? "Uploading…" : "Upload"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => undo.mutate(imageKey, { onSuccess: () => setCacheBust(Date.now()) })}
          disabled={undo.isPending}
        >
          <RotateCcw className="h-4 w-4 mr-1.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
