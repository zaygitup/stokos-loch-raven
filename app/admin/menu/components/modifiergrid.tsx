"use client";

import type {
  ModifierGroup,
  ModifierGroupAssignment,
  ModifierOption,
} from "../types";
import { ActionButtons, EmptyBox } from "./ui";

type StoreItem = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
};

type MongoModifierGroup = ModifierGroup & {
  _id?: string;
  id?: string;
};

type MongoObject = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
};

function getModifierId(group: MongoModifierGroup) {
  return String(group._id || group.id || "").trim();
}

function getModifierKey(group: MongoModifierGroup, fallback: string) {
  return getModifierId(group) || String(group.slug || group.name || fallback);
}

function getStoreValue(store: StoreItem) {
  return String(store.slug || store._id || store.id || store.name || "").trim();
}

function getStoreAliases(store: StoreItem) {
  return [store.slug, store._id, store.id, store.name, getStoreValue(store)]
    .filter(Boolean)
    .map((item) => String(item).trim());
}

function getStoreName(stores: StoreItem[], storeId: string) {
  const cleanStoreId = String(storeId || "").trim();

  if (!cleanStoreId) return "No Store";

  const foundStore = stores.find((store) => {
    return getStoreAliases(store).includes(cleanStoreId);
  });

  return foundStore?.name || cleanStoreId;
}

function getOptionName(option: unknown) {
  if (!option) return "";

  if (typeof option === "string" || typeof option === "number") {
    return String(option);
  }

  if (typeof option === "object") {
    const obj = option as ModifierOption;
    return obj.name || "Option";
  }

  return "";
}

function normalizeAssignment(assignment: unknown): ModifierGroupAssignment | null {
  if (!assignment || typeof assignment !== "object") return null;

  const obj = assignment as ModifierGroupAssignment & MongoObject;

  const storeId = String(obj.storeId || "").trim();
  const categoryId = String(obj.categoryId || "").trim();
  const categoryName = String(obj.categoryName || "").trim();

  if (!storeId || !categoryId || !categoryName) return null;

  return {
    ...obj,
    id: String(obj._id || obj.id || ""),
    storeId,
    categoryId,
    categoryName,
    status: obj.status === "Inactive" ? "Inactive" : "Active",
  };
}

export default function ModifierGrid({
  modifierGroups,
  stores = [],
  onEdit,
  onDelete,
}: {
  modifierGroups: ModifierGroup[];
  stores?: StoreItem[];
  onEdit: (modifier: ModifierGroup) => void;
  onDelete: (id: string) => void;
}) {
  const safeModifierGroups = Array.isArray(modifierGroups)
    ? (modifierGroups as MongoModifierGroup[])
    : [];

  if (!safeModifierGroups.length) {
    return <EmptyBox message="No modifier groups found." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {safeModifierGroups.map((group, index) => {
        const groupId = getModifierId(group);
        const groupKey = getModifierKey(group, `${group.name}-${index}`);

        const options = Array.isArray(group.options) ? group.options : [];

        const assignments = Array.isArray(group.assignments)
          ? (group.assignments
              .map((assignment) => normalizeAssignment(assignment))
              .filter(Boolean) as ModifierGroupAssignment[])
          : [];

        return (
          <div
            key={groupKey}
            className="rounded-[26px] border border-zinc-200 bg-white p-5 transition hover:border-green-300 hover:shadow-sm"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-black text-zinc-950">{group.name}</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-black ${
                      group.status === "Inactive"
                        ? "bg-red-50 text-red-600"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {group.status || "Active"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-black ${
                      group.required
                        ? "bg-green-800 text-white"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {group.required ? "Required" : "Optional"}
                  </span>
                </div>
              </div>

              <ActionButtons
                onEdit={() => onEdit(group)}
                onDelete={() => {
                  if (!groupId) {
                    alert("Modifier group ID missing. Please refresh and try again.");
                    return;
                  }

                  const confirmed = window.confirm(
                    "This will delete the global modifier group and all store/category assignments. Continue?"
                  );

                  if (!confirmed) return;

                  onDelete(groupId);
                }}
              />
            </div>

            <div className="mb-5">
              <p className="mb-3 text-xs font-black uppercase tracking-wide text-zinc-400">
                Store / Category Links
              </p>

              {assignments.length ? (
                <div className="space-y-2">
                  {assignments.map((assignment, assignmentIndex) => (
                    <div
                      key={`${groupKey}-assignment-${
                        assignment.id || assignmentIndex
                      }`}
                      className="rounded-2xl border border-zinc-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-zinc-900">
                            {getStoreName(stores, assignment.storeId)}
                          </p>

                          <p className="mt-1 text-xs font-bold text-zinc-500">
                            {assignment.categoryName}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            assignment.status === "Inactive"
                              ? "bg-red-50 text-red-600"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {assignment.status || "Active"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold text-zinc-400">
                    No store/category links.
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-wide text-zinc-400">
                  Options
                </p>

                <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-black text-zinc-700">
                  {options.length} option{options.length === 1 ? "" : "s"}
                </span>
              </div>

              {options.length ? (
                <div className="flex flex-wrap gap-2">
                  {options.map((option, optionIndex) => {
                    const optionName = getOptionName(option);

                    if (!optionName) return null;

                    return (
                      <span
                        key={`${groupKey}-option-${optionIndex}-${optionName}`}
                        className="rounded-full bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-700"
                      >
                        {optionName}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold text-zinc-400">
                    No options added.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}