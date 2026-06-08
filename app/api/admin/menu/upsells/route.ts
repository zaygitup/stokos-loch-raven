import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UpsellRule from "@/models/upsellrule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const cleanCategories = (values: any[] = []) => {
  if (!Array.isArray(values)) return [];

  return values
    .map((item) => {
      if (typeof item === "string") return item;
      if (item?.name) return item.name;
      if (item?.slug) return item.slug;
      return "";
    })
    .filter(Boolean);
};

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId") || "towson";

    const upsellRules = await UpsellRule.find({ storeId })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: upsellRules });
  } catch (error) {
    console.error("GET UPSELL RULES ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch upsell rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const offer = body.offer || body.name;

    if (!offer) {
      return NextResponse.json(
        { success: false, message: "Offer is required" },
        { status: 400 }
      );
    }

    const name = body.name || offer;

  const upsellRule = await UpsellRule.create({
  storeId: body.storeId || "towson",
  name,
  slug: body.slug || slugify(name),
  offer,
  trigger: body.trigger || "",
  image: body.image || "",
  appliesToCategories: cleanCategories(
    body.appliesToCategories || body.categories || []
  ),
  sortOrder: Number(body.sortOrder || 0),
  status: body.status || "Active",
});

    return NextResponse.json(
      { success: true, data: upsellRule },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST UPSELL RULE ERROR:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Upsell rule already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create upsell rule" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const id = body.id || body._id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Upsell rule ID is required" },
        { status: 400 }
      );
    }

    const offer = body.offer || body.name;
    const name = body.name || offer;

    const updateData: any = {
  storeId: body.storeId || "towson",
  name,
  offer,
  trigger: body.trigger || "",
  image: body.image || "",
  appliesToCategories: cleanCategories(
    body.appliesToCategories || body.categories || []
  ),
  sortOrder: Number(body.sortOrder || 0),
  status: body.status || "Active",
};

    if (name) {
      updateData.slug = body.slug || slugify(name);
    }

    const upsellRule = await UpsellRule.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!upsellRule) {
      return NextResponse.json(
        { success: false, message: "Upsell rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: upsellRule });
  } catch (error) {
    console.error("PATCH UPSELL RULE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update upsell rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Upsell rule ID is required" },
        { status: 400 }
      );
    }

    const deletedUpsellRule = await UpsellRule.findByIdAndDelete(id);

    if (!deletedUpsellRule) {
      return NextResponse.json(
        { success: false, message: "Upsell rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Upsell rule deleted successfully",
    });
  } catch (error) {
    console.error("DELETE UPSELL RULE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete upsell rule" },
      { status: 500 }
    );
  }
}