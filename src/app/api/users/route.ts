// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/userService";
import bcrypt from "bcryptjs";

const saltRounds = 10;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { username, email, password, role } = body;
    console.log("Received data:", body);
    // Validate input fields
    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Convert email to lowercase for consistency
    email = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 }); // 409 Conflict
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user with isVerified set to false
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword, // Save the hashed password
        role, // Include role
        isVerified: false, // User is not verified on signup
      },
    });

    // Instead of directly logging in, return the user info and expect a redirect to OTP verification
    return NextResponse.json(
      {
        message: "User registered successfully. Please verify your email.",
        user: { id: newUser.id, email: newUser.email, role: newUser.role, isVerified: newUser.isVerified },
      },
      { status: 201 } // 201 Created
    );

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to add user" }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log("Inside GET");

    const users = await prisma.user.findMany();
    console.log("Fetched Users:", users); // 🔍 Debugging line

    return NextResponse.json({ message: "Fetched successfully", users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, username, email, password } = body;

  if (!id || !username || !email) {
    return NextResponse.json({ error: "ID, username, and email are required" }, { status: 400 });
  }

  try {
    const updatedData: { username: string; email: string; password?: string } = { username, email };

    if (password) {
      updatedData.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json({ message: "User updated successfully", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    // Return a 204 status for successful deletion with no content
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}