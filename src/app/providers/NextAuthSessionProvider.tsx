// src/app/providers/NextAuthSessionProvider.tsx
"use client"; // This directive makes this component a Client Component

import { SessionProvider } from "next-auth/react";
import React from "react";

interface NextAuthSessionProviderProps {
  children: React.ReactNode;
}

export default function NextAuthSessionProvider({ children }: NextAuthSessionProviderProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}