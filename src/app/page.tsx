// app/page.tsx
import { getServerSession } from "next-auth"; // Import getServerSession
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; // Import your NextAuth config
import UserSessionDisplay from "@/components/home/UserSessionDisplay"; // Import the new client component

export default async function Home() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);

  return (
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-4xl">
        <UserSessionDisplay session={session} />
      </main>
    </div>
  );
}
