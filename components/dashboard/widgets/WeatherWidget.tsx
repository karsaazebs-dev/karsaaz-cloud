"use client";

import { useState } from "react";
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  MapPin,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useWeatherForecast,
  useWeatherLocation,
  useSetWeatherLocation,
} from "@/lib/hooks/useDashboard";
import type { OCSWeatherForecastPoint } from "@/lib/types/ocs.types";

/** Map a met.no symbol_code to an icon component. */
function symbolIcon(code: string | undefined): React.ElementType {
  if (!code) return Cloud;
  if (code.includes("thunder")) return CloudLightning;
  if (code.includes("snow") || code.includes("sleet")) return CloudSnow;
  if (code.includes("rain") || code.includes("showers")) return CloudRain;
  if (code.includes("fog")) return CloudFog;
  if (code.startsWith("clearsky")) return Sun;
  if (code.startsWith("fair") || code.includes("partlycloudy")) return CloudSun;
  return Cloud;
}

export function WeatherWidget() {
  const { data: forecast, isLoading } = useWeatherForecast();
  const { data: location } = useWeatherLocation();
  const setLocation = useSetWeatherLocation();
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  const points: OCSWeatherForecastPoint[] = Array.isArray(forecast) ? forecast : [];
  const unavailable = !Array.isArray(forecast) || points.length === 0;

  const locationForm = (
    <form
      className="flex gap-2 mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (address.trim()) {
          setLocation.mutate(
            { address: address.trim() },
            { onSuccess: () => setEditing(false) }
          );
        }
      }}
    >
      <Input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="City, country"
        className="h-8"
        autoFocus
      />
      <Button type="submit" size="sm" className="h-8" disabled={setLocation.isPending}>
        {setLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set"}
      </Button>
    </form>
  );

  if (unavailable) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Cloud className="h-4 w-4" />
          <span>Forecast unavailable</span>
        </div>
        {location?.address ? (
          <p className="text-xs text-muted-foreground">
            Location: {location.address}
          </p>
        ) : null}
        {editing ? (
          locationForm
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setEditing(true)}
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            Set location
          </Button>
        )}
      </div>
    );
  }

  const now = points[0];
  const temp = now.data.instant.details.air_temperature;
  const code = now.data.next_1_hours?.summary.symbol_code ?? now.data.next_6_hours?.summary.symbol_code;
  const NowIcon = symbolIcon(code);

  // Next few 6-hourly snapshots for a mini forecast strip.
  const upcoming = points.slice(1, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <NowIcon className="h-10 w-10 text-primary shrink-0" />
        <div className="min-w-0">
          <div className="text-2xl font-semibold leading-none">
            {temp !== undefined ? `${Math.round(temp)}°` : "—"}
          </div>
          {location?.address && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {location.address}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs ml-auto shrink-0"
          onClick={() => setEditing((v) => !v)}
        >
          Change
        </Button>
      </div>

      {editing && locationForm}

      {upcoming.length > 0 && (
        <div className="flex justify-between gap-1 pt-1 border-t">
          {upcoming.map((p) => {
            const t = p.data.instant.details.air_temperature;
            const c = p.data.next_6_hours?.summary.symbol_code ?? p.data.next_1_hours?.summary.symbol_code;
            const Icon = symbolIcon(c);
            const hour = new Date(p.time).getHours();
            return (
              <div key={p.time} className="flex flex-col items-center text-xs gap-1">
                <span className="text-muted-foreground">{hour}:00</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{t !== undefined ? `${Math.round(t)}°` : "—"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
