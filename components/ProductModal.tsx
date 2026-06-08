"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { X, Plus, Minus } from "lucide-react";
import { useCartStore, CartItem } from "@/app/store/[slug]/usecartstore";

interface ProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

type PizzaSide = "left" | "right" | "whole";

export default function ProductModal({
  product,
  isOpen,
  onClose,
}: ProductModalProps) {
  const addItem = useCartStore((state) => state.addItem);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState({
    label: "Regular",
    price: 0,
  });
  const [toppingSides, setToppingSides] = useState<Record<string, PizzaSide>>(
    {}
  );
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const toppings = [
    { name: "Extra Cheese", price: 1.5 },
    { name: "Pepperoni", price: 1.5 },
    { name: "Chicken", price: 1.5 },
    { name: "Ham", price: 1.5 },
    { name: "Meatballs", price: 1.5 },
    { name: "Salami", price: 1.5 },
    { name: "Sausage", price: 1.5 },
    { name: "Bacon", price: 1.5 },
    { name: "Ground Beef", price: 1.5 },
    { name: "Beef Pepperoni", price: 3.0 },
    { name: "Broccoli", price: 1.5 },
    { name: "Pineapple", price: 1.5 },
    { name: "Banana Peppers", price: 1.5 },
    { name: "Onions", price: 1.5 },
    { name: "Spinach", price: 1.5 },
    { name: "Black Olives", price: 1.5 },
    { name: "Mushrooms", price: 1.5 },
    { name: "Jalapeno Peppers", price: 1.5 },
    { name: "Green Peppers", price: 1.5 },
  ];

  const sauces = [
    { name: "Blue Cheese Dipping Sauce", price: 0.5 },
    { name: "French Dipping Sauce", price: 0.5 },
    { name: "Creamy Italian Dipping Sauce", price: 0.5 },
    { name: "Lite Italian Dipping Sauce", price: 0.5 },
    { name: "1000 Island Dipping Sauce", price: 0.5 },
    { name: "Fat Free Honey Dijon Dipping Sauce", price: 0.5 },
    { name: "Ranch Dipping Sauce", price: 0.5 },
  ];

  const sizes = product?.sizes?.length
    ? product.sizes
    : [{ label: "Regular", price: Number(product?.price || 0) }];

  useEffect(() => {
    if (!isOpen || !product) return;

    setQuantity(1);
    setNote("");
    setSelectedSauces([]);
    setToppingSides({});
    setSelectedSize(sizes[0]);
  }, [isOpen, product]);

  const unitPrice = useMemo(() => {
    const toppingsTotal = Object.keys(toppingSides).reduce((acc, name) => {
      const item = toppings.find((t) => t.name === name);
      return acc + (item?.price || 0);
    }, 0);

    const saucesTotal = selectedSauces.reduce((acc, name) => {
      const item = sauces.find((s) => s.name === name);
      return acc + (item?.price || 0);
    }, 0);

    return selectedSize.price + toppingsTotal + saucesTotal;
  }, [selectedSize, toppingSides, selectedSauces]);

  const totalPrice = (unitPrice * quantity).toFixed(2);

  const handleAddToCart = () => {
    const itemToAdd: CartItem = {
      cartId: `${product.id}-${selectedSize.label}-${Object.keys(toppingSides)
        .sort()
        .join(",")}-${[...selectedSauces].sort().join(",")}-${Date.now()}`,
  id: product.id,
  category: product.category,
  title: product.title,
  image: product.image,
  price: unitPrice,
  quantity,
  size: selectedSize,
  toppings: toppingSides,
  sauces: selectedSauces,
  note,
    };

    addItem(itemToAdd);
    onClose();
  };

  if (!isOpen || !product) return null;

  const HalfIcon = ({
    side,
    active,
  }: {
    side: PizzaSide;
    active: boolean;
  }) => (
    <div
      className={`w-4 h-4 rounded-full border-2 border-current flex overflow-hidden ${
        active ? "text-white" : "text-zinc-800 dark:text-zinc-300"
      }`}
    >
      {side === "left" && <div className="w-1/2 h-full bg-current" />}
      {side === "right" && <div className="ml-auto w-1/2 h-full bg-current" />}
      {side === "whole" && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-current" />
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#121212] w-full max-w-lg h-full md:h-auto md:rounded-3xl overflow-hidden md:max-h-[92vh] flex flex-col shadow-2xl relative text-black dark:text-white">
        <div className="flex items-center justify-between p-5 border-b dark:border-zinc-800 bg-white dark:bg-[#121212] sticky top-0 z-10">
          <h2 className="text-xl font-black uppercase tracking-tight">
            {product.title}
          </h2>

          <button
            onClick={onClose}
            className="p-2 bg-black text-white rounded-full hover:scale-110 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow p-0 no-scrollbar">
          <div className="relative w-full aspect-[16/10]">
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="p-6 space-y-10">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              {product.description}
            </p>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black uppercase text-sm tracking-widest">
                  Choose an Option
                </h3>
                <span className="text-[10px] text-zinc-500 uppercase">
                  Required
                </span>
              </div>

              <div className="space-y-2">
                {sizes.map((size: any) => (
                  <label
                    key={size.label}
                    className="flex items-center justify-between p-4 border dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="size"
                        checked={selectedSize.label === size.label}
                        onChange={() => setSelectedSize(size)}
                        className="w-5 h-5 accent-black"
                      />
                      <span className="font-bold text-sm">{size.label}</span>
                    </div>

                    <span className="font-bold text-sm">
                      ${Number(size.price).toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-black uppercase text-sm tracking-widest mb-4">
                Add Toppings
              </h3>

              <div>
                {toppings.map((item) => {
                  const isSelected = toppingSides[item.name] !== undefined;

                  return (
                    <div
                      key={item.name}
                      className="flex flex-col gap-3 py-4 border-b dark:border-zinc-800"
                    >
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setToppingSides({
                                  ...toppingSides,
                                  [item.name]: "whole",
                                });
                              } else {
                                const updated = { ...toppingSides };
                                delete updated[item.name];
                                setToppingSides(updated);
                              }
                            }}
                            className="w-5 h-5 accent-black rounded"
                          />

                          <span className="text-sm font-semibold">
                            {item.name}
                          </span>
                        </div>

                        <span className="text-sm font-bold text-zinc-500">
                          +${item.price.toFixed(2)}
                        </span>
                      </label>

                      {isSelected && (
                        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full w-fit mx-auto">
                          {(["left", "right", "whole"] as const).map(
                            (side) => (
                              <button
                                key={side}
                                type="button"
                                onClick={() =>
                                  setToppingSides({
                                    ...toppingSides,
                                    [item.name]: side,
                                  })
                                }
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold transition-all ${
                                  toppingSides[item.name] === side
                                    ? "bg-[#222] text-white shadow-md"
                                    : "text-zinc-600 dark:text-zinc-300"
                                }`}
                              >
                                <HalfIcon
                                  side={side}
                                  active={toppingSides[item.name] === side}
                                />
                                {side === "whole"
                                  ? "Whole"
                                  : `${
                                      side.charAt(0).toUpperCase() +
                                      side.slice(1)
                                    } Half`}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="font-black uppercase text-sm tracking-widest mb-4">
                Add Dipping Sauce
              </h3>

              <div>
                {sauces.map((item) => (
                  <label
                    key={item.name}
                    className="flex items-center justify-between py-4 border-b dark:border-zinc-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedSauces.includes(item.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSauces([...selectedSauces, item.name]);
                          } else {
                            setSelectedSauces(
                              selectedSauces.filter((s) => s !== item.name)
                            );
                          }
                        }}
                        className="w-5 h-5 accent-black rounded"
                      />

                      <span className="text-sm font-semibold">
                        {item.name}
                      </span>
                    </div>

                    <span className="text-sm font-bold text-zinc-500">
                      +${item.price.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="pb-6">
              <h3 className="font-black uppercase text-sm tracking-widest mb-4">
                Special Instructions
              </h3>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-20 p-3 border dark:border-zinc-800 rounded-lg bg-transparent outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all resize-none text-sm"
              />

              <p className="text-[11px] text-zinc-500 leading-tight mt-2">
                *Requests may result in upcharges
              </p>
            </section>
          </div>
        </div>

        <div className="p-5 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center bg-white dark:bg-black rounded-full p-1 border dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Minus size={18} />
              </button>

              <span className="w-10 text-center font-black text-lg">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Plus size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-grow bg-[#1a1a1a] dark:bg-white dark:text-black text-white h-12 rounded-xl flex items-center justify-between px-6 hover:scale-[1.01] transition-all active:scale-95 shadow-lg"
            >
              <span className="font-black uppercase tracking-tighter text-xs">
                Add to Order
              </span>
              <span className="font-black text-lg">${totalPrice}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}