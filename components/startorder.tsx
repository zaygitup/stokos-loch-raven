"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { X, ChevronRight, Clock } from "lucide-react";
import { STORES } from "@/lib/data/stores";
import TimeWheelPicker from "@/components/timewheelpicker";
import DeliveryMapPicker, {
  type DeliverySelection,
} from "@/components/deliverymappicker";
import { generateTimeSlots, type DayHours } from "@/lib/time-slots";

type OrderType = "pickup" | "delivery";

type StoreConfig = {
  latitude: number | null;
  longitude: number | null;
  deliveryRadiusKm: number;
  timezone: string;
  hours: DayHours[];
};

const DEFAULT_CONFIG: StoreConfig = {
  latitude: null,
  longitude: null,
  deliveryRadiusKm: 8,
  timezone: "America/New_York",
  hours: [],
};

export default function StartOrder() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam || "towson";

  const store = STORES.find((item) => item.slug === slug) || STORES[0];

  const [modalOpen, setModalOpen] = useState(false);
  const [orderTypeForced, setOrderTypeForced] = useState(false);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [address, setAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [deliveryWithinRadius, setDeliveryWithinRadius] = useState(false);
  const [day, setDay] = useState("Today");
  const [timeMode, setTimeMode] = useState<"asap" | "schedule">("asap");
  const [time, setTime] = useState("ASAP");

  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG);

  const isOrderLaterOnly =
    orderType === "delivery" && store.deliveryOrderLaterOnly;
  const asapAllowed = !isOrderLaterOnly;
  const hasGeo = config.latitude != null && config.longitude != null;

  // Slots for the currently selected day, constrained to the store's hours.
  const slots = useMemo(
    () =>
      generateTimeSlots({
        hours: config.hours,
        timezone: config.timezone,
        day,
      }),
    [config.hours, config.timezone, day]
  );

  const scheduleAvailable = slots.length > 0;

  // The time we actually commit: ASAP, or the chosen slot snapped to the first
  // available one when the current pick is no longer offered (e.g. day change).
  const effectiveTime =
    timeMode === "asap"
      ? "ASAP"
      : slots.includes(time)
        ? time
        : slots[0] ?? "";

  const timeValid =
    timeMode === "asap" ? asapAllowed : scheduleAvailable;

  // Load saved order selections for this store (or reset + force selection
  // when arriving at a different store).
  useEffect(() => {
    const savedStore = localStorage.getItem("stokos_order_store");

    if (savedStore && savedStore !== store.slug) {
      localStorage.removeItem("stokos_order_type");
      localStorage.removeItem("stokos_delivery_address");
      localStorage.removeItem("stokos_delivery_lat");
      localStorage.removeItem("stokos_delivery_lng");
      localStorage.removeItem("stokos_order_day");
      localStorage.removeItem("stokos_order_time");
      localStorage.removeItem("stokos_order_store");
      setOrderTypeForced(true);
      setModalOpen(true);
      return;
    }

    const savedType = localStorage.getItem("stokos_order_type") as OrderType | null;
    const savedAddress = localStorage.getItem("stokos_delivery_address");
    const savedLat = localStorage.getItem("stokos_delivery_lat");
    const savedLng = localStorage.getItem("stokos_delivery_lng");
    const savedDay = localStorage.getItem("stokos_order_day");
    const savedTime = localStorage.getItem("stokos_order_time");

    if (savedType) {
      setOrderType(savedType);
      if (savedAddress) setAddress(savedAddress);
      if (savedLat && savedLng) {
        const lat = parseFloat(savedLat);
        const lng = parseFloat(savedLng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setDeliveryCoords({ lat, lng });
        }
      }
      if (savedDay) setDay(savedDay);
      if (savedTime && savedTime !== "ASAP") {
        setTimeMode("schedule");
        setTime(savedTime);
      }
    } else {
      setOrderTypeForced(true);
      setModalOpen(true);
    }
  }, [store.slug]);

  // Fetch the store config (geo + hours + timezone) used for the constraints.
  useEffect(() => {
    let active = true;

    fetch(`/api/store/${store.slug}/config`)
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.success) return;
        setConfig({
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          deliveryRadiusKm: data.deliveryRadiusKm ?? 8,
          timezone: data.timezone || "America/New_York",
          hours: Array.isArray(data.hours) ? data.hours : [],
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [store.slug]);

  useEffect(() => {
    const openStartOrder = () => {
      setModalOpen(true);
    };

    window.addEventListener("stokos-open-start-order", openStartOrder);

    return () => {
      window.removeEventListener("stokos-open-start-order", openStartOrder);
    };
  }, []);

  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);

    if (type === "delivery" && store.deliveryOrderLaterOnly) {
      // Order-later-only delivery: no ASAP, must schedule.
      setDay("Today");
      setTimeMode("schedule");
      setTime("");
    } else {
      setDay("Today");
      setTimeMode("asap");
      setTime("ASAP");
    }
  };

  const handleDeliverySelect = (selection: DeliverySelection) => {
    setAddress(selection.address);
    setDeliveryCoords({ lat: selection.lat, lng: selection.lng });
    setDeliveryWithinRadius(selection.withinRadius);
  };

  const updateOrder = () => {
    if (!canContinue) return;

    localStorage.setItem("stokos_order_store", store.slug);
    localStorage.setItem("stokos_order_type", orderType!);
    localStorage.setItem("stokos_order_day", day || "Today");
    localStorage.setItem("stokos_order_time", effectiveTime || "ASAP");

    if (orderType === "delivery") {
      localStorage.setItem("stokos_delivery_address", address.trim());
      if (deliveryCoords) {
        localStorage.setItem("stokos_delivery_lat", String(deliveryCoords.lat));
        localStorage.setItem("stokos_delivery_lng", String(deliveryCoords.lng));
      }
    } else {
      localStorage.removeItem("stokos_delivery_address");
      localStorage.removeItem("stokos_delivery_lat");
      localStorage.removeItem("stokos_delivery_lng");
    }

    window.dispatchEvent(new Event("stokos-order-updated"));
    setOrderTypeForced(false);
    setModalOpen(false);
  };

  // Delivery address is valid when we have a within-radius point (geo stores)
  // or any non-empty address (legacy stores without a configured pin).
  const deliveryAddressValid = hasGeo
    ? Boolean(deliveryCoords) && deliveryWithinRadius
    : address.trim().length > 0;

  const canContinue =
    Boolean(orderType) &&
    timeValid &&
    (orderType === "pickup" || deliveryAddressValid);

  const modalButtonClass = (type: OrderType) =>
    `flex min-h-[42px] items-center justify-between rounded border px-3 py-2 text-left font-black transition ${
      orderType === type
        ? "border-green-700 bg-green-50 ring-2 ring-green-700"
        : "border-zinc-300 bg-white hover:border-green-500"
    }`;

  const timeModeButtonClass = (mode: "asap" | "schedule") =>
    `flex-1 rounded-full px-3 py-2 text-xs font-black uppercase transition ${
      timeMode === mode
        ? "bg-green-700 text-white"
        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
    }`;

  const continueLabel = () => {
    if (!orderType) return "Select Pickup or Delivery";
    if (orderType === "delivery" && hasGeo && !deliveryCoords)
      return "Select Your Delivery Location";
    if (orderType === "delivery" && hasGeo && !deliveryWithinRadius)
      return "Address Outside Delivery Area";
    if (orderType === "delivery" && !hasGeo && !address.trim())
      return "Enter Your Delivery Address to Continue";
    if (!timeValid)
      return scheduleAvailable
        ? "Select a Time to Continue"
        : "Closed — No Times Available";
    return orderTypeForced
      ? `Start Your ${orderType === "pickup" ? "Pickup" : "Delivery"} Order`
      : `Update Your ${orderType === "pickup" ? "Pickup" : "Delivery"} Order`;
  };

  return (
    <>
      {modalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[92vh] w-full max-w-[450px] overflow-y-auto rounded-md bg-white shadow-2xl">
            <div className="relative px-6 pt-6 text-center">
              {!orderTypeForced && (
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="absolute right-4 top-4 text-zinc-700 hover:text-black"
                >
                  <X size={24} />
                </button>
              )}

              <h3 className="text-xl font-black uppercase text-[#9E1111]">
                Stoko&apos;s
              </h3>

              <div className="mt-5">
                <h4 className="text-xl font-black text-black">Stoko&apos;s</h4>
                <p className="mt-1 text-base text-zinc-700">{store.displayName}</p>
                {orderTypeForced && (
                  <p className="mt-2 text-sm text-zinc-500">
                    Choose how you&apos;d like to receive your order to get
                    started.
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-zinc-200" />
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOrderTypeChange("pickup")}
                  className={modalButtonClass("pickup")}
                >
                  <span className="text-green-700">Pickup</span>

                  <span
                    className={`rounded-full border px-2 py-1 text-xs ${
                      orderType === "pickup"
                        ? "border-green-700 bg-green-700 text-white "
                        : "border-green-700 text-green-700"
                    }`}
                  >
                    {store.pickupTime}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOrderTypeChange("delivery")}
                  className={modalButtonClass("delivery")}
                >
                  <span className="text-green-700">Delivery</span>

                  {store.deliveryOrderLaterOnly ? (
                    <span
                      className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                        orderType === "delivery"
                          ? "border-green-700 bg-green-700 text-white"
                          : "border-green-700 text-green-700"
                      }`}
                    >
                      <Clock size={12} />
                    </span>
                  ) : (
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${
                        orderType === "delivery"
                          ? "border-green-700 bg-green-700 text-white"
                          : "border-green-700 text-green-700"
                      }`}
                    >
                      {store.deliveryTime}
                    </span>
                  )}
                </button>
              </div>

              {orderType === "delivery" && store.deliveryOrderLaterOnly && (
                <p className="mt-1 text-center text-xs text-zinc-500">
                  Order Later Only <Clock size={12} className="inline-block" />
                </p>
              )}

              {orderType === "delivery" &&
                (hasGeo ? (
                  <div className="mt-6">
                    <DeliveryMapPicker
                      branchLat={config.latitude as number}
                      branchLng={config.longitude as number}
                      radiusKm={config.deliveryRadiusKm}
                      initial={
                        deliveryCoords
                          ? { ...deliveryCoords, address }
                          : null
                      }
                      onSelect={handleDeliverySelect}
                    />
                  </div>
                ) : (
                  <div className="mt-6">
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter street address..."
                      className="h-11 w-full rounded border border-zinc-300 px-3 text-sm outline-none"
                    />
                  </div>
                ))}

              {/* Day + time */}
              {orderType && (
                <div className="mt-6 space-y-3">
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="h-10 w-full rounded border border-zinc-300 px-3 text-sm font-semibold text-black outline-none dark:text-black"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                  </select>

                  {asapAllowed && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTimeMode("asap");
                          setTime("ASAP");
                        }}
                        className={timeModeButtonClass("asap")}
                      >
                        ASAP
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeMode("schedule")}
                        className={timeModeButtonClass("schedule")}
                      >
                        Pick a Time
                      </button>
                    </div>
                  )}

                  {timeMode === "schedule" &&
                    (scheduleAvailable ? (
                      <TimeWheelPicker
                        slots={slots}
                        value={effectiveTime}
                        onChange={setTime}
                      />
                    ) : (
                      <p className="rounded-lg bg-zinc-100 p-3 text-center text-xs font-semibold text-zinc-500">
                        No times available {day.toLowerCase()}. Try another day.
                      </p>
                    ))}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!canContinue}
              onClick={updateOrder}
              className={`flex w-full items-center justify-between px-6 py-4 text-left text-base font-black text-white ${
                canContinue
                  ? "bg-green-700 hover:bg-green-800"
                  : "cursor-not-allowed bg-zinc-400"
              }`}
            >
              <span>{continueLabel()}</span>

              <ChevronRight size={26} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
