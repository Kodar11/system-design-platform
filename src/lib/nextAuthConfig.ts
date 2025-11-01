import { NextAuthOptions, DefaultUser, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/userService";
import resetDailyCreditsForUser from '@/lib/prisma/credits';
import { Role, SubscriptionStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      role: Role;
      subscriptionStatus: SubscriptionStatus;
      dailyDesignCredits: number;
      dailyProblemCredits: number;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username: string;
    role: Role;
    subscriptionStatus: SubscriptionStatus;
    dailyDesignCredits: number;
    dailyProblemCredits: number;
  }
}

export const NEXT_AUTH_CONFIG: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Enter your email" },
        password: { label: "Password", type: "password", placeholder: "Enter your password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Missing email or password");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("User not found");
          }


          // Trim stored hash to avoid accidental whitespace/newline issues and
          // ensure we compare against a string.
          const storedHash = (user.password || '').toString().trim();
          const isPasswordValid = await bcrypt.compare(credentials.password, storedHash);

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
            dailyDesignCredits: user.dailyDesignCredits,
            dailyProblemCredits: user.dailyProblemCredits,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error("Authorization error:", error.message);
            throw error;
          } else {
            console.error("Authorization error:", error);
            throw new Error("An unknown authorization error occurred.");
          }
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.username = user.username;
        token.email = user.email;
        token.role = user.role;
        token.subscriptionStatus = user.subscriptionStatus;
        token.dailyDesignCredits = user.dailyDesignCredits;
        token.dailyProblemCredits = user.dailyProblemCredits;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.role = token.role as Role;
        session.user.subscriptionStatus = token.subscriptionStatus as SubscriptionStatus;
        session.user.dailyDesignCredits = token.dailyDesignCredits as number;
        session.user.dailyProblemCredits = token.dailyProblemCredits as number;
        // Attempt to reset daily credits on login/session creation. This ensures
        // users who are redirected to public pages (like '/') still get their
        // daily allowances updated immediately after sign-in.
        try {
          const uid = token.uid as string | undefined;
          if (uid) {
            // Fire-and-forget is acceptable but we await here to ensure the
            // session returns with updated DB values where possible.
            await resetDailyCreditsForUser(uid);
          }
        } catch (err) {
          console.error('Failed to reset daily credits during session callback:', err);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/(auth)/login",
  },
};