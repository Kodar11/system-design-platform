// src/components/PaymentClient.tsx
"use client";

import Script from "next/script";
import { useState } from "react";
import { createRazorpaySubscription, createOneTimeOrder, confirmOneTimePayment } from "@/app/actions";
import { useSession } from "next-auth/react";
import NavBar from "./ui/NavBar";
import Footer from "./ui/Footer";

// 1. Define types for the data we expect from the backend
interface Plan {
  id: string;
  name: string;
  priceInPaisa: number;
}

// 2. Define the types for Razorpay's handler responses
interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
}

// 3. Define the options for the Razorpay constructor
interface RazorpayOptions {
  key: string | undefined;
  subscription_id: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  theme: {
    color: string;
  };
}

// 4. Define a specific type for the Razorpay constructor
interface RazorpayConstructor {
  new (options: RazorpayOptions): {
    open: () => void;
    on: (event: string, callback: (response: RazorpayFailureResponse) => void) => void;
  };
}

// 5. Augment the global Window object with the correct type
declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

// 6. Use the new types for the component props
export default function PaymentClient({ plans }: { plans: Plan[] }) {
  const { update, data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  const user = { name: session?.user?.name || "Guest", email: session?.user?.email || "guest@example.com" };

  const handleSubscribe = async (planName: string) => {
    setLoading(true);
    try {
      const { subscriptionId } = await createRazorpaySubscription(planName);

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        name: "ArchiForge",
        description: `Subscription for ${planName} Plan`,
        prefill: {
          name: user.name,
          email: user.email,
        },
        handler: async function (response: RazorpaySuccessResponse) {
          if (response.razorpay_payment_id) {
            alert("Payment successful!");
            await update();
          }
        },
        theme: {
          color: "#3399cc",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", function (response: RazorpayFailureResponse) {
        alert(response.error.description);
      });
      paymentObject.open();
    } catch (error: unknown) {
      console.error(error);
      alert("Failed to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const packs = [
    { id: 'pack-small', sessions: 1, label: 'Starter Pack', price: 199 },
    { id: 'pack-medium', sessions: 3, label: 'Pro Pack', price: 499 },
    { id: 'pack-large', sessions: 10, label: 'Power Pack', price: 1299 },
  ];

  const handleOneTimePurchase = async (packId: string) => {
    setLoading(true);
    try {
      const orderRes = await createOneTimeOrder(packId);
      if (!orderRes?.orderId) throw new Error('Failed to create order');

      const options: any = {
        key: orderRes.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: 'ArchiForge',
        description: `One-time credits purchase (${packId})`,
        order_id: orderRes.orderId,
        prefill: { name: user.name, email: user.email },
        handler: async function (res: RazorpaySuccessResponse) {
          try {
            const confirm = await confirmOneTimePayment(res.razorpay_payment_id, res.razorpay_order_id, res.razorpay_signature, packId);
            if (confirm?.ok) {
              alert('Payment successful and credits added!');
              await update();
            } else {
              alert('Payment succeeded but failed to record purchase on server.');
            }
          } catch (err) {
            console.error('Confirmation failed', err);
            alert((err as any)?.message || 'Failed to confirm payment');
          }
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: RazorpayFailureResponse) {
        alert(response.error.description);
      });
      paymentObject.open();

    } catch (err) {
      console.error('One-time purchase failed', err);
      alert((err as any)?.message || 'Failed to start purchase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <NavBar/>
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

        <div className="mt-8 w-full max-w-3xl">
          <h2 className="text-2xl font-semibold mb-4">One-time Credit Packs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packs.map((p) => (
              <div key={p.id} className="p-4 border rounded-lg text-center">
                <div className="text-lg font-medium mb-2">{p.label}</div>
                <div className="text-2xl font-bold mb-2">{p.sessions} session{p.sessions > 1 ? 's' : ''}</div>
                <div className="text-sm text-gray-600 mb-4">Includes {p.sessions * 3} practice credits</div>
                <div className="text-xl font-semibold mb-4">₹{p.price}</div>
                <button
                  onClick={() => handleOneTimePurchase(p.id)}
                  disabled={loading}
                  className="bg-green-600 text-white py-2 px-4 rounded"
                >
                  {loading ? 'Processing...' : 'Buy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}