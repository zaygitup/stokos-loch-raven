import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Store from "@/models/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await connectMongoDB();

    const { slug } = await context.params;

    const store = await Store.findOne({ slug }).lean() as {
      deliveryFee?: number;
      taxRate?: number;
      minimumOrder?: number;
      latitude?: number | null;
      longitude?: number | null;
      deliveryRadiusKm?: number;
      timezone?: string;
      hours?: { open?: string; close?: string; closed?: boolean }[];
    } | null;

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deliveryFee: store.deliveryFee ?? 0,
      taxRate: store.taxRate ?? 0,
      minimumOrder: store.minimumOrder ?? 0,
      latitude: store.latitude ?? null,
      longitude: store.longitude ?? null,
      deliveryRadiusKm: store.deliveryRadiusKm ?? 8,
      timezone: store.timezone || "America/New_York",
      hours: Array.isArray(store.hours) ? store.hours : [],
    });
  } catch (error) {
    console.error("STORE CONFIG ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch store config." },
      { status: 500 }
    );
  }
}
