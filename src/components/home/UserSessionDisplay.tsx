// src/components/home/UserSessionDisplay.tsx
"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Session } from "next-auth";

interface UserSessionDisplayProps {
  session: Session | null;
}

export default function UserSessionDisplay({ session }: UserSessionDisplayProps) {
  return (
    <div className="flex flex-col gap-8 items-center sm:items-start w-full max-w-4xl">
      <h1 className="text-4xl font-bold text-center sm:text-left mb-4 text-foreground">
        Welcome to System Design Platform
      </h1>

      {session ? (
        <div className="bg-card text-card-foreground shadow-lg rounded-lg p-8 w-full max-w-md text-center sm:text-left border">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            Hello, {session.user?.username || session.user?.email}!
          </h2>
          <p className="text-muted-foreground mb-2">
            <span className="font-medium text-foreground">User ID:</span> {session.user?.id}
          </p>
          <p className="text-muted-foreground mb-2">
            <span className="font-medium text-foreground">Email:</span> {session.user?.email}
          </p>
          <p className="text-muted-foreground mb-2">
            <span className="font-medium text-foreground">Role:</span> {session.user?.role}
          </p>
          <p className="text-muted-foreground mb-2">
            <span className="font-medium text-foreground">Subscription:</span> {session.user?.subscriptionStatus}
          </p>
          <p className="text-muted-foreground mb-2">
            <span className="font-medium text-foreground">Design Credits:</span> {session.user?.dailyDesignCredits}
          </p>
          <p className="text-muted-foreground mb-2">
            <span className="font-medium text-foreground">Problem Credits:</span> {session.user?.dailyProblemCredits}
          </p>
          
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-4 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold py-2 px-4 rounded-full transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow-lg rounded-lg p-8 w-full max-w-md text-center border">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            You are not logged in.
          </h2>
          <p className="text-muted-foreground mb-6">
            Please sign in or create an account to view your details.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-input transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full border border-input transition-colors hover:bg-accent hover:text-accent-foreground font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}