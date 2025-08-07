// src/components/PaymentClient.tsx
"use client";

import Script from "next/script";
import { useState } from "react";
import { createRazorpaySubscription } from "@/app/actions";
import { useSession } from "next-auth/react"; // Import useSession


declare global {
  interface Window {
    Razorpay: new (options: any) => any;
  }
}

export default function PaymentClient({ plans }: { plans: any[] }) {
  const { update } = useSession(); // Use the update function
  const [loading, setLoading] = useState(false);
  const user = { name: "Test User", email: "test@example.com" }; // Get this from session

  const handleSubscribe = async (planName: string) => {
    setLoading(true);
    try {
      const { subscriptionId } = await createRazorpaySubscription(planName);
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: "ArchiForge",
        description: `Subscription for ${planName} Plan`,
        prefill: {
          name: user.name,
          email: user.email,
        },
        handler: async function (response: any) {
          if (response.razorpay_payment_id) {
            alert("Payment successful!");
            await update(); // This will force the session to refresh
          }
        },
        theme: {
          color: "#3399cc",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", function (response: any) {
        alert(response.error.description);
      });
      paymentObject.open();
    } catch (error) {
      console.error(error);
      alert("Failed to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="flex flex-col gap-8 justify-center items-center p-8">
        <h1 className="text-3xl font-bold">Pricing Plans</h1>
        <div className="flex gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="p-6 border rounded-lg text-center">
              <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
              <p className="text-3xl font-bold mb-4">₹{plan.priceInPaisa / 100}</p>
              <button
                onClick={() => handleSubscribe(plan.name)}
                disabled={loading}
                className="bg-blue-500 text-white py-2 px-4 rounded"
              >
                {loading ? "Loading..." : "Subscribe"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}