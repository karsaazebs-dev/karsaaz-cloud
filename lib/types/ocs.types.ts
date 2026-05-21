// OCS API envelope types

export interface OCSMeta {
  status: string;
  statuscode: number;
  message: string;
  totalitems?: string;
  itemsperpage?: string;
}

export interface OCSResponse<T> {
  ocs: {
    meta: OCSMeta;
    data: T;
  };
}

export interface OCSUser {
  id: string;
  displayname: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  twitter: string;
  groups: string[];
  language: string;
  locale: string;
  quota: {
    free: number;
    used: number;
    total: number;
    relative: number;
    quota: number;
  };
  enabled: boolean;
  subadmin: string[];
  backend: string;
  last_login: number;
}

export interface OCSCapabilities {
  version: {
    major: number;
    minor: number;
    micro: number;
    string: string;
    edition: string;
    extendedSupport: boolean;
  };
  capabilities: Record<string, unknown>;
}

export interface OCSServerInfo {
  system: {
    version: string;
    theme: string;
    enable_avatars: boolean;
    enable_previews: boolean;
    memcacheBackend: string;
    memcacheFrontend: string;
    filelocking_enabled: boolean;
    debug: boolean;
    freespace: number;
  };
}

export interface OCSShare {
  id: string;
  share_type: number;
  uid_owner: string;
  displayname_owner: string;
  permissions: number;
  can_edit: boolean;
  can_delete: boolean;
  stime: number;
  parent: null | string;
  expiration: null | string;
  token: null | string;
  uid_file_owner: string;
  note: string;
  label: null | string;
  displayname_file_owner: string;
  path: string;
  item_type: string;
  item_source: string;
  file_source: string;
  file_target: string;
  file_parent: string;
  share_with: null | string;
  share_with_displayname: null | string;
  share_with_displayname_unique: null | string;
  status: Record<string, string>;
  share_with_additional_info: null | string;
  hide_download: number;
  url?: string;
  mail_send?: number;
  send_password_by_talk?: boolean;
  mimetype?: string;
}

export interface OCSActivity {
  activity_id: number;
  app: string;
  type: string;
  user: string;
  affecteduser: string;
  timestamp: number;
  message: string;
  message_rich: string;
  message_rich_parameters: Record<string, OCSRichParameter>;
  subject: string;
  subject_rich: string;
  subject_rich_parameters: Record<string, OCSRichParameter>;
  icon: string;
  link: string;
  objects?: Record<string, string>;
}

export interface OCSRichParameter {
  type: string;
  id: string;
  name: string;
  path?: string;
  link?: string;
  server?: string;
  source?: string;
}

export interface OCSNotification {
  notification_id: number;
  app: string;
  user: string;
  datetime: string;
  object_type: string;
  object_id: string;
  subject: string;
  message: string;
  link: string;
  subjectRich: string;
  subjectRichParameters: Record<string, OCSRichParameter>;
  messageRich: string;
  messageRichParameters: Record<string, OCSRichParameter>;
  icon: string;
  actions: OCSNotificationAction[];
}

export interface OCSNotificationAction {
  label: string;
  link: string;
  type: string;
  primary: boolean;
}

// ── User status (user_status app) ───────────────────────────────────────────

export type UserStatusType = "online" | "away" | "dnd" | "invisible" | "offline";

export interface OCSUserStatus {
  userId: string;
  message: string | null;
  messageId: string | null;
  messageIsPredefined: boolean;
  icon: string | null;
  clearAt: number | null;
  status: UserStatusType;
  statusIsUserDefined: boolean;
}

export interface OCSPredefinedStatus {
  id: string;
  icon: string;
  message: string;
  clearAt: {
    type: "period" | "end-of";
    time: number | string;
  } | null;
}

// ── Workflow engine (workflowengine app) ─────────────────────────────────────

export interface WorkflowCheck {
  class: string;
  operator: string;
  value: string;
}

export interface WorkflowOperation {
  id: number;
  class: string;
  name: string;
  checks: WorkflowCheck[];
  operation: string;
  entity: string;
  events: string[];
}

/** index() returns operations keyed by operation class name. */
export type WorkflowsByClass = Record<string, WorkflowOperation[]>;

// Registry shapes, delivered as initial state on the admin workflow page.
export interface WorkflowOperator {
  id: string; // operation class
  icon: string;
  name: string;
  description: string;
  fixedEntity: string; // non-empty when the operation is tied to one entity
  isComplex: boolean;
  triggerHint: string;
}

export interface WorkflowEntityEvent {
  eventName: string;
  displayName: string;
}

export interface WorkflowEntity {
  id: string; // entity class
  icon: string;
  name: string;
  events: WorkflowEntityEvent[];
}

export interface WorkflowCheckDef {
  id: string; // check class
  supportedEntities: string[];
}

export interface WorkflowRegistry {
  operators: WorkflowOperator[];
  entities: WorkflowEntity[];
  checks: WorkflowCheckDef[];
  scope: number;
}

export interface CreateWorkflowPayload {
  class: string;
  name: string;
  checks: WorkflowCheck[];
  operation: string;
  entity: string;
  events: string[];
}

// ── Weather status (weather_status app) ──────────────────────────────────────

export interface OCSWeatherLocation {
  lat: string | null;
  lon: string | null;
  address: string | null;
  mode: number;
}

export interface OCSWeatherForecastPoint {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature?: number;
        wind_speed?: number;
        relative_humidity?: number;
      };
    };
    next_1_hours?: { summary: { symbol_code: string } };
    next_6_hours?: {
      summary: { symbol_code: string };
      details?: { air_temperature_max?: number; air_temperature_min?: number };
    };
  };
}

export type OCSWeatherForecast = OCSWeatherForecastPoint[] | { error: string };

export interface OCSSharee {
  label: string;
  shareWithDescription?: string;
  value: {
    shareType: number;
    shareWith: string;
  };
}

export interface OCSShareeResponse {
  exact: {
    users: OCSSharee[];
    groups: OCSSharee[];
    remotes: OCSSharee[];
  };
  users: OCSSharee[];
  groups: OCSSharee[];
  remotes: OCSSharee[];
}
