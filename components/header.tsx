"use client";

import Image from "next/image";
import { Search, Flame, ShoppingBag } from "lucide-react";

export default function Header() {
  return (
    <header className="top-0 sticky z-40 w-full   px-4 py-3 md:py-4 bg-green-800  dark:bg-black dark:border-b dark:border-zinc-800 transition-colors">
      <div className="flex items-center justify-between md:w-[1600px] md:px-2 px-2 mx-auto">
        
        {/* LEFT: Logo only */}
        <div className="flex items-center">
          <div className="relative w-32 md:w-36 lg:w-40 transition-all duration-300">
            <Image 
              src="/images/Stokos-logo.png" 
              alt="Stokos Logo" 
              width={400} 
              height={400} 
              priority
              className="object-contain h-auto"
            />
          </div>
        </div>

        {/* MIDDLE: Empty (The 'justify-between' on the parent pushes items to the sides) */}

        {/* RIGHT SECTION: Search + Hot Deals + Cart */}
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
          
          {/* SEARCH INPUT (Now on the right) */}
          <div className="hidden sm:flex relative w-48 md:w-64 lg:w-80">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full py-2 pl-10 pr-4 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-transparent 
                         dark:border-zinc-800 text-black dark:text-white placeholder-gray-500 text-xs lg:text-sm
                         focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-zinc-700 transition-all"
            />
          </div>

          {/* HOT DEALS BUTTON */}
          <button className="relative flex items-center justify-center p-2 lg:px-4 lg:py-2 rounded-full bg-red-600/10 border border-red-600/20 text-red-600 hover:bg-red-600/20 transition-all">
            <Flame size={18} fill="currentColor" />
            <span className="absolute -top-1 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <span className="hidden md:inline ml-2 text-[10px] lg:text-xs font-bold uppercase tracking-tight">Hot Deals</span>
          </button>

          {/* CART ICON */}
          <button className="relative p-2.5 md:p-3 rounded-full bg-[#DA3327] text-white hover:bg-[#DA3327] transition-all shadow-md active:scale-95">
            <ShoppingBag size={18} />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white dark:border-black">
              2
            </span>
          </button>
        </div>

      </div>
    </header>
  );
}