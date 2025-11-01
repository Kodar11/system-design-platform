import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/userService";
import Razorpay from "razorpay";

const razor = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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
    const id = subscriptionId;
    let payment = await prisma.payment.findUnique({ where: { razorpaySubscriptionId: id } });

    // Fallback: if payment not found, try to fetch subscription/customer from Razorpay
    // and create the Payment record in our DB (covers cases where subscription was created
    // but the app failed to persist the Payment row).
    if (!payment) {
      console.warn("Payment record not found in DB for subscriptionId; attempting fallback via Razorpay API:", subscriptionId);
      try {
        const subscriptionDetails: any = await razor.subscriptions.fetch(subscriptionId);
        console.log("Fetched subscription from Razorpay:", subscriptionDetails?.id);

        const rpPlanId = subscriptionDetails?.plan_id;
        const rpCustomerId = subscriptionDetails?.customer_id;

        // Try to fetch customer to get email
        let customerEmail: string | undefined;
        if (rpCustomerId) {
          try {
            const customer: any = await razor.customers.fetch(rpCustomerId);
            customerEmail = customer?.email || customer?.contact;
            console.log("Fetched Razorpay customer for subscription fallback:", { rpCustomerId, customerEmail });
          } catch (custErr) {
            console.warn("Failed to fetch Razorpay customer:", custErr);
          }
        }

        // If we have an email, try to find the user and plan in our DB and create a Payment
        if (customerEmail) {
          const emailLower = customerEmail.toLowerCase();
          const user = await prisma.user.findUnique({ where: { email: emailLower } });
          const plan = rpPlanId ? await prisma.plan.findUnique({ where: { razorpayPlanId: rpPlanId } }) : null;

          if (user && plan) {
            try {
              payment = await prisma.payment.create({
                data: {
                  userId: user.id,
                  planId: plan.id,
                  razorpaySubscriptionId: subscriptionId,
                  status: "PENDING",
                },
              });
              console.log("Created Payment record from webhook fallback:", payment.id);
            } catch (createErr) {
              console.error("Failed to create Payment record during webhook fallback:", createErr);
            }
          } else {
            console.warn("Could not find matching user or plan for webhook fallback", { userFound: !!user, planFound: !!plan, emailLower, rpPlanId });
          }
        } else {
          console.warn("No customer email available from Razorpay subscription; cannot perform fallback create.");
        }
      } catch (fetchErr) {
        console.error("Error fetching subscription from Razorpay during webhook fallback:", fetchErr);
      }
    }

    if (!payment) {
      console.error("Payment record still not found after fallback for subscriptionId:", subscriptionId);
      return NextResponse.json({ message: "Payment record not found" }, { status: 404 });
    }

    if (event.event === "subscription.charged" || event.event === "subscription.activated") {
      console.log("Processing subscription activation for userId:", payment.userId);

      // Mark payment as ACTIVE
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "ACTIVE" },
      });

      // Try to update the user; if it fails (missing user, deleted, etc.), attempt a fallback using Razorpay customer email
      try {
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            subscriptionStatus: "PRO",
            // Repurpose existing fields: dailyDesignCredits -> mock allowance, dailyProblemCredits -> practice allowance
            dailyDesignCredits: 2,
            dailyProblemCredits: 10,
            lastCreditReset: new Date(),
          },
        });

        console.log("Database updated successfully for subscription:", subscriptionId);
      } catch (userUpdateError) {
        console.error("Failed to update user by payment.userId:", payment.userId, userUpdateError);

        // Attempt fallback: fetch subscription/customer from Razorpay to obtain email and update user by email
        try {
          const subscriptionDetails: any = await razor.subscriptions.fetch(subscriptionId);
          const rpCustomerId = subscriptionDetails?.customer_id;
          let customerEmail: string | undefined;

          if (rpCustomerId) {
            try {
              const customer: any = await razor.customers.fetch(rpCustomerId);
              customerEmail = customer?.email || customer?.contact;
              console.log("Fetched customer during user-update fallback:", { rpCustomerId, customerEmail });
            } catch (custErr) {
              console.warn("Failed to fetch Razorpay customer during user-update fallback:", custErr);
            }
          }

          if (customerEmail) {
            const emailLower = customerEmail.toLowerCase();
            const userByEmail = await prisma.user.findUnique({ where: { email: emailLower } });
            if (userByEmail) {
              await prisma.user.update({
                where: { id: userByEmail.id },
                data: {
                  subscriptionStatus: "PRO",
                  dailyDesignCredits: 2,
                  dailyProblemCredits: 10,
                  lastCreditReset: new Date(),
                },
              });
              console.log("User updated successfully via email fallback:", userByEmail.id);
            } else {
              console.warn("No user found with customer email during fallback:", emailLower);
            }
          } else {
            console.warn("No customer email available for subscription during user-update fallback; cannot update user.");
          }
        } catch (fallbackErr) {
          console.error("Error during user-update fallback:", fallbackErr);
        }
      }
    } else if (event.event === "subscription.cancelled" || event.event === "subscription.halted") {
      console.log("Processing subscription cancellation for userId:", payment.userId);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "CANCELLED" },
      });

      try {
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            subscriptionStatus: "FREE",
            dailyDesignCredits: 0,
            dailyProblemCredits: 0,
          },
        });
        console.log("User cancelled and updated successfully for cancellation:", subscriptionId);
      } catch (cancelUserErr) {
        console.error("Failed to update user during cancellation by userId:", payment.userId, cancelUserErr);
        // Attempt similar fallback by fetching customer email
        try {
          const subscriptionDetails: any = await razor.subscriptions.fetch(subscriptionId);
          const rpCustomerId = subscriptionDetails?.customer_id;
          let customerEmail: string | undefined;
          if (rpCustomerId) {
            try {
              const customer: any = await razor.customers.fetch(rpCustomerId);
              customerEmail = customer?.email || customer?.contact;
            } catch (custErr) {
              console.warn("Failed to fetch Razorpay customer during cancel fallback:", custErr);
            }
          }
          if (customerEmail) {
            const emailLower = customerEmail.toLowerCase();
            const userByEmail = await prisma.user.findUnique({ where: { email: emailLower } });
            if (userByEmail) {
              await prisma.user.update({
                where: { id: userByEmail.id },
                data: {
                  subscriptionStatus: "FREE",
                  dailyDesignCredits: 0,
                  dailyProblemCredits: 0,
                },
              });
              console.log("User cancelled via email fallback:", userByEmail.id);
            } else {
              console.warn("No user found with customer email during cancel fallback:", emailLower);
            }
          } else {
            console.warn("No customer email available for subscription during cancel fallback; cannot update user.");
          }
        } catch (fallbackErr) {
          console.error("Error during cancel user-update fallback:", fallbackErr);
        }
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}