// src/components/home/UserSessionDisplay.tsx
"use client"; // This directive makes this a Client Component

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Session } from "next-auth"; // Import Session type

interface UserSessionDisplayProps {
  session: Session | null; // Pass the session object as a prop
}

export default function UserSessionDisplay({ session }: UserSessionDisplayProps) {
  return (
    <div className="flex flex-col gap-8 items-center sm:items-start w-full max-w-4xl">
      <h1 className="text-4xl font-bold text-center sm:text-left mb-4">
        Welcome to Next.js Auth App
      </h1>

      {session ? (
        // Display user details if logged in
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md text-center sm:text-left">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">
            Hello, {session.user?.username || session.user?.email}!
          </h2>
          <p className="text-gray-700 mb-2">
            <span className="font-medium">User ID:</span> {session.user?.id}
          </p>
          <p className="text-gray-700 mb-2">
            <span className="font-medium">Email:</span> {session.user?.email}
          </p>
          <p className="text-gray-700 mb-2">
            <span className="font-medium">Role:</span> {session.user?.role}
          </p>
          <p className="text-gray-700 mb-4">
            <span className="font-medium">Email Verified:</span>{" "}
            {session.user?.isVerified ? (
              <span className="text-green-600">Yes</span>
            ) : (
              <span className="text-red-600">No</span>
            )}
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/api/auth/login" })}
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        // Prompt to log in or sign up if not logged in
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            You are not logged in.
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in or create an account to view your details.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/api/auth/login"
              className="inline-flex items-center justify-center rounded-full border border-solid border-transparent transition-colors bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full border border-solid border-gray-300 transition-colors hover:bg-gray-100 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
