// // app/verify-email/page.tsx
// import VerifyEmailClient from "@/components/auth/VerifyEmailClient"; // Import the new client component

// interface VerifyEmailPageProps {
//   searchParams: {
//     email?: string; 
//   };
// }

// export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
//   const initialEmail = searchParams.email || '';

//   return (
//     <div className="min-h-screen flex justify-center items-center bg-gray-100">
//       <VerifyEmailClient initialEmail={initialEmail} />
//     </div>
//   );
// }

import VerifyEmailClient from "@/components/auth/VerifyEmailClient";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
    const params = await searchParams;
    const initialEmail = params?.email || '';

    return (
        <div className="min-h-screen flex justify-center items-center bg-gray-100">
            <VerifyEmailClient initialEmail={initialEmail} />
        </div>
    );
}