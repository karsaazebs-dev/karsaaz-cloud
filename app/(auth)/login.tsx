/*
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchStatus,
  initLoginFlow,
  pollLoginFlow,
  getCurrentUser,
  configureClient,
  buildUserAgent,
  encodeBasicAuth,
} from "@karsaaz/cloud-api";
import { Platform } from "react-native";
import { brand } from "@/src/constants/brand";
import { figmaAssets } from "@/src/constants/assets";
import { theme } from "@/src/constants/theme";
import { useAuthStore, getDefaultServerUrl } from "@/src/stores/authStore";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { BackButton } from "@/src/components/ui/BackButton";
import { LanguageSelector } from "@/src/components/ui/LanguageSelector";
import { TextField } from "@/src/components/ui/TextField";

type Step = "connect" | "credentials" | "webview";

function normalizeServerUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return brand.defaultServerUrl;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }
  return `http://${trimmed.replace(/\/$/, "")}`;
}

function connectionErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (
    /NoRouteToHost|ECONNREFUSED|ENETUNREACH|Network request failed|Failed to connect|Host unreachable/i.test(
      raw
    )
  ) {
    return (
      `Cannot reach the server at ${brand.defaultServerUrl.replace(/^https?:\/\//, "")}. ` +
      "Check that Karsaaz Cloud is running, your phone is on the same Wi‑Fi/LAN, " +
      "and the server address on the login screen is correct."
    );
  }
  return raw || "Could not reach server";
}

function getRecentServers(): string[] {
  return [brand.defaultServerUrl];
}

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [serverUrl, setServerUrl] = useState(getDefaultServerUrl());
  const [step, setStep] = useState<Step>("connect");
  const [serverDetected, setServerDetected] = useState(false);
  const [serverVersion, setServerVersion] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [loginUrl, setLoginUrl] = useState("");
  const [pollToken, setPollToken] = useState("");
  const [pollEndpoint, setPollEndpoint] = useState("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startPolling = useCallback(
    (endpoint: string, token: string, baseServer: string) => {
      stopPolling();
      setIsPolling(true);
      pollRef.current = setInterval(async () => {
        try {
          const result = await pollLoginFlow(endpoint, token);
          if (result?.loginName && result.appPassword) {
            stopPolling();
            const basicAuth = encodeBasicAuth(result.loginName, result.appPassword);
            configureClient({
              baseUrl: (result.server || baseServer).replace(/\/$/, ""),
              userAgent: buildUserAgent(
                Platform.OS === "ios" ? "iOS" : "Android",
                String(Platform.Version)
              ),
              getBasicAuth: () => basicAuth,
            });
            const user = await getCurrentUser({ basicAuth });
            await setSession({
              serverUrl: result.server || baseServer,
              username: result.loginName,
              displayName: user.displayname || result.loginName,
              appPassword: result.appPassword,
            });
          }
        } catch {
          // keep polling
        }
      }, 2000);
    },
    [setSession, stopPolling]
  );

  const configureForServer = () => {
    const osVersion = String(Platform.Version);
    const platform = Platform.OS === "ios" ? "iOS" : "Android";
    const baseUrl = normalizeServerUrl(serverUrl);
    configureClient({
      baseUrl,
      userAgent: buildUserAgent(platform, osVersion),
      getBasicAuth: () => null,
    });
  };

  const handleDetectServer = async () => {
    setLoading(true);
    try {
      configureForServer();
      const status = await fetchStatus();
      if (!status.installed) throw new Error("Server is not installed");
      setServerDetected(true);
      setServerVersion(`${brand.serverProductName} v${status.version}`);
    } catch (error) {
      setServerDetected(false);
      setServerVersion("");
      Alert.alert("Connection failed", connectionErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleConnectContinue = async () => {
    if (!serverDetected) {
      setLoading(true);
      try {
        configureForServer();
        const status = await fetchStatus();
        if (!status.installed) throw new Error("Server is not installed");
        setServerDetected(true);
        setServerVersion(`${brand.serverProductName} v${status.version}`);
        setStep("credentials");
      } catch (error) {
        Alert.alert("Connection failed", connectionErrorMessage(error));
      } finally {
        setLoading(false);
      }
      return;
    }
    setStep("credentials");
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      configureForServer();
      const flow = await initLoginFlow(normalizeServerUrl(serverUrl));
      setLoginUrl(flow.login);
      setPollToken(flow.poll.token);
      setPollEndpoint(flow.poll.endpoint);
      setStep("webview");
      startPolling(flow.poll.endpoint, flow.poll.token, serverUrl);
    } catch (error) {
      Alert.alert(
        "Sign in failed",
        error instanceof Error ? error.message : "Could not start login"
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === "webview") {
    return (
      <View style={styles.flex}>
        <View style={styles.webHeader}>
          <Text style={styles.webTitle}>Sign in to {brand.serverProductName}</Text>
          {isPolling && <ActivityIndicator color={theme.colors.accent} />}
        </View>
        <WebView
          source={{ uri: loginUrl }}
          style={styles.flex}
          onNavigationStateChange={() => {
            if (pollToken && pollEndpoint) {
              startPolling(pollEndpoint, pollToken, serverUrl);
            }
          }}
        />
        <Pressable
          style={styles.cancelBtn}
          onPress={() => {
            stopPolling();
            setStep("credentials");
          }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  if (step === "credentials") {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <BackButton onPress={() => setStep("connect")} />
            <LanguageSelector />
          </View>

          <Text style={styles.heading}>Enter Credentials</Text>
          <Text style={styles.subheading}>
            Sign in to your {brand.appName} account.
          </Text>

          <View style={styles.serverBanner}>
            <View style={styles.serverIconWrap}>
              <Ionicons name="server-outline" size={16} color={theme.colors.accent} />
            </View>
            <View style={styles.serverInfo}>
              <Text style={styles.serverHost}>{serverUrl.replace(/^https?:\/\//, "")}</Text>
              <Text style={styles.serverMeta}>
                {serverVersion || brand.serverProductName} · SSL verified
              </Text>
              <View style={styles.connectedPill}>
                <Ionicons name="shield-checkmark" size={14} color={theme.colors.success} />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            </View>
          </View>

          <View style={styles.form}>
            <TextField
              label="User ID"
              value={username}
              onChangeText={setUsername}
              placeholder="yourname@company.io"
              leftIcon="person-outline"
              keyboardType="email-address"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              leftIcon="lock-closed-outline"
              secureTextEntry={!showPassword}
              onToggleSecure={() => setShowPassword((v) => !v)}
            />
          </View>

          <Pressable
            style={styles.keepRow}
            onPress={() => setKeepSignedIn((v) => !v)}
          >
            <View style={[styles.checkbox, keepSignedIn && styles.checkboxOn]}>
              {keepSignedIn && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={styles.keepText}>Keep me signed in</Text>
          </Pressable>

          <PrimaryButton
            label="Continue"
            onPress={handleSignIn}
            loading={loading}
            showArrow
          />

          <View style={styles.qrBtn}>
            <Ionicons name="qr-code-outline" size={28} color={theme.colors.accent} />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or sign in with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.altRow}>
            <Pressable style={styles.altBtn}>
              <Ionicons name="finger-print" size={20} color={theme.colors.accent} />
              <Text style={styles.altLabel}>Biometric</Text>
            </Pressable>
            <Pressable style={styles.altBtn}>
              <Ionicons name="key-outline" size={20} color={theme.colors.accent} />
              <Text style={styles.altLabel}>Passkey</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <View style={styles.spacer40} />
          <LanguageSelector />
        </View>

        <Text style={styles.heading}>Connect to Server</Text>
        <Text style={styles.subheading}>
          Enter your server address to get started. We'll detect your{" "}
          {brand.serverProductName} instance automatically.
        </Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Server Address</Text>
          <View style={styles.serverInputWrap}>
            <Image source={figmaAssets.login.globe} style={styles.inputIcon} />
            <TextInput
              style={styles.serverInput}
              value={serverUrl}
              onChangeText={(text) => {
                setServerUrl(text);
                setServerDetected(false);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="192.168.18.61:3030"
              placeholderTextColor={theme.colors.textMuted}
              onBlur={handleDetectServer}
            />
            <Image source={figmaAssets.login.link} style={styles.inputIcon} />
          </View>
          {serverDetected && (
            <View style={styles.detectedRow}>
              <Image source={figmaAssets.login.checkDetected} style={styles.inputIcon} />
              <Text style={styles.detectedText}>
                Server detected · {serverVersion}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.secureCard}>
          <View style={styles.secureIcon}>
            <Image source={figmaAssets.login.shieldWhite} style={styles.shieldIcon} />
          </View>
          <View style={styles.secureCopy}>
            <Text style={styles.secureTitle}>Secure connection</Text>
            <Text style={styles.secureSub}>End-to-end encrypted · SSL verified</Text>
          </View>
          <Image source={figmaAssets.login.lock} style={styles.inputIcon} />
        </View>

        <PrimaryButton
          label="Continue"
          onPress={handleConnectContinue}
          loading={loading}
          showArrow
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>recent servers</Text>
          <View style={styles.divider} />
        </View>

        {getRecentServers().map((url) => (
          <Pressable
            key={url}
            style={styles.recentBtn}
            onPress={() => {
              setServerUrl(url);
              setServerDetected(false);
            }}
          >
            <View style={styles.recentIcon}>
              <Image source={figmaAssets.login.recentClock} style={styles.inputIcon} />
            </View>
            <Text style={styles.recentHost}>{url.replace(/^https?:\/\//, "")}</Text>
            <Image source={figmaAssets.login.chevronRight} style={styles.inputIcon} />
          </Pressable>
        ))}

        <View style={styles.helpRow}>
          <Text style={styles.helpText}>Need help? </Text>
          <Text style={styles.helpLink}>Setup Guide</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: theme.colors.surface },
  scroll: { padding: theme.spacing.screen, paddingBottom: 40 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  spacer40: { width: 40 },
  heading: {
    fontSize: theme.typography.hero.fontSize,
    lineHeight: theme.typography.hero.lineHeight,
    letterSpacing: theme.typography.hero.letterSpacing,
    color: theme.colors.textDark,
    marginBottom: 8,
  },
  subheading: {
    fontSize: theme.typography.bodySm.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.textMuted,
    marginBottom: 28,
  },
  fieldBlock: { gap: 8, marginBottom: 20 },
  fieldLabel: {
    fontSize: theme.typography.bodySm.fontSize,
    color: theme.colors.textDark,
  },
  serverInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    height: 48,
    ...theme.shadow.card,
  },
  inputIcon: { width: 16, height: 16, resizeMode: "contain" },
  shieldIcon: { width: 20, height: 20, resizeMode: "contain" },
  serverInput: { flex: 1, fontSize: 16, color: theme.colors.textDark },
  detectedRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 4 },
  detectedText: { fontSize: 12, color: theme.colors.successBright },
  secureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.infoBg,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 24,
    ...theme.shadow.card,
  },
  secureIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  secureCopy: { flex: 1 },
  secureTitle: { fontSize: 14, color: theme.colors.textDark },
  secureSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 20,
  },
  divider: { flex: 1, height: 1, backgroundColor: theme.colors.borderLight },
  dividerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textTransform: "lowercase",
  },
  recentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 17,
    height: 48,
    marginBottom: 8,
    ...theme.shadow.card,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  recentHost: { flex: 1, fontSize: 14, color: theme.colors.textDark },
  helpRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  helpText: { fontSize: 14, color: theme.colors.textMuted },
  helpLink: { fontSize: 14, color: theme.colors.link },
  serverBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(241,246,252,0.4)",
    borderWidth: 1,
    borderColor: "rgba(229,229,229,0.4)",
    borderRadius: theme.radius.lg,
    padding: 13,
    marginBottom: 24,
  },
  serverIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(29,132,245,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  serverInfo: { flex: 1, gap: 4 },
  serverHost: { fontSize: 14, color: theme.colors.textDark },
  serverMeta: { fontSize: 12, color: theme.colors.textMuted },
  connectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(29,132,245,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    marginTop: 4,
  },
  connectedText: { fontSize: 12, color: theme.colors.success },
  form: { gap: 16, marginBottom: 16 },
  keepRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  keepText: { fontSize: 14, color: theme.colors.textMuted },
  qrBtn: {
    alignSelf: "center",
    marginTop: 20,
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "rgba(29,132,245,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  altRow: { flexDirection: "row", gap: 12 },
  altBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  altLabel: { fontSize: 14, color: theme.colors.textDark },
  webHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  webTitle: { fontWeight: "600", flex: 1, color: theme.colors.text },
  cancelBtn: { padding: 12, alignItems: "center" },
  cancelText: { color: theme.colors.accent, fontWeight: "600" },
});
