// NextAuth.js v5 configuration — Karsaaz Cloud credentials provider

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const BACKEND_URL =
  process.env.KARSAAZ_BACKEND_URL || "http://localhost:3030";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Karsaaz Cloud",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;
        const basicAuth = btoa(`${username}:${password}`);

        try {
          // Validate by fetching current user from OCS API
          const response = await fetch(
            `${BACKEND_URL}/ocs/v2.php/cloud/user?format=json`,
            {
              headers: {
                Authorization: `Basic ${basicAuth}`,
                "OCS-APIREQUEST": "true",
              },
            }
          );

          if (!response.ok) return null;

          const json = await response.json();
          const userData = json?.ocs?.data;
          if (!userData) return null;

          // Check if admin
          let isAdmin = false;
          try {
            const capResp = await fetch(
              `${BACKEND_URL}/ocs/v2.php/cloud/groups/admin/users?format=json`,
              {
                headers: {
                  Authorization: `Basic ${basicAuth}`,
                  "OCS-APIREQUEST": "true",
                },
              }
            );
            if (capResp.ok) {
              const capJson = await capResp.json();
              const adminUsers: string[] = capJson?.ocs?.data?.users ?? [];
              isAdmin = adminUsers.includes(username);
            }
          } catch {
            // ignore — non-critical
          }

          return {
            id: username,
            name: userData.displayname || username,
            email: userData.email || "",
            // Custom fields stored in token
            username,
            basicAuth,
            isAdmin,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.username = (user as { username?: string }).username;
        token.basicAuth = (user as { basicAuth?: string }).basicAuth;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      (session as Record<string, unknown> & typeof session).username = token.username;
      (session as Record<string, unknown> & typeof session).basicAuth = token.basicAuth;
      (session as Record<string, unknown> & typeof session).isAdmin = token.isAdmin;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },
});
