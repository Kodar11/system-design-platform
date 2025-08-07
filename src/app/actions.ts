"use server";

import { prisma } from "@/lib/prisma/userService";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, SubscriptionStatus } from "@prisma/client"; // Import necessary enums
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; // Adjust the import path as necessary
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";

// Define custom types if official Razorpay types are unavailable
interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  status: string;
  quantity?: number;
  total_count?: number;
  // Add other properties as per Razorpay API response
}

interface RazorpaySubscriptionCreateOptions {
  plan_id: string;
  customer_notify: 0 | 1;
  quantity: number;
  total_count: number;
}

interface RazorpayInstance {
  subscriptions: {
    create: (options: RazorpaySubscriptionCreateOptions) => Promise<RazorpaySubscription>;
  };
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
}) as RazorpayInstance;

/**
 * Creates a Razorpay subscription and returns the ID.
 * @param planName The name of the plan the user selected.
 */
export async function createRazorpaySubscription(planName: string) {
  const session = await getServerSession(NEXT_AUTH_CONFIG);
  if (!session?.user?.id) {
    console.error("Session user ID not found:", session);
    throw new Error("Unauthorized or session user ID not found");
  }

  const plan = await prisma.plan.findUnique({ where: { name: planName } });
  if (!plan) {
    throw new Error("Plan not found");
  }

  if (!plan.razorpayPlanId) {
    console.error("razorpayPlanId not found for plan:", planName);
    throw new Error("Plan configuration incomplete: missing razorpayPlanId");
  }

  const subscriptionOptions: RazorpaySubscriptionCreateOptions = {
    plan_id: plan.razorpayPlanId,
    customer_notify: 1, // Notify the customer
    quantity: 1,
    total_count: 12, // 12 months subscription
  };

  try {
    console.log("Creating subscription with options:", subscriptionOptions);
    const subscription = await razorpay.subscriptions.create(subscriptionOptions);

    console.log("Subscription created successfully:", subscription);

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        razorpaySubscriptionId: subscription.id,
        status: "PENDING",
      },
    });

    return { subscriptionId: subscription.id };
  } catch (error) {
    console.error("Error creating Razorpay subscription:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to create subscription order: ${error.message}`);
    }
    throw new Error("Failed to create subscription order due to an unknown error.");
  }
}

// Re-using constants from your previous route handlers
const saltRounds = 10;

// ... (other server actions like signupUser, sendOtp, verifyOtp can remain unchanged for now)
/**
 * Server Action to handle user sign-up.
 * This function replaces the logic in `app/api/users/route.ts`.
 * @param formData FormData from the sign-up form.
 */
export async function signupUser(formData: FormData) {
  let { username, email, password, role } = Object.fromEntries(formData) as {
    username: string;
    email: string;
    password: string;
    role: Role | string; // Allow string input and cast to Role
  };

  if (!username || !email || !password || !role) {
    throw new Error("Missing required fields");
  }

  try {
    email = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Cast the role to the Role enum, defaulting to USER if invalid
    const validRole = role === "USER" || role === "ADMIN" || role === "CONTENT_ADDER" ? role : "USER";

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: validRole as Role, // Explicitly cast to Role
        isVerified: false,
      },
    });

    // We'll call the sendOtp function directly instead of making an API call.
    await sendOtp(email);
  } catch (error: any) {
    console.error("Error creating user:", error);
    throw new Error(error.message || "Failed to create user.");
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

/**
 * Server Action to send an OTP to a user's email.
 * This function replaces the logic in `app/api/send-otp/route.ts`.
 */
export async function sendOtp(email: string) {
  if (!email) {
    throw new Error("Email is required");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otp.deleteMany({
      where: { email: email.toLowerCase() },
    });

    await prisma.otp.create({
      data: {
        email: email.toLowerCase(),
        otp,
        expiresAt,
        userId: user.id,
      },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
      secure: process.env.EMAIL_SERVER_PORT === "465",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your One-Time Password (OTP) for Verification",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Email Verification OTP</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for verifying your email is:</p>
          <h3 style="color: #d32f2f; font-size: 24px; text-align: center; background-color: #f9f9f9; padding: 15px; border-radius: 8px; letter-spacing: 3px;">
            <strong>${otp}</strong>
          </h3>
          <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
          <p>If you did not request this OTP, please ignore this email.</p>
          <p>Thank you!</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP. Please try again later.");
  }
}

/**
 * Server Action to verify a user's OTP.
 * This function replaces the logic in `app/api/verify-otp/route.ts`.
 * @param formData FormData from the verification form.
 */
export async function verifyOtp(formData: FormData) {
  const { email, otp } = Object.fromEntries(formData) as {
    email: string;
    otp: string;
  };

  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  try {
    const storedOtp = await prisma.otp.findFirst({
      where: {
        email: email.toLowerCase(),
        otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedOtp) {
      throw new Error("Invalid or expired OTP");
    }

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { isVerified: true },
    });

    await prisma.otp.delete({
      where: { id: storedOtp.id },
    });

    revalidatePath("/");
    revalidatePath("/api/auth/login");
    redirect("/api/auth/login?verified=true");
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    throw new Error(error.message || "Failed to verify OTP.");
  }
}