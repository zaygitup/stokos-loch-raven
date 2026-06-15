import { NextResponse } from "next/server";
import { getStoreMenuProducts } from "@/lib/server/menuproducts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, products: [], message: "Store slug is required." }, { status: 400 });
    }

    const products = await getStoreMenuProducts(slug);

    return NextResponse.json(
      { success: true, products, updatedAt: new Date().toISOString() },
      {
        headers: {
          // ✅ 30s CDN/browser cache
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Store menu products API error:", error);
    return NextResponse.json(
      { success: false, products: [], message: "Failed to load store products" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
