// app/page.tsx
import { getServerSession } from "next-auth"; 
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; 
import UserSessionDisplay from "@/components/home/UserSessionDisplay"; 
import ThemeToggle from "@/components/ui/ThemeToggle";

export default async function Home() {
  const session = await getServerSession(NEXT_AUTH_CONFIG);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-20 gap-8 sm:p-20 bg-background">
      <header className="flex justify-end w-full max-w-4xl self-end">
        <ThemeToggle />
      </header>
      <main className="flex flex-col gap-8 items-center sm:items-start w-full max-w-4xl">
        <UserSessionDisplay session={session} />
      </main>
    </div>
  );
}