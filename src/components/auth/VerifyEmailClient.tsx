"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyOtp } from "@/app/actions"; 
import { sendOtp } from "@/app/actions"; 

interface VerifyEmailClientProps {
  initialEmail: string;
}

export default function VerifyEmailClient({ initialEmail }: VerifyEmailClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    } else {
      setError("Email not provided. Please go back to signup or login.");
    }
  }, [initialEmail]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
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
      await sendOtp(email);
      setMessage("New OTP sent to your email.");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (formData: FormData) => {
    setLoading(true);
    setError("");
    setMessage("");

    const otp = formData.get("otp");
    if (!otp) {
        setError("OTP is required.");
        setLoading(false);
        return;
    }

    try {
      await verifyOtp(formData);
      
    } catch (err: any) {
      setError(err.message || "OTP verification failed.");
      router.push("/api/auth/login");
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

        <form action={handleVerifyOtp}>
          <input type="hidden" name="email" value={email} /> 
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="otp">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              name="otp" 
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
            onClick={() => router.push("/contact-support")}
          >
            contact support
          </button>
        </p>
      </div>
    </div>
  );
}