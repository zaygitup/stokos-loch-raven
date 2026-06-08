"use client";

import { Upload, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";
import { ImageBox } from "../menu/components/ui";

export default function ImageUploadBox({
  label,
  image,
  alt,
  onUpload,
  onRemove,
}: {
  label: string;
  image?: string;
  alt: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 p-4">
      <label className="mb-3 block text-sm font-black text-zinc-700">
        {label}
      </label>

      <div className="flex items-center gap-4">
        <ImageBox src={image || ""} alt={alt} />

        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900">
              <Upload size={16} />
              Upload from PC
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUpload}
              />
            </label>

            {image && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
              >
                <Trash2 size={16} />
                Remove
              </button>
            )}
          </div>

          <p className="mt-2 text-xs font-semibold text-zinc-500">
            Upload JPG, PNG, or WEBP. Keep image under 1.5MB.
          </p>
        </div>
      </div>
    </div>
  );
}