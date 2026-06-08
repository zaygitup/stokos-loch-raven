import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ModifierGroup from "@/models/modifiergroup";
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

function cleanOptions(values: unknown): any[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();

  return values
    .map((item, index) => {
      if (typeof item === "string" || typeof item === "number") {
        const name = String(item || "").trim();
        if (!name) return null;

        const id = slugify(name) || `option-${index + 1}`;
        const key = id.toLowerCase();

        if (seen.has(key)) return null;
        seen.add(key);

        return {
          id,
          name,
          status: "Active",
        };
      }

      if (!item || typeof item !== "object") return null;

      const option = item as {
        id?: unknown;
        name?: unknown;
        label?: unknown;
        title?: unknown;
        value?: unknown;
        status?: unknown;
      };

      const name = String(
        option.name || option.label || option.title || option.value || ""
      ).trim();

      if (!name) return null;

      const id = String(option.id || slugify(name) || `option-${index + 1}`);
      const key = id.toLowerCase();

      if (seen.has(key)) return null;
      seen.add(key);

      return {
        id,
        name,
        status: option.status === "Inactive" ? "Inactive" : "Active",
      };
    })
    .filter(Boolean);
}

async function getUniqueSlug({
  baseSlug,
  currentId,
}: {
  baseSlug: string;
  currentId?: string;
}) {
  const cleanBaseSlug = baseSlug || `modifier-group-${Date.now()}`;
  let finalSlug = cleanBaseSlug;
  let counter = 2;

  while (true) {
    const filter: Record<string, any> = {
      slug: finalSlug,
    };

    if (currentId) {
      filter._id = { $ne: currentId };
    }

    const exists = await ModifierGroup.exists(filter);
    if (!exists) return finalSlug;

    finalSlug = `${cleanBaseSlug}-${counter}`;
    counter += 1;
  }
}

async function buildModifierPayload(body: any, currentId?: string) {
  const name = String(body.name || "").trim();

  const baseSlug = slugify(body.slug || name);

  const slug = await getUniqueSlug({
    baseSlug,
    currentId,
  });

  return {
    name,
    slug,
    options: cleanOptions(body.options),
    required: Boolean(body.required),
    minSelect: cleanNumber(body.minSelect),
    maxSelect: cleanNumber(body.maxSelect),
    sortOrder: cleanNumber(body.sortOrder),
    status: body.status === "Inactive" ? "Inactive" : "Active",
  };
}

function getRawAssignmentsFromBody(body: any) {
  if (Array.isArray(body.assignments)) {
    return body.assignments;
  }

  // Legacy support from old store-based modifier payloads.
  const storeId = String(body.storeId || body.storeSlug || "").trim();

  const categoryName = String(
    body.categoryName || body.appliesTo || body.categoryLabel || ""
  ).trim();

  const categoryId = String(
    body.categoryId ||
      body.category ||
      (Array.isArray(body.appliesToCategories)
        ? body.appliesToCategories[0]
        : "") ||
      slugify(categoryName) ||
      ""
  ).trim();

  if (!storeId || !categoryId || !categoryName) return [];

  return [
    {
      storeId,
      categoryId,
      categoryName,
      status: body.status || "Active",
      sortOrder: 0,
    },
  ];
}

function cleanAssignments(rawAssignments: unknown, modifierGroupId: string) {
  if (!Array.isArray(rawAssignments)) return [];

  const seen = new Set<string>();

  return rawAssignments
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;

      const assignment = item as {
        storeId?: unknown;
        storeSlug?: unknown;
        categoryId?: unknown;
        category?: unknown;
        categoryName?: unknown;
        appliesTo?: unknown;
        status?: unknown;
        sortOrder?: unknown;
      };

      const storeId = String(
        assignment.storeId || assignment.storeSlug || ""
      ).trim();

      const categoryName = String(
        assignment.categoryName || assignment.appliesTo || ""
      ).trim();

      const categoryId = String(
        assignment.categoryId ||
          assignment.category ||
          slugify(categoryName) ||
          ""
      ).trim();

      if (!storeId || !categoryId || !categoryName) return null;

      const key = `${storeId}__${categoryId}`.toLowerCase();

      if (seen.has(key)) return null;
      seen.add(key);

      return {
        modifierGroupId,
        storeId,
        categoryId,
        categoryName,
        sortOrder: cleanNumber(assignment.sortOrder ?? index),
        status: assignment.status === "Inactive" ? "Inactive" : "Active",
      };
    })
    .filter(Boolean);
}

async function syncAssignments({
  modifierGroupId,
  rawAssignments,
}: {
  modifierGroupId: string;
  rawAssignments: unknown;
}) {
  const assignments = cleanAssignments(rawAssignments, modifierGroupId);

  await ModifierGroupAssignment.deleteMany({ modifierGroupId });

  if (assignments.length) {
    await ModifierGroupAssignment.insertMany(assignments, {
      ordered: false,
    });
  }

  return ModifierGroupAssignment.find({ modifierGroupId })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
}

