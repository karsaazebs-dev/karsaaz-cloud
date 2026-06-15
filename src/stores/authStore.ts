/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import {
  configureClient,
  encodeBasicAuth,
  buildUserAgent,
} from "@karsaaz/cloud-api";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { brand } from "../constants/brand";

const KEYS = {
  server: "karsaaz_server_url",
  username: "karsaaz_username",
  password: "karsaaz_app_password",
  basicAuth: "karsaaz_basic_auth",
  accounts: "karsaaz_accounts",
  biometric: "karsaaz_biometric_enabled",
} as const;

export interface StoredAccount {
  id: string;
  serverUrl: string;
  username: string;
  displayName: string;
  appPassword: string;
  basicAuth: string;
}

interface AuthState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  serverUrl: string;
  username: string;
  displayName: string;
  appPassword: string;
  basicAuth: string;
  accounts: StoredAccount[];
  activeAccountId: string | null;
  biometricEnabled: boolean;
  hydrate: () => Promise<void>;
  setSession: (params: {
    serverUrl: string;
    username: string;
    displayName: string;
    appPassword: string;
  }) => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
  addAccount: (params: {
    serverUrl: string;
    username: string;
    displayName: string;
    appPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

function configureApi(serverUrl: string, basicAuth: string): void {
  const osVersion = String(Platform.Version);
  const platform = Platform.OS === "ios" ? "iOS" : "Android";
  configureClient({
    baseUrl: serverUrl,
    userAgent: buildUserAgent(platform, osVersion),
    getBasicAuth: () => basicAuth,
  });
}

async function persistAccounts(accounts: StoredAccount[]): Promise<void> {
  await SecureStore.setItemAsync(KEYS.accounts, JSON.stringify(accounts));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  isAuthenticated: false,
  serverUrl: brand.defaultServerUrl,
  username: "",
  displayName: "",
  appPassword: "",
  basicAuth: "",
  accounts: [],
  activeAccountId: null,
  biometricEnabled: false,

  hydrate: async () => {
    const serverUrl =
      (await SecureStore.getItemAsync(KEYS.server)) ?? brand.defaultServerUrl;
    const username = (await SecureStore.getItemAsync(KEYS.username)) ?? "";
    const appPassword = (await SecureStore.getItemAsync(KEYS.password)) ?? "";
    const basicAuth = (await SecureStore.getItemAsync(KEYS.basicAuth)) ?? "";
    const accountsRaw = await SecureStore.getItemAsync(KEYS.accounts);
    const biometricRaw = await SecureStore.getItemAsync(KEYS.biometric);
    const accounts: StoredAccount[] = accountsRaw ? JSON.parse(accountsRaw) : [];

    if (basicAuth && username) {
      configureApi(serverUrl, basicAuth);
      set({
        isHydrated: true,
        isAuthenticated: true,
        serverUrl,
        username,
        displayName: username,
        appPassword,
        basicAuth,
        accounts,
        activeAccountId: username,
        biometricEnabled: biometricRaw === "true",
      });
      return;
    }

    set({
      isHydrated: true,
      isAuthenticated: false,
      serverUrl,
      accounts,
      biometricEnabled: biometricRaw === "true",
    });
  },

  setSession: async ({ serverUrl, username, displayName, appPassword }) => {
    const basicAuth = encodeBasicAuth(username, appPassword);
    await SecureStore.setItemAsync(KEYS.server, serverUrl);
    await SecureStore.setItemAsync(KEYS.username, username);
    await SecureStore.setItemAsync(KEYS.password, appPassword);
    await SecureStore.setItemAsync(KEYS.basicAuth, basicAuth);

    const account: StoredAccount = {
      id: username,
      serverUrl,
      username,
      displayName,
      appPassword,
      basicAuth,
    };
    const accounts = [account, ...get().accounts.filter((a) => a.id !== username)];
    await persistAccounts(accounts);
    configureApi(serverUrl, basicAuth);

    set({
      isAuthenticated: true,
      serverUrl,
      username,
      displayName,
      appPassword,
      basicAuth,
      accounts,
      activeAccountId: username,
    });
  },

  switchAccount: async (accountId) => {
    const account = get().accounts.find((a) => a.id === accountId);
    if (!account) return;
    await SecureStore.setItemAsync(KEYS.server, account.serverUrl);
    await SecureStore.setItemAsync(KEYS.username, account.username);
    await SecureStore.setItemAsync(KEYS.basicAuth, account.basicAuth);
    const appPassword = (await SecureStore.getItemAsync(KEYS.password)) ?? "";
    configureApi(account.serverUrl, account.basicAuth);
    set({
      isAuthenticated: true,
      serverUrl: account.serverUrl,
      username: account.username,
      displayName: account.displayName,
      appPassword,
      basicAuth: account.basicAuth,
      activeAccountId: accountId,
    });
  },

  addAccount: async ({ serverUrl, username, displayName, appPassword }) => {
    const basicAuth = encodeBasicAuth(username, appPassword);
    const account: StoredAccount = {
      id: `${username}@${serverUrl}`,
      serverUrl,
      username,
      displayName,
      appPassword,
      basicAuth,
    };
    const accounts = [account, ...get().accounts.filter((a) => a.id !== account.id)];
    await persistAccounts(accounts);
    set({ accounts });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(KEYS.username);
    await SecureStore.deleteItemAsync(KEYS.password);
    await SecureStore.deleteItemAsync(KEYS.basicAuth);
    set({
      isAuthenticated: false,
      username: "",
      displayName: "",
      appPassword: "",
      basicAuth: "",
      activeAccountId: null,
    });
  },

  setBiometricEnabled: async (enabled) => {
    await SecureStore.setItemAsync(KEYS.biometric, enabled ? "true" : "false");
    set({ biometricEnabled: enabled });
  },
}));

export function getDefaultServerUrl(): string {
  return (
    (Constants.expoConfig?.extra?.defaultServerUrl as string | undefined) ??
    brand.defaultServerUrl
  );
}
