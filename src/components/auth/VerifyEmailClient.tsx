// src/components/auth/VerifyEmailClient.tsx
"use client"; // This directive makes this a Client Component

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // useRouter is a client-side hook
import axios from "axios";
import { signIn } from "next-auth/react";

interface VerifyEmailClientProps {
  initialEmail: string;
}

export default function VerifyEmailClient({ initialEmail }: VerifyEmailClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60); // Cooldown for resend OTP

  // Set email from prop once
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    } else {
      setError("Email not provided. Please go back to signup or login.");
    }
  }, [initialEmail]);

  // Cooldown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000); // 1 second interval
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);


  const handleResendOtp = async () => {
    if (!email) {
      setError("Email is required to resend OTP.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await axios.post("/api/send-otp", { email });
      if (res.status === 200) {
        setMessage("New OTP sent to your email.");
        setResendCooldown(60); // Reset cooldown
      } else {
        setError(res.data.error || "Failed to resend OTP.");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to resend OTP.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post("/api/verify-otp", { email, otp });

      if (res.status === 200) {
        setMessage("Email verified successfully! Redirecting to login...");
        // After successful verification, you might want to automatically sign in the user
        // or redirect them to the login page.
        // Note: signIn with password: "" is a workaround if you don't have the password.
        // A better approach might be to redirect to login and let the user sign in,
        // or if your backend issues a token on verification, use that to sign in.
        await signIn("credentials", {
            email,
            // We don't have the password here, so this might not work if your authorize
            // callback strictly requires a password for signIn.
            // Consider redirecting to /api/auth/login directly if auto-signin is not critical
            // or if you can't satisfy the password requirement.
            password: "", // This will likely fail if your authorize callback requires a password
            redirect: false,
        });
        router.push("/api/auth/login");
      } else {
        setError(res.data.error || "OTP verification failed.");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "OTP verification failed.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h1 className="text-2xl font-semibold mb-4 text-center">Verify Your Email</h1>

        {initialEmail && <p className="text-center text-gray-600 mb-4">A 6-digit OTP has been sent to <strong>{initialEmail}</strong></p>}

        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
        {message && <div className="text-green-500 mb-4 text-center">{message}</div>}

        <form onSubmit={handleVerifyOtp}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="otp">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
              className="w-full p-2 border border-gray-300 rounded-md text-center text-xl tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 mb-2"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <button
          onClick={handleResendOtp}
          disabled={resendCooldown > 0 || loading}
          className={`w-full py-2 mt-2 rounded-md ${
            resendCooldown > 0 || loading
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
        </button>
        <p className="text-center mt-4 text-sm">
          Having trouble? Check your spam folder or{" "}
          <button
            type="button"
            className="text-blue-500 underline"
            onClick={() => router.push("/contact-support")} // Example: Link to a support page
          >
            contact support
          </button>
        </p>
      </div>
    </div>
  );
}
