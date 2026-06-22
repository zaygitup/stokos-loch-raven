import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/require-admin";
import connectMongoDB from "@/lib/mongodb";
import AdminEmail from "@/models/adminemail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    await connectMongoDB();

    const dbAdmins = await AdminEmail.find({})
      .sort({ createdAt: -1 })
      .lean();

    const systemAdmins = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      dbAdmins,
      systemAdmins,
    });
  } catch (error) {
    console.error("GET ADMIN EMAILS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch admin accounts." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Check system admins list
    const systemAdmins = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (systemAdmins.includes(email)) {
      return NextResponse.json(
        { success: false, message: "This email is already configured as a system admin in the environment variables." },
        { status: 409 }
      );
    }

    // Check DB list
    const existing = await AdminEmail.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, message: "This email is already registered as an admin." },
        { status: 409 }
      );
    }

    const newAdmin = await AdminEmail.create({
      email,
      addedBy: guard.email || guard.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Admin account added successfully.",
      admin: newAdmin,
    });
  } catch (error) {
    console.error("CREATE ADMIN EMAIL ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add admin account." },
      { status: 500 }
    );
  }
}
