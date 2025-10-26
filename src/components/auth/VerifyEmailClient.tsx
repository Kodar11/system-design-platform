"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyAndCleanOtp, sendOtp, createUserAfterOtp } from "@/app/actions";
import NavBar from "../ui/NavBar";
import { EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to resend OTP.");
      } else {
        setError("An unknown error occurred while resending OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (formData: FormData) => {
    setLoading(true);
    setError("");
    setMessage("");

    const otp = formData.get("otp") as string;
    if (!otp || !email) {
      setError("OTP and email are required.");
      setLoading(false);
      return;
    }

    try {
      const isValid = await verifyAndCleanOtp(email, otp);
      if (isValid) {
        await createUserAfterOtp(email, otp);
        setMessage("User created successfully!");
        router.push("/login"); 
      } else {
        setError("Invalid or expired OTP. Please try again or resend OTP.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "OTP verification or user creation failed.");
      } else {
        setError("An unknown error occurred during OTP verification or user creation.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <EnvelopeIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Verify Your Email</h1>
            <p className="text-muted-foreground">We've sent a verification code to your email</p>
          </div>

          {/* Verification Form */}
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
            {/* Email Display */}
            {initialEmail && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground text-center">
                  A 6-digit verification code has been sent to
                </p>
                <p className="text-center font-semibold text-foreground mt-1">{initialEmail}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-destructive mr-2" />
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-green-500 text-sm">{message}</p>
              </div>
            )}

            <form action={handleVerifyOtp} className="space-y-6">
              <input type="hidden" name="email" value={email} />
              
              {/* OTP Input */}
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-foreground">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                />
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-border"></div>
              <span className="px-4 text-sm text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border"></div>
            </div>

            {/* Resend Button */}
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
              className={`w-full py-3 font-semibold rounded-lg transition-all duration-200 ${
                resendCooldown > 0 || loading
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl"
              }`}
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Verification Code"}
            </button>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Having trouble? Check your spam folder or{" "}
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 underline"
                  onClick={() => router.push("/contact-support")}
                >
                  contact support
                </button>
              </p>
            </div>
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              onClick={() => router.push("/login")}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}