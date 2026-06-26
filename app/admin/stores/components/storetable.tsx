"use client";

import { Clock, Edit3, MapPin, Phone, Trash2 } from "lucide-react";
import type { StoreItem } from "../page";

export default function StoreTable({
  stores,
  loading,
  onEdit,
  onDelete,
}: {
  stores: StoreItem[];
  loading: boolean;
  onEdit: (store: StoreItem) => void;
  onDelete: (storeId: string) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold text-zinc-500">Loading stores...</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-black text-zinc-950">Stores</h2>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          Store location details added in MongoDB.
        </p>
      </div>

      {stores.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
          <p className="text-sm font-bold text-zinc-400">
            No stores added yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-5 py-4">Store</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Opening Hours</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-200">
                {stores.map((store) => (
                  <tr key={store._id} className="bg-white">
                    <td className="px-5 py-5 align-top">
                      <h3 className="text-lg font-black text-zinc-950">
                        {store.name}
                      </h3>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                        /store/{store.slug}
                      </p>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="flex gap-2 font-semibold text-zinc-700">
                        <MapPin
                          size={17}
                          className="mt-0.5 shrink-0 text-[#DA3327]"
                        />
                        <span>{store.location}</span>
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="flex gap-2 font-semibold text-zinc-700">
                        <Phone
                          size={17}
                          className="mt-0.5 shrink-0 text-[#DA3327]"
                        />
                        <span>{store.phone}</span>
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="flex gap-2 font-semibold text-zinc-700">
                        <Clock
                          size={17}
                          className="mt-0.5 shrink-0 text-[#DA3327]"
                        />
                        <span className="whitespace-pre-line">
                          {store.openingHours}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(store)}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700 transition hover:bg-zinc-50"
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(store._id)}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-[#DA3327] transition hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}