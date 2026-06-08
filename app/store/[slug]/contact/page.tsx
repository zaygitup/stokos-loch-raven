import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import StoreContactUs, {
  StoreContactData,
} from "@/components/storecontactus";
import { STORES } from "@/lib/data/stores";

const stores: Record<string, StoreContactData> = {
  towson: {
    name: "Stoko’s Towson",
    slug: "towson",
    address: "6821 Loch Raven Blvd, Loch Raven, MD 21286",
    phone: "410-296-6066",
    email: "support@stokos.com",
    hours: "Daily: 11am - 11:30pm",
    pickupTime: "30 min",
    deliveryTime: "55 min",
    google: "https://share.google/mFcJdRzLeeEuM8D2o",
  },

  york: {
    name: "Stoko’s York",
    slug: "york",
    address: "5503 York Rd, Baltimore, MD",
    phone: "410-433-4161",
    email: "support@stokos.com",
    hours: "Daily: 11am - 12am",
    pickupTime: "10 min",
    deliveryTime: "35 min",
    google: "https://share.google/auEBQDz2qngc08fkJ",
  },

  liberty: {
    name: "Stoko’s Liberty",
    slug: "liberty",
    address: "8624 Liberty Rd, Randallstown, MD",
    phone: "410-655-0009",
    email: "support@stokos.com",
     hours: "Sun - Thu: 10am - 10pm\nFri - Sat: 10am - 11pm",
    pickupTime: "30 min",
    deliveryTime: "Order Later Only",
    google: "https://share.google/8X2nSgI5Oi6Y73Wnk",
  },
};

export default async function StoreContactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = stores[slug];
  const footerStore = STORES.find((item) => item.slug === slug);

  if (!store || !footerStore) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <StoreContactUs store={store} />

      <Footer store={footerStore} />
    </>
  );
}