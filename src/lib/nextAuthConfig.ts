import { NextAuthOptions, DefaultUser, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/userService";
import { Role, SubscriptionStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      role: Role;
      isVerified: boolean;
      subscriptionStatus: SubscriptionStatus;
      dailyDesignCredits: number;
      dailyProblemCredits: number;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username: string;
    role: Role;
    isVerified: boolean;
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

          if (!user.isVerified) {
            throw new Error("Email not verified. Please verify your email to log in.");
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
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
        token.isVerified = user.isVerified;
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
        session.user.isVerified = token.isVerified as boolean;
        session.user.subscriptionStatus = token.subscriptionStatus as SubscriptionStatus;
        session.user.dailyDesignCredits = token.dailyDesignCredits as number;
        session.user.dailyProblemCredits = token.dailyProblemCredits as number;
      }
      return session;
    },
  },
  pages: {
    signIn: "/(auth)/login",
  },
};