"use client";

import Picker from "react-mobile-picker";

// A single-column scroll wheel of pre-computed valid time slots. All
// constraint logic (now+lead → close) lives in the parent via
// lib/time-slots.ts; this component only displays and selects.
export default function TimeWheelPicker({
  slots,
  value,
  onChange,
}: {
  slots: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (slots.length === 0) return null;

  const safeValue = slots.includes(value) ? value : slots[0];

  return (
    <Picker
      value={{ time: safeValue }}
      onChange={(val) => onChange(String(val.time))}
      height={150}
      itemHeight={36}
      wheelMode="natural"
      className="rounded-xl border border-zinc-200 bg-white"
    >
      <Picker.Column name="time">
        {slots.map((slot) => (
          <Picker.Item key={slot} value={slot}>
            {({ selected }) => (
              <div
                className={
                  selected
                    ? "text-base font-black text-green-700"
                    : "text-sm font-semibold text-zinc-400"
                }
              >
                {slot}
              </div>
            )}
          </Picker.Item>
        ))}
      </Picker.Column>
    </Picker>
  );
}
