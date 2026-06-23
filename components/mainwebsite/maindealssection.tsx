import { getHomePageFeaturedDeals } from "@/lib/server/menuproducts";
import FeaturedDealsCarousel from "@/components/mainwebsite/maindealscarousel";

export default async function FeaturedDeals() {
  const deals = await getHomePageFeaturedDeals();

  if (!deals.length) return null;

  return <FeaturedDealsCarousel deals={deals} />;
}
