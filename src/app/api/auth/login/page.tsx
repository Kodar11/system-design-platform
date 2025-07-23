// app/api/auth/login/page.tsx
import LoginClient from "@/components/auth/LoginClient"; // Import the new client component

// This is now a Server Component
export default function LoginPage() {
  return (
    // The main layout and static content can stay in the Server Component
    // The interactive form is rendered by the Client Component
    <LoginClient />
  );
}
