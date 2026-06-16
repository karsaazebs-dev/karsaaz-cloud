/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare module "@karsaaz/cloud-api" {
  export type FileType =
    | "directory"
    | "image"
    | "video"
    | "audio"
    | "pdf"
    | "spreadsheet"
    | "presentation"
    | "document"
    | "archive"
    | "text"
    | "other";

  export interface KarsaazFile {
    id: string;
    fileId: number;
    name: string;
    path: string;
    type: "directory" | "file";
    mimeType: string;
    fileType: FileType;
    size: number;
    lastModified: Date;
    etag: string;
    permissions: number;
    isFavorite: boolean;
    isShared: boolean;
    shareTypes: any[];
    tags: string[];
    hasPreview: boolean;
  }

  export function createWebDAVClient(username?: string, appPassword?: string): any;
  export function listDirectory(client: any, username: string, currentPath: string): Promise<KarsaazFile[]>;
  export function getPathInfo(client: any, username: string, path: string): Promise<KarsaazFile | null>;
  export function deleteItem(client: any, username: string, path: string): Promise<void>;
  export function createDirectory(client: any, username: string, path: string): Promise<void>;
  export function uploadFile(client: any, username: string, path: string, data: any): Promise<void>;
  export function downloadFile(client: any, username: string, path: string): Promise<any>;
  export function moveFile(client: any, username: string, srcPath: string, destPath: string): Promise<void>;
  export function configureClient(client: any, options?: any): void;
  export function encodeBasicAuth(username?: string, appPassword?: string): string;
  export function buildUserAgent(clientName: string, clientVersion: string): string;
  export function getCurrentUser(options?: any): Promise<any>;
  export function listTrash(options: any): Promise<any[]>;
  export function listVersions(options: any, fileId: number): Promise<any[]>;
  export function restoreTrashItem(options: any, trashId: number): Promise<void>;
  export function createShare(options: any, params: any): Promise<any>;
  export function deleteShare(options: any, shareId: string): Promise<void>;
  export function listShares(options: any, params?: any): Promise<any>;
  export function listActivity(options: any): Promise<any[]>;
  export function getFileDownloadUrl(client: any, username: string, path: string): string;
  export function fetchStatus(serverUrl?: string): Promise<any>;
  export function initLoginFlow(serverUrl: string, options?: any): Promise<any>;
  export function pollLoginFlow(serverUrl: string, token: string): Promise<any>;
  export interface DirectLoginResult {
    loginName: string;
    displayName: string;
    appPassword: string;
    server: string;
  }
  export function loginWithPassword(username: string, password: string): Promise<DirectLoginResult>;
  export function setFavorite(
    client: unknown,
    username: string,
    path: string,
    favorite: boolean
  ): Promise<void>;
  export interface SystemTag {
    id: number;
    name: string;
    userVisible: boolean;
    userAssignable: boolean;
    canAssign: boolean;
  }
  export function listSystemTags(opts: { basicAuth: string }): Promise<SystemTag[]>;
  export function createSystemTag(opts: { basicAuth: string }, name: string): Promise<SystemTag>;
  export function getFileSystemTags(opts: { basicAuth: string }, fileId: number): Promise<SystemTag[]>;
  export function assignSystemTag(
    opts: { basicAuth: string },
    fileId: number,
    tagId: number
  ): Promise<void>;
  export function unassignSystemTag(
    opts: { basicAuth: string },
    fileId: number,
    tagId: number
  ): Promise<void>;
}
