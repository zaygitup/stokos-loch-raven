"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { useCartStore, CartItem } from "@/app/store/[slug]/usecartstore";

type DealOption = {
  label: string;
  price?: number;
};

type DealGroup = {
  id: string;
  title: string;
  required?: boolean;
  options: DealOption[];
};

type DealProductModalProps = {
  product: any;
  isOpen: boolean;
  onClose: () => void;
};

const halfSubOptions: DealOption[] = [
  { label: "1/2 Fried Fish with Cheese Hot Sub" },
  { label: "1/2 Chicken Cheesesteak Hot Sub" },
  { label: "1/2 Roast Beef Hot Sub" },
  { label: "1/2 Pizza Steak Hot Sub" },
  { label: "1/2 Italian Spicy Sausage Sub" },
  { label: "1/2 Philly Steak Sub" },
  { label: "1/2 Philly Chicken Sub" },
  { label: "1/2 Italian Steak Sub" },
  { label: "1/2 Italian Chicken Sub" },
  { label: "1/2 Bacon-Swiss Steak Sub" },
  { label: "1/2 Bacon-Swiss Chicken Sub" },
  { label: "1/2 Buffalo Chicken Sub" },
  { label: "1/2 Chicken Alfredo Sub" },
  { label: "1/2 Honey Mustard Chicken Sub" },
  { label: "1/2 Chicken Bacon Ranch Sub" },
  { label: "1/2 Chicken Caesar Hot Sub" },
  { label: "1/2 Italian Cold Cut Sub" },
  { label: "1/2 Ham and Cheese Cold Sub" },
  { label: "1/2 American Cold Cut Sub" },
  { label: "1/2 Turkey Breast Cold Sub" },
  { label: "1/2 Chicken Salad Sub" },
  { label: "1/2 Tuna Salad Sub" },
  { label: "1/2 Shrimp Salad Sub", price: 2 },
  { label: "1/2 Fried Shrimp Sub", price: 2 },
  { label: "1/2 Whiting Sub", price: 2 },
  { label: "1/2 Tilapia Sub", price: 2 },
];

const pizzaToppings: DealOption[] = [
  { label: "Mushrooms" },
  { label: "Pepperoni" },
  { label: "Chicken" },
  { label: "Ham" },
  { label: "Meatball" },
  { label: "Salami" },
  { label: "Sausage" },
  { label: "Bacon" },
  { label: "Ground Beef" },
  { label: "Beef Pepperoni" },
  { label: "Broccoli" },
  { label: "Pineapple" },
  { label: "Banana Peppers" },
  { label: "Onions" },
  { label: "Spinach" },
  { label: "Extra Cheese" },
  { label: "Black Olives" },
  { label: "Jalapeno Peppers" },
  { label: "Green Peppers" },
];

const wingSauces: DealOption[] = [
  { label: "Hot Sauce" },
  { label: "Mild Sauce" },
  { label: "Tangy Golden Honey BBQ Sauce" },
  { label: "Honey Mustard Sauce" },
  { label: "Maryland Style Sauce" },
  { label: "Lemon Pepper Sauce" },
  { label: "Nuclear Sauce (Extra Hot)" },
  { label: "Teriyaki Sauce" },
  { label: "Roasted Garlic Parmigiana Sauce" },
  { label: "Honey Lemon Pepper Sauce" },
  { label: "Hot Old Bay Sauce" },
  { label: "Hot Lemon Pepper Sauce" },
  { label: "Jamaican Jerk Sauce" },
];

const DEAL_GROUPS: Record<string, DealGroup[]> = {
  "half-sub-fries-soda-special": [
    {
      id: "halfSub",
      title: "Choose Your 1/2 Sub",
      required: true,
      options: halfSubOptions,
    },
  ],

  "xl-pizza-one-topping-20-wings": [
    {
      id: "wingSauce",
      title: "Choose a Wing Sauce",
      required: true,
      options: wingSauces,
    },
  ],

  "two-large-one-topping-pizzas": [
    {
      id: "firstPizzaTopping",
      title: "Choose a Topping for First Pizza",
      required: true,
      options: pizzaToppings.map((item) => ({
        label: `${item.label} (First Pizza)`,
      })),
    },
    {
      id: "secondPizzaTopping",
      title: "Choose a Topping for Second Pizza",
      required: true,
      options: pizzaToppings.map((item) => ({
        label: `${item.label} (Second Pizza)`,
      })),
    },
  ],
};

const parsePrice = (value: any) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return Number(value.replace(/[^0-9.]/g, "")) || 0;
  }
  return 0;
};

