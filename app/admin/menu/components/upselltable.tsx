"use client";

import type { Product, UpsellRule } from "../types";
import { ActionButtons, EmptyBox, ImageBox, StatusBadge, TableHead } from "./ui";

type StoreItem = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
};

type MongoObject = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
};

type MongoUpsellRule = UpsellRule & {
  _id?: string;
  id?: string;
  name?: string;
  appliesToCategories?: string[];
  storeId?: unknown;
  storeSlug?: unknown;
  store?: unknown;
};

function getUpsellId(rule: MongoUpsellRule, fallback: string) {
  return String(rule._id || rule.id || rule.slug || rule.offer || fallback);
}

function getStoreValue(store: StoreItem) {
  return String(store.slug || store._id || store.id || "").trim();
}

function getItemStoreId(item: unknown) {
  if (!item || typeof item !== "object") return "";

  const obj = item as {
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

function getStoreName(stores: StoreItem[], item: unknown) {
  const storeId = getItemStoreId(item);

  if (!storeId) return "No Store";

  const foundStore = stores.find((store) => getStoreValue(store) === storeId);

  return foundStore?.name || storeId;
}

export default function UpsellTable({
  upsellRules = [],
  stores = [],
  products = [],
  onEdit,
  onDelete,
}: {
  upsellRules?: UpsellRule[];
  stores?: StoreItem[];
  products?: Product[];
  onEdit: (upsell: UpsellRule) => void;
  onDelete: (id: string) => void;
})  {
  const safeUpsells = Array.isArray(upsellRules)
    ? (upsellRules as MongoUpsellRule[])
    : [];

  if (safeUpsells.length === 0) {
    return <EmptyBox message="No upsell rules found." />;
  }

  return (
    <div className="overflow-hidden rounded-[26px] border border-zinc-200">
      <div className="border-b border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-lg font-black">Upsell Rules</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Suggest checkout add-ons based on product category or cart.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead className="border-b border-zinc-200 bg-white">
            <tr>
              <TableHead>Upsell</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {safeUpsells.map((rule, index) => {
              const ruleId = getUpsellId(rule, `upsell-${index}`);
              const storeName = getStoreName(stores, rule);

              return (
                <tr key={ruleId} className="transition hover:bg-green-50/50">
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <ImageBox
                        src={rule.image || ""}
                        alt={rule.offer || rule.name || "Upsell"}
                      />

                      <div>
                        <p className="font-black text-zinc-950">
                          {rule.offer || rule.name || "No offer"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-zinc-500">
                          {ruleId}
                        </p>

                        {Array.isArray(rule.appliesToCategories) &&
                          rule.appliesToCategories.length > 0 && (
                            <p className="mt-1 text-xs font-semibold text-zinc-400">
                              Categories: {rule.appliesToCategories.join(", ")}
                            </p>
                          )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-800">
                      {storeName}
                    </span>
                  </td>

                  <td className="px-5 py-5 text-sm font-black">
                    {rule.trigger || "Any Product"}
                  </td>

                  <td className="px-5 py-5">
                    <StatusBadge status={rule.status || "Paused"} />
                  </td>

                  <td className="px-5 py-5">
                    <ActionButtons
                      onEdit={() => onEdit(rule)}
                      onDelete={() => onDelete(ruleId)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}