// src/components/auth/SignupFormClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupUser } from "@/app/actions";

export default function SignupFormClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await signupUser(formData);
    } catch (err: unknown) { // Use 'unknown' instead of 'any'
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="username">
            Username
          </label>
          <input id="username" name="username" type="text" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input id="password" name="password" type="password" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="role">
            Role
          </label>
          <select id="role" name="role" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="CONTENT_ADDER">Content Adder</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 disabled:bg-gray-400">
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
        <p className="text-center">
          Already have an account?{" "}
          <button type="button" className="text-blue-500 underline" onClick={() => router.push("/api/auth/login")}>
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}