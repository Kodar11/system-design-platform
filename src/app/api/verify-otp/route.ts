// app/api/verify-otp/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/userService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const storedOtp = await prisma.otp.findFirst({
      where: {
        email: email.toLowerCase(),
        otp,
        expiresAt: {
          gt: new Date(), // Check if OTP is not expired
        },
      },
    });

    if (!storedOtp) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Update user's verification status
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { isVerified: true },
    });

    // Delete the used OTP
    await prisma.otp.delete({
      where: { id: storedOtp.id },
    });

    return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}