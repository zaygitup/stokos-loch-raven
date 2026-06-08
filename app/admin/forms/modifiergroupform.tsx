"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type {
  Category,
  ModifierGroup,
  ModifierGroupAssignment,
  ModifierOption,
} from "../menu/types";
import { FormInput } from "../menu/components/ui";

export type ModifierGroupFormRef = {
  submit: () => void;
};

type StoreItem = {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  value?: string;
};

type CategoryWithMongo = Category & {
  _id?: string;
  storeId?: unknown;
  storeSlug?: unknown;
  store?: unknown;
};

type ModifierGroupWithMongo = ModifierGroup & {
  _id?: string;
};

type ModifierGroupFormProps = {
  item: ModifierGroup | null;
  categories: Category[];
  stores?: StoreItem[];
  selectedStoreId?: string;
  onSave: (value: any) => void;
};

type AssignmentForm = ModifierGroupAssignment & {
  localId: string;
};

type ModifierGroupFormState = Omit<
  ModifierGroupWithMongo,
  "options" | "assignments"
> & {
  options: ModifierOption[];
  assignments: AssignmentForm[];
};

type MongoObject = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function createLocalId() {
  return `assignment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeStoreValue(value: unknown) {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (typeof value === "object") {
    const obj = value as MongoObject;
    return String(obj.slug || obj._id || obj.id || obj.name || "").trim();
  }

  return "";
}

function getStoreValue(store: StoreItem) {
  return String(
    store.value || store.slug || store._id || store.id || store.name || ""
  ).trim();
}

function getStoreAliases(store: StoreItem) {
  return [
    store.value,
    store.slug,
    store._id,
    store.id,
    store.name,
    getStoreValue(store),
  ]
    .filter(Boolean)
    .map((item) => String(item).trim());
}

function isSameStoreValue(stores: StoreItem[], first: string, second: string) {
  const cleanFirst = String(first || "").trim();
  const cleanSecond = String(second || "").trim();

  if (!cleanFirst || !cleanSecond) return false;
  if (cleanFirst === cleanSecond) return true;

  return stores.some((store) => {
    const aliases = getStoreAliases(store);
    return aliases.includes(cleanFirst) && aliases.includes(cleanSecond);
  });
}

function getCategoryStoreId(category: unknown) {
  if (!category || typeof category !== "object") return "";

  const obj = category as {
    storeId?: unknown;
    storeSlug?: unknown;
    store?: unknown;
  };

  return (
    normalizeStoreValue(obj.storeId) ||
    normalizeStoreValue(obj.storeSlug) ||
    normalizeStoreValue(obj.store)
  );
}

function getCategoryValue(category: CategoryWithMongo) {
  return String(
    category._id || category.id || category.slug || category.name || ""
  ).trim();
}

function filterCategoriesByStore(
  categories: CategoryWithMongo[],
  selectedStoreId: string,
  stores: StoreItem[]
) {
  const cleanStoreId = String(selectedStoreId || "").trim();

  if (!cleanStoreId) return [];

  return categories.filter((category) => {
    const categoryStoreId = getCategoryStoreId(category);

    if (!categoryStoreId) return false;

    return isSameStoreValue(stores, categoryStoreId, cleanStoreId);
  });
}

function findCategoryByValue(categories: CategoryWithMongo[], value: string) {
  const cleanValue = String(value || "").trim().toLowerCase();

  if (!cleanValue) return undefined;

  return categories.find((category) => {
    return [
      category._id,
      category.id,
      category.slug,
      category.name,
      getCategoryValue(category),
    ]
      .filter(Boolean)
      .map((item) => String(item).trim().toLowerCase())
      .includes(cleanValue);
  });
}

function normalizeOptionForForm(
  option: unknown,
  index: number
): ModifierOption | null {
  if (typeof option === "string" || typeof option === "number") {
    const name = String(option || "").trim();
    if (!name) return null;

    return {
      id: slugify(name) || `option-${index + 1}`,
      name,
      status: "Active",
    };
  }

  if (!option || typeof option !== "object") return null;

  const obj = option as {
    id?: string;
    name?: string;
    label?: string;
    title?: string;
    value?: string;
    status?: "Active" | "Inactive";
  };

  const name = String(
    obj.name || obj.label || obj.title || obj.value || ""
  ).trim();

  if (!name) return null;

  return {
    id: String(obj.id || slugify(name) || `option-${index + 1}`),
    name,
    status: obj.status === "Inactive" ? "Inactive" : "Active",
  };
}

function parseOptionsText(
  value: string,
  previousOptions: ModifierOption[] = []
): ModifierOption[] {
  const previousBySlug = new Map<string, ModifierOption>();

  previousOptions.forEach((option) => {
    const key = slugify(option.name || option.id || "");
    if (key) previousBySlug.set(key, option);
  });

  const seen = new Set<string>();

  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name, index) => {
      const key = slugify(name) || `option-${index + 1}`;

      if (seen.has(key)) return null;
      seen.add(key);

      const existing = previousBySlug.get(key);

      return {
        id: existing?.id || key,
        name,
        status: existing?.status === "Inactive" ? "Inactive" : "Active",
      };
    })
    .filter(Boolean) as ModifierOption[];
}

function optionsToText(options: ModifierOption[]) {
  return options
    .map((option) => String(option.name || "").trim())
    .filter(Boolean)
    .join("\n");
}

function createEmptyAssignment(sortOrder = 0): AssignmentForm {
  return {
    localId: createLocalId(),
    storeId: "",
    categoryId: "",
    categoryName: "",
    sortOrder,
    status: "Active",
  };
}

function getAssignmentKey(storeId: string, categoryId: string) {
  const cleanStoreId = String(storeId || "").trim().toLowerCase();
  const cleanCategoryId = String(categoryId || "").trim().toLowerCase();

  if (!cleanStoreId || !cleanCategoryId) return "";

  return `${cleanStoreId}__${cleanCategoryId}`;
}

function isDuplicateAssignmentValue(
  assignments: AssignmentForm[],
  currentLocalId: string,
  storeId: string,
  categoryId: string
) {
  const nextKey = getAssignmentKey(storeId, categoryId);

  if (!nextKey) return false;

  return assignments.some((assignment) => {
    if (assignment.localId === currentLocalId) return false;

    return (
      getAssignmentKey(assignment.storeId, assignment.categoryId) === nextKey
    );
  });
}

function normalizeAssignmentForForm(
  assignment: unknown,
  categories: CategoryWithMongo[],
  index: number
): AssignmentForm | null {
  if (!assignment || typeof assignment !== "object") return null;

  const obj = assignment as {
    _id?: string;
    id?: string;
    modifierGroupId?: string;
    storeId?: string;
    storeSlug?: string;
    categoryId?: string;
    category?: string;
    categoryName?: string;
    appliesTo?: string;
    status?: "Active" | "Inactive";
    sortOrder?: number;
  };

  const storeId = String(obj.storeId || obj.storeSlug || "").trim();

  const rawCategoryId = String(obj.categoryId || obj.category || "").trim();

  const matchedCategory = rawCategoryId
    ? findCategoryByValue(categories, rawCategoryId)
    : undefined;

  const categoryId = matchedCategory
    ? getCategoryValue(matchedCategory)
    : rawCategoryId;

  const categoryName = String(
    obj.categoryName || obj.appliesTo || matchedCategory?.name || ""
  ).trim();

  if (!storeId || !categoryId || !categoryName) return null;

  return {
    _id: obj._id,
    id: obj.id,
    modifierGroupId: obj.modifierGroupId,
    localId: obj.id || obj._id || createLocalId(),
    storeId,
    categoryId,
    categoryName,
    sortOrder: Number(obj.sortOrder ?? index),
    status: obj.status === "Inactive" ? "Inactive" : "Active",
  };
}

function buildInitialForm({
  item,
  categories,
}: {
  item: ModifierGroup | null;
  categories: CategoryWithMongo[];
}): ModifierGroupFormState {
  if (item) {
    const modifier = item as ModifierGroupWithMongo;

    const directAssignments = Array.isArray(modifier.assignments)
      ? modifier.assignments
      : [];

    const legacyAssignments =
      !directAssignments.length && modifier.storeId
        ? [
            {
              storeId: modifier.storeId,
              categoryId:
                modifier.categoryId ||
                modifier.category ||
                modifier.appliesToCategories?.[0] ||
                "",
              categoryName: modifier.categoryName || modifier.appliesTo || "",
              status: modifier.status || "Active",
            },
          ]
        : [];

    const assignments = [...directAssignments, ...legacyAssignments]
      .map((assignment, index) =>
        normalizeAssignmentForForm(assignment, categories, index)
      )
      .filter(Boolean) as AssignmentForm[];

    const options = Array.isArray(modifier.options)
      ? (modifier.options
          .map((option, index) => normalizeOptionForForm(option, index))
          .filter(Boolean) as ModifierOption[])
      : [];

    return {
      ...modifier,
      name: String(modifier.name || ""),
      options,
      assignments: assignments.length ? assignments : [createEmptyAssignment()],
      required: Boolean(modifier.required),
      minSelect: Number(modifier.minSelect || 0),
      maxSelect: Number(modifier.maxSelect || 0),
      sortOrder: Number(modifier.sortOrder || 0),
      status: modifier.status || "Active",
    };
  }

  return {
    id: "",
    name: "",
    options: [],
    assignments: [createEmptyAssignment()],
    required: false,
    minSelect: 0,
    maxSelect: 0,
    sortOrder: 0,
    status: "Active",
  };
}

function getItemKey(item: ModifierGroup | null) {
  if (!item) return "new";

  return String(
    item._id ||
      item.id ||
      item.slug ||
      item.name ||
      item.updatedAt ||
      "modifier"
  );
}

const ModifierGroupForm = forwardRef<
  ModifierGroupFormRef,
  ModifierGroupFormProps
>(function ModifierGroupForm({ item, categories, stores, onSave }, ref) {
  const safeStores = Array.isArray(stores) ? stores : [];
  const safeCategories = Array.isArray(categories)
    ? (categories as CategoryWithMongo[])
    : [];

  const itemKey = getItemKey(item);

  const [form, setForm] = useState<ModifierGroupFormState>(() =>
    buildInitialForm({
      item,
      categories: safeCategories,
    })
  );

  const [optionsText, setOptionsText] = useState(() =>
    optionsToText(form.options)
  );

  useEffect(() => {
    const nextForm = buildInitialForm({
      item,
      categories: safeCategories,
    });

    setForm(nextForm);
    setOptionsText(optionsToText(nextForm.options));
  }, [itemKey, safeCategories.length, safeStores.length]);

  const parsedOptions = parseOptionsText(optionsText, form.options);

  const getVisibleCategoriesForStore = (storeId: string) => {
    return filterCategoriesByStore(safeCategories, storeId, safeStores);
  };

  const getAvailableStoresForAssignment = (currentLocalId: string) => {
    const selectedStoreIds = form.assignments
      .filter((assignment) => assignment.localId !== currentLocalId)
      .map((assignment) => String(assignment.storeId || "").trim())
      .filter(Boolean);

    return safeStores.filter((store) => {
      const storeValue = getStoreValue(store);

      if (!storeValue) return false;

      return !selectedStoreIds.some((selectedStoreId) =>
        isSameStoreValue(safeStores, storeValue, selectedStoreId)
      );
    });
  };

  const hasAvailableStoreForNewAssignment = () => {
    const selectedStoreIds = form.assignments
      .map((assignment) => String(assignment.storeId || "").trim())
      .filter(Boolean);

    return safeStores.some((store) => {
      const storeValue = getStoreValue(store);

      if (!storeValue) return false;

      return !selectedStoreIds.some((selectedStoreId) =>
        isSameStoreValue(safeStores, storeValue, selectedStoreId)
      );
    });
  };

  const addAssignment = () => {
    if (!hasAvailableStoreForNewAssignment()) {
      alert("All stores are already assigned.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      assignments: [
        ...prev.assignments,
        createEmptyAssignment(prev.assignments.length),
      ],
    }));
  };

  const removeAssignment = (localId: string) => {
    setForm((prev) => ({
      ...prev,
      assignments: prev.assignments.filter(
        (assignment) => assignment.localId !== localId
      ),
    }));
  };

  const updateAssignment = (
    localId: string,
    patch: Partial<AssignmentForm>
  ) => {
    setForm((prev) => ({
      ...prev,
      assignments: prev.assignments.map((assignment) =>
        assignment.localId === localId
          ? {
              ...assignment,
              ...patch,
            }
          : assignment
      ),
    }));
  };

  const handleAssignmentStoreChange = (localId: string, storeId: string) => {
    updateAssignment(localId, {
      storeId,
      categoryId: "",
      categoryName: "",
    });
  };

  const handleAssignmentCategoryChange = (
    localId: string,
    storeId: string,
    categoryId: string
  ) => {
    const visibleCategories = getVisibleCategoriesForStore(storeId);
    const matchedCategory = findCategoryByValue(visibleCategories, categoryId);

    const nextCategoryId = matchedCategory
      ? getCategoryValue(matchedCategory)
      : categoryId;

    if (
      isDuplicateAssignmentValue(
        form.assignments,
        localId,
        storeId,
        nextCategoryId
      )
    ) {
      alert("This store/category assignment already exists.");
      return;
    }

    updateAssignment(localId, {
      categoryId: nextCategoryId,
      categoryName: matchedCategory?.name || "",
    });
  };

  const submit = () => {
    if (!form.name.trim()) {
      alert("Modifier group name required");
      return;
    }

    const cleanOptions = parseOptionsText(optionsText, form.options);

    if (!cleanOptions.length) {
      alert("At least one option is required");
      return;
    }

    const rawAssignments = form.assignments
      .map((assignment, index) => {
        const storeId = String(assignment.storeId || "").trim();
        const categoryId = String(assignment.categoryId || "").trim();
        const categoryName = String(assignment.categoryName || "").trim();

        if (!storeId || !categoryId || !categoryName) return null;

        return {
          id: assignment.id,
          _id: assignment._id,
          modifierGroupId: assignment.modifierGroupId,
          storeId,
          categoryId,
          categoryName,
          sortOrder: Number(assignment.sortOrder ?? index),
          status: assignment.status === "Inactive" ? "Inactive" : "Active",
        };
      })
      .filter(Boolean) as ModifierGroupAssignment[];

    const seenStoreIds = new Set<string>();
    const cleanAssignments: ModifierGroupAssignment[] = [];

    rawAssignments.forEach((assignment) => {
      const storeKey = String(assignment.storeId || "").trim().toLowerCase();

      if (!storeKey || seenStoreIds.has(storeKey)) return;

      seenStoreIds.add(storeKey);

      cleanAssignments.push({
        ...assignment,
        sortOrder: cleanAssignments.length,
      });
    });

    if (!cleanAssignments.length) {
      alert("At least one store/category assignment is required");
      return;
    }

    const minSelect = Number(form.minSelect || 0);
    const maxSelect = Number(form.maxSelect || 0);

    const finalMinSelect = form.required
      ? Math.max(1, minSelect || 1)
      : minSelect;

    if (maxSelect > 0 && finalMinSelect > maxSelect) {
      alert("Min selection cannot be greater than max selection");
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      options: cleanOptions,
      assignments: cleanAssignments,
      required: Boolean(form.required),
      minSelect: finalMinSelect,
      maxSelect,
      sortOrder: Number(form.sortOrder || 0),
      status: form.status || "Active",

      storeId: undefined,
      appliesTo: undefined,
      appliesToCategories: undefined,
      category: undefined,
      categoryId: undefined,
      categoryName: undefined,
    });
  };

  useImperativeHandle(ref, () => ({ submit }));

  const disableAddAssignment = !hasAvailableStoreForNewAssignment();

  return (
    <div className="space-y-5">
      <FormInput
        label="Modifier Group Name"
        value={form.name}
        onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
        placeholder="Pizza Toppings"
      />

      <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
        <div className="mb-4">
          <p className="text-sm font-black text-zinc-900">Modifier Options</p>

          <p className="mt-1 text-xs font-semibold text-zinc-500">
            Add option names only. Put one option per line. Prices will be
            handled later in Product Form.
          </p>
        </div>

        <textarea
          value={optionsText}
          onChange={(event) => setOptionsText(event.target.value)}
          placeholder={`Pepperoni\nMushrooms\nGreen Peppers\nExtra Cheese`}
          rows={9}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-900 outline-none transition placeholder:text-zinc-300 focus:border-green-700"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-zinc-500">
            {parsedOptions.length} option
            {parsedOptions.length === 1 ? "" : "s"} ready to save
          </p>

          <button
            type="button"
            onClick={() => setOptionsText("")}
            className="rounded-full bg-white px-4 py-2 text-xs font-black text-red-600 ring-1 ring-zinc-200 transition hover:bg-red-50"
          >
            Clear Options
          </button>
        </div>
      </div>

      <div className="rounded-[22px] border border-zinc-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-zinc-900">
              Where This Group Appears
            </p>

            <p className="mt-1 text-xs font-semibold text-zinc-500">
              Assign this global modifier group to store/category combinations.
            </p>
          </div>

          <button
            type="button"
            onClick={addAssignment}
            disabled={disableAddAssignment}
            className="rounded-full bg-green-800 px-4 py-2 text-xs font-black text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            Add Store/Category
          </button>
        </div>

        <div className="space-y-4">
          {form.assignments.map((assignment, index) => {
            const visibleCategories = getVisibleCategoriesForStore(
              assignment.storeId
            );

            const availableStores = getAvailableStoresForAssignment(
              assignment.localId
            );

            return (
              <div
                key={assignment.localId}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.7fr]">
                  <div>
                    <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-zinc-400">
                      Store
                    </label>

                    <select
                      value={assignment.storeId}
                      onChange={(event) =>
                        handleAssignmentStoreChange(
                          assignment.localId,
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-green-700"
                    >
                      <option value="">Select Store</option>

                      {availableStores.map((store) => {
                        const value = getStoreValue(store);

                        return (
                          <option key={value} value={value}>
                            {store.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-zinc-400">
                      Category
                    </label>

                    <select
                      value={assignment.categoryId}
                      onChange={(event) =>
                        handleAssignmentCategoryChange(
                          assignment.localId,
                          assignment.storeId,
                          event.target.value
                        )
                      }
                      disabled={!assignment.storeId}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-green-700 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                    >
                      <option value="">
                        {assignment.storeId
                          ? "Select Category"
                          : "Select Store First"}
                      </option>

                      {visibleCategories.map((category) => {
                        const value = getCategoryValue(category);

                        return (
                          <option
                            key={`${assignment.storeId}-${value}`}
                            value={value}
                          >
                            {category.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-zinc-400">
                      Status
                    </label>

                    <select
                      value={assignment.status || "Active"}
                      onChange={(event) =>
                        updateAssignment(assignment.localId, {
                          status: event.target.value as "Active" | "Inactive",
                        })
                      }
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-green-700"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {!visibleCategories.length && assignment.storeId && (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    No categories found for this store.
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-zinc-500">
                    Assignment #{index + 1}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeAssignment(assignment.localId)}
                    className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-600 transition hover:bg-red-100"
                  >
                    Remove Assignment
                  </button>
                </div>
              </div>
            );
          })}

          {!form.assignments.length && (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-center">
              <p className="text-xs font-semibold text-zinc-400">
                No assignments added.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-500">
            Min Select
          </label>

          <input
            type="number"
            min="0"
            value={form.minSelect || 0}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                minSelect: Number(event.target.value || 0),
              }))
            }
            className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-green-700"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-zinc-500">
            Max Select
          </label>

          <input
            type="number"
            min="0"
            value={form.maxSelect || 0}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                maxSelect: Number(event.target.value || 0),
              }))
            }
            className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm font-bold outline-none focus:border-green-700"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 p-4">
        <input
          type="checkbox"
          checked={Boolean(form.required)}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              required: event.target.checked,
              minSelect: event.target.checked
                ? Math.max(1, prev.minSelect || 1)
                : prev.minSelect,
            }))
          }
          className="h-5 w-5 accent-green-800"
        />

        <span className="text-sm font-black text-zinc-700">
          Required selection
        </span>
      </label>
    </div>
  );
});

ModifierGroupForm.displayName = "ModifierGroupForm";

export default ModifierGroupForm;