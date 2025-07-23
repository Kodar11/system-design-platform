// app/signup/page.tsx
import SignupFormClient from "@/components/auth/SignupFormClient"; // Import the new client component

// This is now a Server Component
export default function SignupPage() {
  return (
    // The main layout and static content can stay in the Server Component
    // The interactive form is rendered by the Client Component
    <SignupFormClient />
  );
}
