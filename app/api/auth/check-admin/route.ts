import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import AdminEmail from "@/models/adminemail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    // Verify secret signature header
    const internalSecret = req.headers.get("x-internal-secret");
    if (!internalSecret || internalSecret !== process.env.CLERK_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email parameter is required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Check if the specific email is registered
    const dbAdmin = await AdminEmail.findOne({ email }).lean();
    
    // Check if there are any admin records in DB at all (used for permissive fallback)
    const count = await AdminEmail.countDocuments();

    return NextResponse.json({
      success: true,
      isAdmin: !!dbAdmin,
      hasAdmins: count > 0,
    });
  } catch (error) {
    console.error("CHECK_ADMIN API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