export default function DealProductModal({
  product,
  isOpen,
  onClose,
}: DealProductModalProps) {
  const addItem = useCartStore((state) => state.addItem);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    {}
  );
  const [note, setNote] = useState("");

  const dealKey = product?.deal || product?.id;
  const dealGroups = DEAL_GROUPS[dealKey] || [];

  const basePrice = parsePrice(product?.price);

  useEffect(() => {
    if (!isOpen) return;

    setQuantity(1);
    setSelectedOptions({});
    setNote("");
  }, [isOpen, product]);

  const optionsTotal = useMemo(() => {
    return dealGroups.reduce((total, group) => {
      const selectedLabel = selectedOptions[group.id];

      const selectedOption = group.options.find(
        (option) => option.label === selectedLabel
      );

      return total + (selectedOption?.price || 0);
    }, 0);
  }, [dealGroups, selectedOptions]);

  const unitPrice = basePrice + optionsTotal;
  const totalPrice = unitPrice * quantity;

  const canAddToCart = dealGroups.every((group) => {
    if (!group.required) return true;
    return Boolean(selectedOptions[group.id]);
  });

  const handleAddToCart = () => {
    if (!product || !canAddToCart) return;

    const dealChoiceLines = dealGroups
      .map((group) => {
        const selectedLabel = selectedOptions[group.id];
        if (!selectedLabel) return null;

        const selectedOption = group.options.find(
          (option) => option.label === selectedLabel
        );

        const extraPrice = selectedOption?.price
          ? ` (+$${selectedOption.price.toFixed(2)})`
          : "";

        return `- ${group.title}: ${selectedLabel}${extraPrice}`;
      })
      .filter(Boolean)
      .join("\n");

    const finalNote = [
      dealChoiceLines ? `Deal Choices:\n${dealChoiceLines}` : "",
      note.trim() ? `Special Instructions:\n${note.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const itemToAdd: CartItem = {
      cartId: `${product.id || product.deal}-${Object.values(selectedOptions)
        .join("-")
        .replace(/\s+/g, "-")}-${Date.now()}`,
      id: product.id || product.deal,
      category: product.category || "deals",
      title: product.title,
      image: product.image,
      price: unitPrice,
      quantity,
      size: {
        label: "Deal",
        price: unitPrice,
      },
      toppings: {},
      sauces: [],
      note: finalNote,
    };

    addItem(itemToAdd);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm md:p-4">
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-hidden bg-white text-black shadow-2xl dark:bg-[#121212] dark:text-white md:h-auto md:max-h-[92vh] md:rounded-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5 dark:border-zinc-800 dark:bg-[#121212]">
          <h2 className="text-lg font-black uppercase leading-tight tracking-tight md:text-xl">
            {product.title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black p-2 text-white transition-transform hover:scale-110 dark:bg-white dark:text-black"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="no-scrollbar flex-grow overflow-y-auto">
          {/* Image */}
          <div className="relative aspect-[16/10] w-full bg-zinc-100 dark:bg-zinc-950">
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-8 p-6">
            <div>
              <p className="text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
                {product.description}
              </p>

              <p className="mt-4 text-[26px] font-black leading-none tracking-[-0.04em] text-[#DA3327]">
                ${basePrice.toFixed(2)}
              </p>
            </div>

            {/* Deal Options */}
            {dealGroups.map((group) => (
              <section
                key={group.id}
                className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black uppercase tracking-wide text-black dark:text-white">
                    {group.title}
                  </h3>

                  {group.required && (
                    <span className="rounded-full bg-[#DA3327] px-3 py-1 text-[10px] font-black uppercase text-white">
                      Choose 1
                    </span>
                  )}
                </div>

                <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
                  {group.options.map((option) => {
                    const isSelected =
                      selectedOptions[group.id] === option.label;

                    return (
                      <label
                        key={option.label}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition ${
                          isSelected
                            ? "bg-white shadow-sm ring-1 ring-[#DA3327]/30 dark:bg-zinc-900"
                            : "hover:bg-white dark:hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={group.id}
                            checked={isSelected}
                            onChange={() =>
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [group.id]: option.label,
                              }))
                            }
                            className="h-4 w-4 accent-[#DA3327]"
                          />

                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {option.label}
                          </span>
                        </div>

                        {option.price ? (
                          <span className="shrink-0 text-xs font-black text-zinc-600 dark:text-zinc-300">
                            +${option.price.toFixed(2)}
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Special Instructions */}
            <section className="pb-6">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest">
                Special Instructions
              </h3>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. allergies, spice level, requests"
                className="h-20 w-full resize-none rounded-lg border bg-transparent p-3 text-sm outline-none transition-all focus:ring-1 focus:ring-black dark:border-zinc-800 dark:focus:ring-white"
              />

              <p className="mt-2 text-[11px] leading-tight text-zinc-500">
                *Requests may result in upcharges
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center rounded-full border bg-white p-1 dark:border-zinc-800 dark:bg-black">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Minus size={18} />
              </button>

              <span className="w-10 text-center text-lg font-black">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Plus size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`flex h-12 flex-grow items-center justify-between rounded-xl px-6 text-xs font-black uppercase tracking-tight text-white transition active:scale-95 ${
                canAddToCart
                  ? "bg-[#1b1b1b] hover:bg-black"
                  : "cursor-not-allowed bg-zinc-400"
              }`}
            >
              <span>Add to Order</span>
              <span>${totalPrice.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}