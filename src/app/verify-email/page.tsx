// app/verify-email/page.tsx
import VerifyEmailClient from "@/components/auth/VerifyEmailClient"; // Import the new client component

// Define the props for the page, which will include searchParams
interface VerifyEmailPageProps {
  searchParams: {
    email?: string; // Optional email parameter from the URL
  };
}

// This is now an async Server Component
export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const initialEmail = searchParams.email || '';

  return (
    // The main layout and static content can stay in the Server Component
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      {/* Render the client component, passing the initialEmail as a prop */}
      <VerifyEmailClient initialEmail={initialEmail} />
    </div>
  );
}
