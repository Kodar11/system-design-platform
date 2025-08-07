import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/userService";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  console.log("Received raw body:", body);
  console.log("Received headers:", Object.fromEntries(req.headers));

  console.log("Received x-razorpay-signature:", signature);
  if (!signature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ message: "Signature mismatch" }, { status: 400 });
  }

  const event = JSON.parse(body);

  try {
    const subscriptionId = event.payload.subscription.entity.id;
    console.log("Webhook received for subscriptionId:", subscriptionId);
    const id = subscriptionId
    const payment = await prisma.payment.findUnique({ where: { razorpaySubscriptionId: id } });

    if (!payment) {
      console.error("Payment record not found in DB for subscriptionId:", subscriptionId);
      return NextResponse.json({ message: "Payment record not found" }, { status: 404 });
    }

    if (event.event === "subscription.charged" || event.event === "subscription.activated") {
      console.log("Processing subscription activation for userId:", payment.userId);
      const plan = await prisma.plan.findUnique({ where: { id: payment.planId } });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "ACTIVE" },
      });

      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          subscriptionStatus: "PRO",
          dailyDesignCredits: plan?.priceInPaisa ? Math.floor(plan.priceInPaisa / 100) : 10, 
          dailyProblemCredits: plan?.priceInPaisa ? Math.floor(plan.priceInPaisa / 100) : 10, 
          lastCreditReset: new Date(), 
        },
      });
      console.log("Database updated successfully for subscription:", subscriptionId);
    } else if (event.event === "subscription.cancelled" || event.event === "subscription.halted") {
      console.log("Processing subscription cancellation for userId:", payment.userId);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "CANCELLED" },
      });
      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          subscriptionStatus: "FREE",
          dailyDesignCredits: 0,
          dailyProblemCredits: 0,
        },
      });
      console.log("Database updated successfully for cancellation:", subscriptionId);
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}