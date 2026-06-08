import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ModifierGroupAssignment from "@/models/modifiergroupassignment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

function cleanNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function cleanAssignment(body: any) {
  const modifierGroupId = String(body.modifierGroupId || "").trim();
  const storeId = String(body.storeId || body.storeSlug || "").trim();

  const categoryName = String(
    body.categoryName || body.appliesTo || ""
  ).trim();

  const categoryId = String(
    body.categoryId || body.category || slugify(categoryName) || ""
  ).trim();

  return {
    modifierGroupId,
    storeId,
    categoryId,
    categoryName,
    sortOrder: cleanNumber(body.sortOrder),
    status: body.status === "Inactive" ? "Inactive" : "Active",
  };
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const modifierGroupId = String(
      searchParams.get("modifierGroupId") || ""
    ).trim();

    const storeId = String(searchParams.get("storeId") || "").trim();

    const categoryId = String(searchParams.get("categoryId") || "").trim();
    const categoryName = String(searchParams.get("categoryName") || "").trim();

    const filter: Record<string, any> = {};

    if (modifierGroupId) filter.modifierGroupId = modifierGroupId;
    if (storeId) filter.storeId = storeId;

    if (categoryId || categoryName) {
      filter.$or = [];

      if (categoryId) filter.$or.push({ categoryId });
      if (categoryName) filter.$or.push({ categoryName });
    }

    const assignments = await ModifierGroupAssignment.find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error("GET MODIFIER GROUP ASSIGNMENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch modifier group assignments",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const payload = cleanAssignment(body);

    if (!payload.modifierGroupId) {
      return NextResponse.json(
        { success: false, message: "Modifier group ID is required" },
        { status: 400 }
      );
    }

    if (!payload.storeId) {
      return NextResponse.json(
        { success: false, message: "Store is required" },
        { status: 400 }
      );
    }

    if (!payload.categoryId || !payload.categoryName) {
      return NextResponse.json(
        { success: false, message: "Category is required" },
        { status: 400 }
      );
    }

    const assignment = await ModifierGroupAssignment.findOneAndUpdate(
      {
        modifierGroupId: payload.modifierGroupId,
        storeId: payload.storeId,
        categoryId: payload.categoryId,
      },
      payload,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return NextResponse.json(
      { success: true, data: assignment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST MODIFIER GROUP ASSIGNMENT ERROR:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "This modifier group is already assigned to this store/category.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create modifier group assignment",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const id = String(body.id || body._id || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const payload = cleanAssignment(body);

    const assignment = await ModifierGroupAssignment.findByIdAndUpdate(
      id,
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error("PATCH MODIFIER GROUP ASSIGNMENT ERROR:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "This modifier group is already assigned to this store/category.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update modifier group assignment",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const id = String(searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const deletedAssignment =
      await ModifierGroupAssignment.findByIdAndDelete(id);

    if (!deletedAssignment) {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Modifier group assignment deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE MODIFIER GROUP ASSIGNMENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete modifier group assignment",
      },
      { status: 500 }
    );
  }
}
