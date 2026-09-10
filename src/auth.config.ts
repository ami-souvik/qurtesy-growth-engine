import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (credentials.email === "admin@qurtesy.com" && credentials.password === "qurtesy2026") {
          return { id: "1", name: "Admin", email: "admin@qurtesy.com" }
        }
        return null
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise false
      return !!auth
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig
