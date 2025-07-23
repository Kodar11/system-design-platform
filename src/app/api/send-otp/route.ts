// app/api/send-otp/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/userService";
import crypto from 'crypto'; 
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;
    console.log("I am here");
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`Generated OTP for ${email}: ${otp}`);

    // Set OTP expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in the database
    // Delete existing OTPs for the user to ensure only one active OTP
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

    // --- Nodemailer Integration ---
    // Create a Nodemailer transporter using your SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'), // Ensure port is a number
      secure: process.env.EMAIL_SERVER_PORT === '465', // Use 'true' if port is 465 (SSL/TLS), 'false' otherwise
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM, // Sender address
      to: email, // List of recipients
      subject: 'Your One-Time Password (OTP) for Verification', // Subject line
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
      `, // HTML body
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    // --- End Nodemailer Integration ---

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error sending OTP:", error);
    // Provide a more user-friendly error message for email sending failures
    return NextResponse.json({ error: "Failed to send OTP. Please try again later." }, { status: 500 });
  }
}
