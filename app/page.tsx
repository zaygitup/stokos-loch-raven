import MainNavbar from "@/components/mainwebsite/mainnavbar";
import MainHeroSection from "@/components/mainwebsite/mainherosection";
import MainTestimonials from "@/components/mainwebsite/maintestimonials";
import MainFooter from "@/components/mainwebsite/mainfooter";
import BackToTop from "@/components/mainwebsite/mainbacktotop";
import FeaturedDeals from "@/components/mainwebsite/maindealssection";
import ExploreMenuSection from "@/components/mainwebsite/mainmenusection";
import BottomNavigation from "@/components/bottomnavigation";

export default async function Page() {
  return (
    <>
      <MainNavbar />

      <main className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-black dark:text-white">
        <MainHeroSection />

        <FeaturedDeals />

        <ExploreMenuSection />

        <section id="testimonials">
          <MainTestimonials />
        </section>

        <BackToTop />

        <MainFooter />
      </main>

      <BottomNavigation />
    </>
  );
}