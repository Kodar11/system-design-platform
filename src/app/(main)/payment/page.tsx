// src/app/payment/page.tsx
import { prisma } from "@/lib/prisma/userService";
import PaymentClient from "@/components/PaymentClient";

export default async function PaymentPage() {
  const plans = await prisma.plan.findMany({
    where: { name: { not: "Free" } },
  });

  return <PaymentClient plans={plans} />;
}