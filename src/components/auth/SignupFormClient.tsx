// src/components/auth/SignupFormClient.tsx
"use client"; // This directive makes this a Client Component

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";



const SignupFormClient = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(""); // Clear previous errors

    try {
      // Step 1: Create the user
      const userCreationRes = await axios.post("/api/users", {
        username,
        email,
        password,
        role,
      });

      if (userCreationRes.status === 201) {
        // Step 2: If user creation is successful, send the OTP
        // It's good to wrap this in its own try-catch for specific error handling
        try {
          const otpSendRes = await axios.post("/api/send-otp", { email: email });
          console.log("OTP Send Response:", otpSendRes.data); // Log success response

          if (otpSendRes.status === 200) {
            // Only redirect if OTP was successfully sent
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          } else {
            // Handle unexpected non-200 status from send-otp
            setError(otpSendRes.data.error || "Failed to send OTP after signup.");
          }
        } catch (otpError) {
          // Catch errors specifically from the OTP sending
          if (axios.isAxiosError(otpError)) {
            console.error("OTP Send Error:", otpError.response?.data?.error || otpError.message);
            setError(otpError.response?.data?.error || "Failed to send OTP. Please try again.");
          } else if (otpError instanceof Error) {
            console.error("OTP Send Error:", otpError.message);
            setError(otpError.message || "An unexpected error occurred while sending OTP.");
          }
        }
      } else {
        // Handle unexpected non-201 status from user creation
        setError(userCreationRes.data.error || "User registration failed.");
      }
    } catch (mainError) {
      // Catch errors from the initial user creation or any unhandled errors
      if (axios.isAxiosError(mainError)) {
        console.error("Signup (User Creation) Error:", mainError.response?.data?.error || mainError.message);
        setError(mainError.response?.data?.error || "An error occurred during signup.");
      } else if (mainError instanceof Error) {
        console.error("Signup (General) Error:", mainError.message);
        setError(mainError.message || "Internal server error during signup.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full"
      >
        <h1 className="text-2xl font-semibold mb-4">Sign Up</h1>

        {error && <div className="text-red-500 mb-4 text-center">{error}</div>} {/* Center error message */}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="username">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Note: The role dropdown was part of a previous update.
            If you want it to be configurable, ensure it's here.
            For this specific request, I'm only moving the provided code. */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="USER">User</option>
            <option value="DEVELOPER">Developer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>


        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="text-center mt-4">
          Already have an account?{" "}
          <button
            type="button"
            className="text-blue-500 underline"
            onClick={() => router.push("/api/auth/login")}
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
};

export default SignupFormClient;
