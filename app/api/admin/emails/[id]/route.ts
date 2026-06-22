import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/require-admin";
import connectMongoDB from "@/lib/mongodb";
import AdminEmail from "@/models/adminemail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Admin ID is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const deleted = await AdminEmail.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Admin account not found." },
        { status: 444 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin account removed successfully.",
    });
  } catch (error) {
    console.error("DELETE ADMIN EMAIL ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete admin account." },
      { status: 500 }
    );
  }
}
