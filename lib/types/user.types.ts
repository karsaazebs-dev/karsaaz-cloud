// User / auth types

export interface KarsaazUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  groups: string[];
  isAdmin: boolean;
  quota: UserQuota;
  language: string;
  locale: string;
}

export interface UserQuota {
  used: number;
  total: number;
  free: number;
  relative: number;
}

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  username: string;
  /** Base64-encoded "username:apppassword" for Basic auth */
  basicAuth: string;
  isAdmin: boolean;
}
