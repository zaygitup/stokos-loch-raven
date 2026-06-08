"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  PackageCheck,
  PlusCircle,
  Settings,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

type AdminOrderItem = {
  name?: string;
  title?: string;
  quantity?: number;
  amount?: number;
  price?: number;
  currency?: string;
};

type AdminOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  store?: string;
  orderType?: "pickup" | "delivery" | string;
  customerName?: string;
  customerEmail?: string;
  paymentStatus?: string;
  amountTotal?: number;
  currency?: string;
  items?: AdminOrderItem[];
};

const STORAGE_KEY = "stokos_admin_orders";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  const loadOrders = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed: AdminOrder[] = saved ? JSON.parse(saved) : [];

      const sorted = parsed.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setOrders(sorted);
    } catch (error) {
      console.error("Failed to load dashboard orders:", error);
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();

    let channel: BroadcastChannel | null = null;

    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("stokos-orders");

      channel.onmessage = (event) => {
        if (event.data?.type === "ORDER_CREATED") {
          loadOrders();
        }
      };
    }

    const handleStorage = () => loadOrders();
    const handleCustomUpdate = () => loadOrders();
    const handleFocus = () => loadOrders();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadOrders();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("stokos-admin-orders-updated", handleCustomUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      channel?.close();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("stokos-admin-orders-updated", handleCustomUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const todayOrders = useMemo(() => {
    return orders.filter((order) => isToday(order.createdAt));
  }, [orders]);

  const todayRevenue = todayOrders.reduce((total, order) => {
    return total + Number(order.amountTotal || 0);
  }, 0);

  const averageOrderValue =
    todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

  const paidOrders = todayOrders.filter((order) => {
    return order.paymentStatus?.toLowerCase() === "paid";
  }).length;

  const pickupOrders = todayOrders.filter((order) => {
    return order.orderType?.toLowerCase() === "pickup";
  }).length;

  const deliveryOrders = todayOrders.filter((order) => {
    return order.orderType?.toLowerCase() === "delivery";
  }).length;

  const latestOrders = orders.slice(0, 4);

  const topItems = useMemo(() => {
    const map = new Map<string, number>();

    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const name = item.title || item.name || "Menu Item";
        const quantity = Number(item.quantity || 1);

        map.set(name, (map.get(name) || 0) + quantity);
      });
    });

    return Array.from(map.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const pendingPayments = todayOrders.filter((order) => {
    return order.paymentStatus?.toLowerCase() !== "paid";
  }).length;

  return (
    <div className="w-full space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-green-900/10 bg-[#146C38] text-white ">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 right-24 h-28 w-28 rounded-full bg-white/5 blur-xl" />

          <p className="mb-4 w-fit rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/75">
            Business Overview
          </p>

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">
                Today&apos;s Store Overview
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 md:text-base">
                Quick snapshot of orders, revenue, store activity, and admin controls.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/orders"
                className="flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-green-800 transition hover:bg-green-50"
              >
                View Orders
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/admin/menu"
                className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20 transition hover:bg-white/15"
              >
                Manage Menu
                <ShoppingBag size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <DashboardCard
          title="Today Orders"
          value={todayOrders.length.toString()}
          note="Orders received today"
          icon={<ClipboardList size={22} />}
        />

        <DashboardCard
          title="Today Revenue"
          value={formatMoney("USD", todayRevenue)}
          note="Paid checkout revenue"
          icon={<DollarSign size={22} />}
        />

        <DashboardCard
          title="Average Order Value"
          value={formatMoney("USD", averageOrderValue)}
          note="Average spend per order"
          icon={<TrendingUp size={22} />}
        />

        <DashboardCard
          title="Paid Orders"
          value={paidOrders.toString()}
          note="Successfully paid orders"
          icon={<CreditCard size={22} />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black">Latest Orders</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Preview of recent customer orders.
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="shrink-0 rounded-full bg-green-800 px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-green-900"
            >
              View All
            </Link>
          </div>

          {latestOrders.length === 0 ? (
            <EmptyState
              icon={<PackageCheck size={42} />}
              title="No orders yet"
              description="New orders will appear here automatically."
            />
          ) : (
            <div className="space-y-3">
              {latestOrders.map((order) => (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className="block rounded-3xl border border-green-200 bg-green-50 p-5 transition hover:border-green-500 hover:bg-green-100/60"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-black">
                        {order.orderNumber || "Order"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-600">
                        {order.customerName || "Customer"} ·{" "}
                        {capitalize(order.orderType)} ·{" "}
                        {formatMoney(order.currency, order.amountTotal)}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-black uppercase ${
                        order.paymentStatus?.toLowerCase() === "paid"
                          ? "bg-green-800 text-white"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.paymentStatus?.toLowerCase() === "paid"
                        ? "Paid"
                        : "Pending"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black">Quick Actions</h3>
          <p className="mt-1 text-sm text-zinc-500">Common admin controls.</p>

          <div className="mt-5 space-y-3">
            <QuickAction
              title="View Orders"
              description="Manage live order queue"
              href="/admin/orders"
              icon={<PackageCheck size={20} />}
            />

            <QuickAction
              title="Manage Menu"
              description="Products and modifiers"
              href="/admin/menu"
              icon={<ShoppingBag size={20} />}
            />

            <QuickAction
              title="Add Product"
              description="Create new menu item"
              href="/admin/menu"
              icon={<PlusCircle size={20} />}
            />

            <QuickAction
              title="Store Settings"
              description="Hours, delivery, taxes"
              href="/admin/settings"
              icon={<Settings size={20} />}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black">Store Activity</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Today&apos;s pickup and delivery split.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <ActivityRow
              icon={<Store size={20} />}
              title="Pickup Orders"
              value={pickupOrders.toString()}
            />

            <ActivityRow
              icon={<Truck size={20} />}
              title="Delivery Orders"
              value={deliveryOrders.toString()}
            />

            <ActivityRow
              icon={<CheckCircle2 size={20} />}
              title="Store Status"
              value="Online"
              success
            />

            <ActivityRow
              icon={<Clock size={20} />}
              title="Order Sync"
              value="Live"
              success
            />
          </div>
        </div>

        <div className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black">Top Selling Items</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Best performing menu items from orders.
          </p>

          <div className="mt-5 space-y-3">
            {topItems.length === 0 ? (
              <EmptySmall
                title="No item data yet"
                description="Top items will show after orders include menu items."
              />
            ) : (
              topItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-sm font-black text-green-800">
                      {index + 1}
                    </div>

                    <p className="text-sm font-black">{item.name}</p>
                  </div>

                  <p className="text-sm font-black text-green-800">
                    {item.quantity} sold
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-black">Admin Alerts</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Important system notes.
          </p>

          <div className="mt-5 space-y-3">
            {pendingPayments > 0 ? (
              <AlertItem
                type="warning"
                title={`${pendingPayments} pending payment`}
                description="Review payment status in orders."
              />
            ) : (
              <AlertItem
                type="success"
                title="Payments look good"
                description="No pending payments for today."
              />
            )}

            <AlertItem
              type="success"
              title="Store is online"
              description="Customer ordering page is active."
            />

            <AlertItem
              type="info"
              title="Menu management ready"
              description="Products, categories, and modifiers can be managed next."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: string;
  note: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black">{value}</p>

      <p className="mt-1 text-sm text-zinc-500">{note}</p>
    </div>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-3xl border border-zinc-200 p-4 transition hover:border-green-400 hover:bg-green-50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-800">
          {icon}
        </div>

        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        </div>
      </div>

      <ArrowRight size={18} className="text-zinc-400" />
    </Link>
  );
}

function ActivityRow({
  title,
  value,
  icon,
  success,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  success?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            success ? "bg-green-50 text-green-800" : "bg-zinc-100 text-zinc-700"
          }`}
        >
          {icon}
        </div>

        <p className="text-sm font-black text-zinc-700">{title}</p>
      </div>

      <p
        className={`text-sm font-black ${
          success ? "text-green-800" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AlertItem({
  type,
  title,
  description,
}: {
  type: "success" | "warning" | "info";
  title: string;
  description: string;
}) {
  const styles = {
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
    info: "border-zinc-200 bg-zinc-50 text-zinc-800",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[type]}`}>
      <div className="flex items-start gap-3">
        {type === "warning" ? (
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        )}

        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-xs opacity-80">{description}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 text-center">
      <div className="mb-3 text-zinc-300">{icon}</div>

      <p className="font-black text-zinc-500">{title}</p>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </div>
  );
}

function EmptySmall({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-center">
      <p className="font-black text-zinc-500">{title}</p>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </div>
  );
}

function isToday(value?: string) {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatMoney(currency: string | undefined, amount: number | undefined) {
  const code = currency?.toUpperCase() || "USD";
  const value = Number(amount || 0).toFixed(2);

  if (code === "USD") return `$${value}`;

  return `${code} ${value}`;
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
}

function capitalize(value?: string) {
  if (!value) return "Order";

  return value.charAt(0).toUpperCase() + value.slice(1);
}