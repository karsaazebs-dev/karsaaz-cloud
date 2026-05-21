// WebDAV property types

export interface WebDAVProperties {
  "d:resourcetype"?: { "d:collection"?: unknown } | Record<string, never>;
  "d:getcontenttype"?: string;
  "d:getcontentlength"?: number;
  "d:getlastmodified"?: string;
  "d:getetag"?: string;
  "oc:id"?: string;
  "oc:fileid"?: number;
  "oc:permissions"?: string;
  "oc:size"?: number;
  "oc:favorite"?: number;
  "oc:owner-id"?: string;
  "oc:owner-display-name"?: string;
  "oc:share-types"?: { "oc:share-type"?: number | number[] };
  "oc:tags"?: string[];
  "nc:has-preview"?: boolean;
  "nc:is-encrypted"?: number;
  "nc:mount-type"?: string;
  "nc:note"?: string;
  "nc:trashbin-filename"?: string;
  "nc:trashbin-original-location"?: string;
  "nc:trashbin-deletion-time"?: number;
}

export interface WebDAVPropfindRequest {
  depth: "0" | "1" | "infinity";
  properties: string[];
}