async function getAssignmentsForGroups(groupIds: string[]) {
  if (!groupIds.length) return [];

  return ModifierGroupAssignment.find({
    modifierGroupId: { $in: groupIds },
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
}

function mergeGroupsWithAssignments(groups: any[], assignments: any[]) {
  return groups.map((group) => {
    const groupId = String(group._id || group.id || "");

    return {
      ...group,
      id: groupId,
      assignments: assignments
        .filter((assignment) => {
          return String(assignment.modifierGroupId || "") === groupId;
        })
        .map((assignment) => ({
          ...assignment,
          id: String(assignment._id || assignment.id || ""),
          modifierGroupId: String(assignment.modifierGroupId || ""),
          storeId: String(assignment.storeId || ""),
          categoryId: String(assignment.categoryId || ""),
          categoryName: String(assignment.categoryName || ""),
          status: assignment.status === "Inactive" ? "Inactive" : "Active",
        })),
    };
  });
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const storeId = String(searchParams.get("storeId") || "").trim();

    const categoryValues = [
      searchParams.get("categoryId"),
      searchParams.get("categoryName"),
      searchParams.get("category"),
      searchParams.get("appliesTo"),
      ...searchParams.getAll("categoryIds"),
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    const hasAssignmentFilter = Boolean(storeId || categoryValues.length);

    let modifierGroups: any[] = [];

    if (hasAssignmentFilter) {
      const assignmentFilter: Record<string, any> = {};

      if (storeId) {
        assignmentFilter.storeId = storeId;
      }

      if (categoryValues.length) {
        assignmentFilter.$or = [
          { categoryId: { $in: categoryValues } },
          { categoryName: { $in: categoryValues } },
        ];
      }

      const matchedAssignments = await ModifierGroupAssignment.find(
        assignmentFilter
      ).lean();

      const groupIds = Array.from(
        new Set(
          matchedAssignments
            .map((assignment) => String(assignment.modifierGroupId || ""))
            .filter(Boolean)
        )
      );

      if (!groupIds.length) {
        return NextResponse.json({ success: true, data: [] });
      }

      modifierGroups = await ModifierGroup.find({
        _id: { $in: groupIds },
      })
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();
    } else {
      modifierGroups = await ModifierGroup.find({})
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();
    }

    const groupIds = modifierGroups
      .map((group) => String(group._id || ""))
      .filter(Boolean);

    const assignments = await getAssignmentsForGroups(groupIds);

    return NextResponse.json({
      success: true,
      data: mergeGroupsWithAssignments(modifierGroups, assignments),
    });
  } catch (error: any) {
    console.error("GET MODIFIER GROUPS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch modifier groups",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Modifier group name is required" },
        { status: 400 }
      );
    }

    const payload = await buildModifierPayload(body);
    const modifierGroup = await ModifierGroup.create(payload);

    const rawAssignments = getRawAssignmentsFromBody(body);

    const assignments = await syncAssignments({
      modifierGroupId: String(modifierGroup._id),
      rawAssignments,
    });

    const data = mergeGroupsWithAssignments(
      [modifierGroup.toObject()],
      assignments
    )[0];

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error("POST MODIFIER GROUP ERROR:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Modifier group already exists. Please use a different name.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create modifier group",
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
        { success: false, message: "Modifier group ID is required" },
        { status: 400 }
      );
    }

    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Modifier group name is required" },
        { status: 400 }
      );
    }

    const payload = await buildModifierPayload(body, id);

    const modifierGroup = await ModifierGroup.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!modifierGroup) {
      return NextResponse.json(
        { success: false, message: "Modifier group not found" },
        { status: 404 }
      );
    }

    let assignments;

    if ("assignments" in body) {
      assignments = await syncAssignments({
        modifierGroupId: id,
        rawAssignments: getRawAssignmentsFromBody(body),
      });
    } else {
      assignments = await ModifierGroupAssignment.find({
        modifierGroupId: id,
      })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean();
    }

    const data = mergeGroupsWithAssignments(
      [modifierGroup.toObject()],
      assignments
    )[0];

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("PATCH MODIFIER GROUP ERROR:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Modifier group already exists. Please use a different name.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update modifier group",
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
        { success: false, message: "Modifier group ID is required" },
        { status: 400 }
      );
    }

    const deletedModifierGroup = await ModifierGroup.findByIdAndDelete(id);

    if (!deletedModifierGroup) {
      return NextResponse.json(
        { success: false, message: "Modifier group not found" },
        { status: 404 }
      );
    }

    await ModifierGroupAssignment.deleteMany({
      modifierGroupId: id,
    });

    return NextResponse.json({
      success: true,
      message:
        "Global modifier group and all related store/category assignments deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE MODIFIER GROUP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete modifier group",
      },
      { status: 500 }
    );
  }
}
