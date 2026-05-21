// serverinfo app — system monitoring (admin)
// GET /ocs/v2.php/apps/serverinfo/api/v1/info
// Typed to the real live response shape confirmed against the backend.

import { apiFetch } from "./client";
import type { OCSResponse } from "@/lib/types/ocs.types";

interface OCSOptions {
  basicAuth: string;
}

export interface ServerInfoSystem {
  version?: string;
  theme?: string;
  enable_avatars?: string;
  enable_previews?: string;
  "memcache.local"?: string;
  "memcache.distributed"?: string;
  "memcache.locking"?: string;
  "filelocking.enabled"?: string;
  debug?: string;
  freespace?: number;
  /** 1m / 5m / 15m load averages */
  cpuload?: number[];
  cpunum?: number;
  /** memory values are in kilobytes */
  mem_total?: number;
  mem_free?: number;
  swap_total?: number;
  swap_free?: number;
}

export interface ServerInfoStorage {
  num_users?: number;
  num_files?: number;
  num_storages?: number;
  num_storages_local?: number;
  num_storages_home?: number;
  num_storages_other?: number;
}

export interface ServerInfoShares {
  num_shares?: number;
  num_shares_user?: number;
  num_shares_groups?: number;
  num_shares_link?: number;
  num_shares_mail?: number;
  num_fed_shares_sent?: number;
  num_fed_shares_received?: number;
}

export interface ServerInfoApps {
  num_installed?: number;
  num_updates_available?: number;
}

export interface ServerInfoPHP {
  version?: string;
  /** bytes */
  memory_limit?: number;
  max_execution_time?: number;
  /** bytes */
  upload_max_filesize?: number;
}

export interface ServerInfoDatabase {
  type?: string;
  version?: string;
  /** bytes, as a numeric string */
  size?: string | number;
}

export interface ServerInfoNextcloud {
  system?: ServerInfoSystem;
  storage?: ServerInfoStorage;
  shares?: ServerInfoShares;
  apps?: ServerInfoApps;
}

export interface ServerInfoServer {
  webserver?: string;
  php?: ServerInfoPHP;
  database?: ServerInfoDatabase;
}

export interface ServerInfoActiveUsers {
  last5minutes?: number;
  last1hour?: number;
  last24hours?: number;
  last7days?: number;
  last1month?: number;
}

export interface ServerInfo {
  nextcloud?: ServerInfoNextcloud;
  server?: ServerInfoServer;
  activeUsers?: ServerInfoActiveUsers;
}

export async function getServerInfo(opts: OCSOptions): Promise<ServerInfo> {
  const data = await apiFetch<OCSResponse<ServerInfo>>(
    "/ocs/v2.php/apps/serverinfo/api/v1/info?format=json",
    { basicAuth: opts.basicAuth }
  );
  return data.ocs.data;
}
