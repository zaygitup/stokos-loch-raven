import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  Navigation,
  ShoppingBag,
} from "lucide-react";

export type StoreContactData = {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  pickupTime: string;
  deliveryTime: string;
  google: string;
};

type StoreContactUsProps = {
  store: StoreContactData;
};

export default function StoreContactUs({ store }: StoreContactUsProps) {
  const mapQuery = encodeURIComponent(store.address);
  const phoneHref = store.phone.replace(/[^\d+]/g, "");

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-black dark:bg-[#0b0b0b] dark:text-white">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <Link
          href={`/store/${store.slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#16A34A] transition hover:text-[#0f7a35]"
        >
          <ArrowLeft size={18} />
          Back to Menu
        </Link>

        <div className="mb-8 overflow-hidden rounded-[30px] bg-white shadow-sm dark:bg-[#151515]">
          <div className="relative p-6 md:p-10">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-[#16A34A]/10" />

            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.25em] text-[#16A34A]">
              Contact Store
            </p>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
              Contact {store.name}
            </h1>

            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-neutral-600 dark:text-neutral-300 md:text-lg">
              Need help with your order, pickup, delivery, or store information?
              Contact this location directly.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <ContactCard
            icon={<MapPin size={22} />}
            title="Address"
            text={store.address}
          />

          <ContactCard
            icon={<Phone size={22} />}
            title="Phone"
            text={store.phone}
            href={`tel:${phoneHref}`}
          />

          <ContactCard
            icon={<Mail size={22} />}
            title="Email"
            text={store.email}
            href={`mailto:${store.email}`}
          />

          <ContactCard
            icon={<Clock size={22} />}
            title="Hours"
            text={store.hours}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[30px] bg-white p-6 shadow-sm dark:bg-[#151515] md:p-8">
            <h2 className="text-2xl font-black md:text-3xl">
              Store Information
            </h2>

            <div className="mt-6 space-y-4">
              <InfoRow label="Pickup Time" value={store.pickupTime} />
              <InfoRow label="Delivery Time" value={store.deliveryTime} />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/store/${store.slug}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#16A34A] px-6 py-4 text-sm font-black text-white transition hover:bg-[#0f7a35]"
              >
                <ShoppingBag size={18} />
                Order Online
              </Link>

              <a
                href={store.google}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-4 text-sm font-black text-black transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-[#151515] dark:text-white dark:hover:bg-[#202020]"
              >
                <Navigation size={18} />
                Directions
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] bg-white shadow-sm dark:bg-[#151515]">
            <iframe
              title={`${store.name} Map`}
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              className="h-[360px] w-full border-0 lg:h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactCard({
  icon,
  title,
  text,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href?: string;
}) {
  return (
    <div className="rounded-[24px] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:bg-[#151515]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-[#16A34A]">
        {icon}
      </div>

      <h3 className="text-lg font-black">{title}</h3>

      {href ? (
        <a
          href={href}
         className="mt-2 block whitespace-pre-line text-sm font-bold leading-6 text-neutral-600 transition hover:text-[#16A34A] dark:text-neutral-300"
        >
          {text}
        </a>
      ) : (
       <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-neutral-600 dark:text-neutral-300">
  {text}
</p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4 dark:bg-[#202020]">
      <span className="font-bold text-neutral-700 dark:text-neutral-300">
        {label}
      </span>

      <span className="font-black text-[#16A34A]">{value}</span>
    </div>
  );
}