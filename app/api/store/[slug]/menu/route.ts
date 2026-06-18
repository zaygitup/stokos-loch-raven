import { NextResponse } from "next/server";
import { getStoreMenuPayload } from "@/lib/server/storemenu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteProps = {
  params: Promise<{ slug: string }>;
};

function slugify(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  };
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params;
    const cleanSlug = slugify(slug);

    if (!cleanSlug) {
      return NextResponse.json(
        {
          success: false,
          store: null,
          categories: [],
          menuCategories: [],
          products: [],
          menuProducts: [],
          modifierGroups: [],
          upsells: [],
          upsellProducts: [],
          counts: {
            categories: 0,
            products: 0,
            modifierGroups: 0,
            upsells: 0,
          },
          updatedAt: new Date().toISOString(),
          message: "Store slug is required.",
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    // Fresh payload for client polling after admin CRUD.
    const payload = await getStoreMenuPayload(cleanSlug, {
      bypassProductCache: true,
    });

    return NextResponse.json(
      {
        ...payload,
        success: payload?.success !== false,
        updatedAt: payload?.updatedAt || new Date().toISOString(),
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      }
    );
  } catch (error) {
    console.error("Store single menu API error:", error);

    return NextResponse.json(
      {
        success: false,
        store: null,
        categories: [],
        menuCategories: [],
        products: [],
        menuProducts: [],
        modifierGroups: [],
        upsells: [],
        upsellProducts: [],
        counts: {
          categories: 0,
          products: 0,
          modifierGroups: 0,
          upsells: 0,
        },
        updatedAt: new Date().toISOString(),
        message: "Failed to load store menu.",
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      }
    );
  }
}
