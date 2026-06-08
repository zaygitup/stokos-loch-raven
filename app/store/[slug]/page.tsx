import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Categories from "@/components/categories";
import MenuSection from "@/components/menusection";
import { PRODUCTS } from "@/lib/data/products";
import { POPULAR_ITEMS } from "@/lib/data/popularitems";
import { BREAKFAST } from "@/lib/data/breakfast";
import { STORES } from "@/lib/data/stores";
import { notFound } from "next/navigation";
import StartOrder from "@/components/startorder";
import Footer from "@/components/footer";
import BackToTop from "@/components/backtotop";
import DealsSection from "@/components/dealssection";
import CartSidebar from "@/components/cartsidebar";
import ScrollMenu from "@/components/scrollmenu";

type StorePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;

  const store = STORES.find((store) => store.slug === slug);

  if (!store) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <ScrollMenu />

      <Navbar />
      <CartSidebar />
      <StartOrder />
      <Hero />
      <Categories />

      <DealsSection />

      <div className="flex flex-col pb-20">
        <MenuSection
          id="trending"
          title="Popular Menu Items"
          products={POPULAR_ITEMS.filter((p: any) => p.category === "trending")}
        />

        <MenuSection
          id="pizzas"
          title="Pizzas"
          products={PRODUCTS.filter((p: any) => p.category === "pizzas")}
        />

        <MenuSection
          id="breakfast"
          title="Breakfast"
          subtitle="served until 11am"
          products={BREAKFAST.filter((p: any) => p.category === "breakfast")}
        />
      </div>

      <BackToTop />
      <Footer store={store} />
    </main>
  );
}