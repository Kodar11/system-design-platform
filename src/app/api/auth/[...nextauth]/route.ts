import NextAuth from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig";

export const GET = NextAuth(NEXT_AUTH_CONFIG);
export const POST = NextAuth(NEXT_AUTH_CONFIG);
