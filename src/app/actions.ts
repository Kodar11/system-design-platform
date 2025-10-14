"use server";

import { prisma } from "@/lib/prisma/userService";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";

interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  status: string;
  quantity?: number;
  total_count?: number;
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

const saltRounds = 10;

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
    customer_notify: 1,
    quantity: 1,
    total_count: 12,
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
  } catch (error: unknown) { // Use 'unknown' for better type safety
    console.error("Error creating Razorpay subscription:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to create subscription order: ${error.message}`);
    }
    throw new Error("Failed to create subscription order due to an unknown error.");
  }
}
// --- START OTP STORE DEFINITIONS ---

enum Role {
    USER = "USER",
    ADMIN = "ADMIN",
}

interface TempUserData {
    username: string;
    password: string; // Hashed password
    role: Role;
}

// Type guard to ensure JSON compatibility
type JsonCompatible = { [key: string]: JsonCompatible } | string | number | boolean | null | JsonCompatible[];

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RESEND_ATTEMPTS = 10;
const RESEND_COOLDOWN_SECONDS = 1;

/**
 * Generates and stores the OTP in the database.
 * @param email The user's email.
 * @param newUserData Optional: User data only passed during the INITIAL signup.
 * @returns The generated OTP.
 */
export async function generateAndStoreOtp(email: string, newUserData?: TempUserData): Promise<string> {
    const now = Date.now();
    const emailLower = email.toLowerCase();
    
    const currentEntry = await prisma.otp.findUnique({
        where: { email: emailLower },
    });
    
    // 1. Check Cooldown
    if (currentEntry && Number(currentEntry.expiresAt) > now) {
        const timeSinceLastSend = now - (Number(currentEntry.expiresAt) - OTP_EXPIRY_MS);
        if (timeSinceLastSend < RESEND_COOLDOWN_SECONDS * 1000) {
            throw new Error(`Please wait ${RESEND_COOLDOWN_SECONDS - Math.floor(timeSinceLastSend / 1000)} seconds before trying to resend.`);
        }
    }

    // 2. Determine User Data
    const userDataToStore = newUserData || (currentEntry?.tempUserData as TempUserData | undefined);
    if (!userDataToStore) {
        throw new Error("Cannot generate OTP: Missing user data. Please sign up again.");
    }

    // 3. Check Resend Count
    const resendCount = (currentEntry && Number(currentEntry.expiresAt) > now) 
        ? currentEntry.resendCount + 1
        : 1;

    if (resendCount > MAX_RESEND_ATTEMPTS) {
        throw new Error("Maximum resend attempts reached. Please wait 10 minutes or contact support.");
    }
    
    // 4. Generate and Store/Upsert in DB
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = BigInt(now + OTP_EXPIRY_MS);

    await prisma.otp.upsert({
        where: { email: emailLower },
        update: {
            otp,
            expiresAt,
            resendCount,
            //@ts-ignore
            tempUserData: userDataToStore as unknown as JsonCompatible, // Cast to JSON-compatible type
        },
        create: {
            email: emailLower,
            otp,
            expiresAt,
            resendCount,
            //@ts-ignore
            tempUserData: userDataToStore as unknown as JsonCompatible, // Cast to JSON-compatible type
        },
    });
    
    console.log(`OTP stored for ${emailLower}:`, { otp, expiresAt });
    
    return otp;
}

/**
 * Checks the OTP against the database.
*/
export async function verifyAndCleanOtp(email: string, otp: string): Promise<boolean> {
    const emailLower = email.toLowerCase();
    const storedOtp = await prisma.otp.findUnique({
        where: { email: emailLower },
    });
    
    console.log(`Verifying OTP for ${emailLower}:`, { storedOtp, inputOtp: otp, now: Date.now() });
    
    if (!storedOtp) {
        return false; // OTP not found
    }
    
    if (Number(storedOtp.expiresAt) < Date.now()) {
        await prisma.otp.delete({ where: { email: emailLower } }); // Clean up expired
        console.log(`OTP for ${emailLower} expired at ${new Date(Number(storedOtp.expiresAt)).toISOString()}`);
        return false; // Expired
    }
    
    if (storedOtp.otp === otp) {
        return true; // Verification successful, cleanup handled by createUserAfterOtp
    }
    
    return false; // Invalid OTP
}

/**
 * Creates a user in the database after successful OTP verification.
 * @param email The user's email.
 * @param otp The one-time password.
*/
export async function createUserAfterOtp(email: string, otp: string) {
    const emailLower = email.toLowerCase();
    const storedOtp = await prisma.otp.findUnique({
        where: { email: emailLower },
    });
    
    if (!storedOtp || storedOtp.otp !== otp || Number(storedOtp.expiresAt) < Date.now()) {
        throw new Error("Invalid or expired OTP.");
    }
    
    //@ts-ignore 
    const tempUserData = storedOtp.tempUserData as TempUserData; // Cast retrieved JSON to TempUserData
    const { username, password, role } = tempUserData;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: emailLower },
        });
        if (existingUser) {
            throw new Error("User already exists.");
        }
        await prisma.user.create({
            data: {
                email: emailLower,
                username,
                password,
                role,
            },
        });
        await prisma.otp.delete({ where: { email: emailLower } });
        console.log(`User ${emailLower} created and OTP cleaned up.`);
    } catch (error: unknown) {
        console.error("Error creating user:", error);
        if (error instanceof Error) {
            throw new Error(error.message || "Failed to create user.");
        }
        throw new Error("Failed to create user due to an unknown error.");
    }
}

export async function signupUser(formData: FormData) {
    const { username, email, password, role } = Object.fromEntries(formData) as {
        username: string;
        email: string;
        password: string;
        role: Role;
    };
    if (!username || !email || !password || !role) {
        throw new Error("Missing required fields");
    }
    try {
        const emailLower = email.toLowerCase();
        
        const existingUser = await prisma.user.findUnique({
            where: { email: emailLower },
        });

        if (existingUser) {
            throw new Error("User already exists");
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const validRole = (Object.values(Role) as string[]).includes(role) ? role : "USER";

        await sendOtp(emailLower, { 
            username, 
            password: hashedPassword, 
            role: validRole as Role 
        });

    } catch (error: unknown) {
        console.error("Error creating user:", error);
        if (error instanceof Error) {
            throw new Error(error.message || "Failed to create user.");
        }
        throw new Error("Failed to create user due to an unknown error.");
    }

    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function sendOtp(email: string, newUserData?: TempUserData) {
    if (!email) {
        throw new Error("Email is required");
    }
    try {
        const emailLower = email.toLowerCase();
        
        const otp = await generateAndStoreOtp(emailLower, newUserData);
        console.log("Otp generated:", otp);
        
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
            html: `<p>Your One-Time Password (OTP) for verification is: <strong>${otp}</strong>. This OTP is valid for 10 minutes.</p>`,
        };
        await transporter.sendMail(mailOptions);
        
    } catch (error: unknown) {
        console.error("Error sending OTP:", error);
        if (error instanceof Error) {
            throw new Error(error.message || "Failed to send OTP. Please try again later.");
        }
        throw new Error("Failed to send OTP due to an unknown error.");
    }
}