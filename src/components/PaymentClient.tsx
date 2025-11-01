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
// Small inline check icon used in feature lists
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

  // Free tier card to appear first in the one-time column
  const freeTier = {
    id: 'free',
    name: 'Free',
    priceLabel: 'Free',
    oneTime: true,
    mockSessions: 1,
    practiceCredits: 1,
    docsAccess: false,
  };

  // One-time packs (updated per your spec)
  const packs = [
    { id: 'pack-starter', sessions: 1, label: 'Starter Pack', price: 99, mockSessions: 1, practiceCredits: 3, expiryMonths: 12, note: 'Perfect for low-usage prep.' },
    { id: 'pack-pro', sessions: 5, label: 'Pro Pack', price: 499, mockSessions: 5, practiceCredits: 15, expiryMonths: 12, note: '' },
    { id: 'pack-power', sessions: 15, label: 'Power Pack', price: 1299, mockSessions: 15, practiceCredits: 45, expiryMonths: 12, note: '' },
  ];

  // Subscription plan details (bullets and counts). keys are lowercase for easier lookup.
  const subscriptionDetails: Record<string, { priceLabel?: string; bullets: string[] }> = {
    'pro': {
      priceLabel: '₹799 / month',
      bullets: [
        'Everything in the Free Plan, plus:',
        '✓ 100,000 monthly active users',
        '✓ 8 GB database size per project',
        '✓ Daily backups stored for 7 days',
        '✓ 2 Mock Credits / day (reset)',
        '✓ 6 Practice Submissions / day (reset)',
        '✓ Priority email support',
        '✓ Unlimited diagram exports',
      ],
    },
    'team': {
      bullets: [
        'Everything in Pro, plus:',
        '✓ Higher quotas and team features',
        '✓ Priority support & SLA',
      ],
    },
    'enterprise': {
      bullets: [
        'Includes:',
        '✓ Dedicated Support Manager',
        '✓ Uptime SLAs',
        '✓ SSO & Role-Based Access',
        '✓ Unlimited Practice Submissions',
        '✓ Custom Integrations',
        '✓ Unlimited Mock Sessions',
        '✓ Unlimited Database Access',
      ],
    },
  };

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
      <div className="p-8">
        <h1 className="text-4xl font-bold text-center mb-10">Pricing Plans</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Column 1 - Free tier */}
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Free</h3>
              <p className="text-sm text-muted-foreground mb-4">Perfect for a quick trial</p>
              <div className="bg-background/50 border border-border rounded-lg p-4">
                <div className="text-lg font-bold mb-2">Free</div>
                <ul className="text-sm text-muted-foreground ml-0 space-y-2">
                  <li className="flex items-start gap-2"><CheckIcon className="shrink-0 text-green-400"/> <span>1 Mock Interview Credit (one-time)</span></li>
                  <li className="flex items-start gap-2"><CheckIcon className="shrink-0 text-green-400"/> <span>1 Practice Submission (one-time)</span></li>
                  <li className="text-sm text-muted-foreground">No access to docs</li>
                </ul>
              </div>
            </div>
            <div className="mt-6">
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg shadow-sm hover:bg-green-700 transition">Get started</button>
            </div>
          </div>

          {/* Column 2 - One-time packs inside a tall card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-6">One-time Credit Packs</h2>
            <div className="space-y-6">
              {packs.map((p) => (
                <div key={p.id} className="border border-border rounded-lg p-6 bg-background/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">{p.label}</div>
                      {p.note && <div className="text-xs text-muted-foreground">{p.note}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">₹{p.price} One-time</div>
                    </div>
                  </div>

                  <ul className="mt-3 text-sm text-muted-foreground ml-0 space-y-2">
                    <li className="flex items-start gap-2"><CheckIcon className="shrink-0 text-green-400"/> <span>{p.mockSessions} Mock Interview Session{p.mockSessions > 1 ? 's' : ''}</span></li>
                    <li className="flex items-start gap-2"><CheckIcon className="shrink-0 text-green-400"/> <span>{p.practiceCredits} Practice Submission{p.practiceCredits > 1 ? 's' : ''}</span></li>
                    <li className="flex items-start gap-2"><CheckIcon className="shrink-0 text-green-400"/> <span>{p.expiryMonths}-Month Credit Expiry</span></li>
                  </ul>

                  <div className="mt-4">
                    <button
                      onClick={() => handleOneTimePurchase(p.id)}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-sm transition"
                    >
                      {loading ? 'Processing...' : 'Buy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle column - Monthly subscription with highlighted style */}
          <div className="bg-card border-2 border-transparent rounded-xl shadow-lg p-6 md:scale-100 md:transform-none">
            <h2 className="text-xl font-semibold mb-4">Monthly Subscriptions</h2>
            <div className="space-y-4">
              {plans.map((plan, idx) => {
                const key = plan.name.toLowerCase();
                const details = subscriptionDetails[key];

                return (
                  <div key={plan.id} className={`rounded-lg p-6 ${idx === 0 ? 'border border-green-600 bg-gradient-to-b from-green-700/5' : 'border border-border bg-background/50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-medium">{plan.name}</div>
                          {idx === 0 && (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold">Most popular</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">Billed monthly</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{details?.priceLabel ?? `₹${plan.priceInPaisa / 100}`}</div>
                      </div>
                    </div>

                    {/* Feature bullets */}
                    {details?.bullets && (
                      <ul className="mt-4 text-sm text-muted-foreground ml-0 space-y-2">
                        {details.bullets.map((b, i) => (
                          <li key={i} className={b.trim().startsWith('✓') ? 'flex items-start gap-2' : ''}>
                            {b.trim().startsWith('✓') ? <><CheckIcon className="shrink-0 text-green-400"/><span>{b.replace(/^✓\s*/, '')}</span></> : <span>{b}</span>}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4">
                      <button
                        onClick={() => handleSubscribe(plan.name)}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow transition"
                      >
                        {loading ? 'Loading...' : 'Subscribe'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column - Enterprise / Contact */}
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-4">Enterprise</h2>
              <h3 className="text-base font-medium mb-2">Custom Enterprise Plan</h3>
              <p className="text-sm text-muted-foreground mb-4">For large teams and dedicated support. Includes SSO, SLA, and custom integrations.</p>
              <ul className="text-sm text-muted-foreground ml-0 space-y-2 mb-4">
                {subscriptionDetails['enterprise'].bullets.map((b, i) => (
                  <li key={i} className={b.trim().startsWith('✓') ? 'flex items-start gap-2' : ''}>
                    {b.trim().startsWith('✓') ? <><CheckIcon className="shrink-0 text-green-400"/><span>{b.replace(/^✓\s*/, '')}</span></> : <span>{b.replace(/^Includes:\s*/, '')}</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {(() => {
                const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@archiforge.com';
                const subject = encodeURIComponent('Enterprise Plan Inquiry');
                const mailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supportEmail)}&su=${subject}`;

                return (
                  <a href={mailUrl} target="_blank" rel="noreferrer" className="inline-block w-full text-center bg-gray-800 text-white py-3 px-4 rounded">
                    Contact Us
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}