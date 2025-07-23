// app/admin/page.tsx
import { getServerSession } from "next-auth";
import { NEXT_AUTH_CONFIG } from "@/lib/nextAuthConfig"; // Import your NextAuth config
import { redirect } from "next/navigation"; // For server-side redirects

export default async function AdminPage() {
  // Get the session on the server side
  const session = await getServerSession(NEXT_AUTH_CONFIG);

  // Check if user is logged in and has the 'ADMIN' role
  if (!session || session.user?.role !== "ADMIN") {
    // If not an admin, redirect them. You can choose to redirect to:
    // - A login page: "/api/auth/login"
    // - A custom unauthorized page: "/unauthorized"
    // - The home page: "/"
    console.warn("Unauthorized access attempt to admin page.");
    redirect("/api/auth/login"); // Redirect to login with an error message
  }

  // If the user is an ADMIN, render the admin content
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">Admin Dashboard</h1>
        <p className="text-lg text-gray-800 mb-4">
          Welcome, <span className="font-semibold">{session.user.username}</span>!
          You have successfully accessed the admin-only area.
        </p>
        <p className="text-md text-gray-600 mb-6">
          Your role: <span className="font-medium text-blue-500">{session.user.role}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-md shadow-sm">
            <h2 className="text-xl font-semibold text-blue-600 mb-2">User Management</h2>
            <p className="text-gray-700">View, edit, or delete user accounts.</p>
            {/* Add links to specific admin functionalities here */}
            <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
              Manage Users
            </button>
          </div>
          <div className="bg-green-50 p-4 rounded-md shadow-sm">
            <h2 className="text-xl font-semibold text-green-600 mb-2">Content Moderation</h2>
            <p className="text-gray-700">Review and moderate user-generated content.</p>
            <button className="mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors">
              Moderate Content
            </button>
          </div>
          <div className="bg-yellow-50 p-4 rounded-md shadow-sm">
            <h2 className="text-xl font-semibold text-yellow-600 mb-2">Settings & Configuration</h2>
            <p className="text-gray-700">Adjust application-wide settings.</p>
            <button className="mt-4 bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors">
              Configure App
            </button>
          </div>
          <div className="bg-purple-50 p-4 rounded-md shadow-sm">
            <h2 className="text-xl font-semibold text-purple-600 mb-2">Analytics</h2>
            <p className="text-gray-700">View application usage statistics.</p>
            <button className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition-colors">
              View Analytics
            </button>
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          This page is protected and only accessible to users with the 'ADMIN' role.
        </p>
      </div>
    </div>
  );
}
