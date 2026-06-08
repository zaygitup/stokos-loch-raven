import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MainHeroSection() {
  return (
    <section className="w-full px-4 pt-4 md:px-6 md:py-10 lg:px-8 lg:py-20">
      <div className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-[22px] bg-[#005321] shadow-[0_18px_45px_rgba(0,0,0,0.18)] md:h-[520px] lg:h-[576px]">
        {/* Tablet / Desktop Background Image */}
        <Image
          src="/images/mainwebsitehero4.png"
          alt="Stoko's fresh pizza and deals"
          fill
          priority
          className="hidden object-cover object-[72%_center] md:block lg:object-contain lg:object-right"
        />

        {/* Tablet Overlay */}
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#005321_0%,#005321_38%,rgba(0,83,33,0.96)_48%,rgba(0,83,33,0.72)_60%,rgba(0,83,33,0.25)_78%,rgba(0,83,33,0)_100%)] md:block lg:hidden" />

        {/* Desktop Smooth Overlay */}
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#005321_0%,#005321_34%,rgba(0,83,33,0.96)_43%,rgba(0,83,33,0.78)_48%,rgba(0,83,33,0.35)_58%,rgba(0,83,33,0.12)_74%,rgba(0,83,33,0)_88%)] lg:block" />

        {/* Light Tint */}
        <div className="absolute inset-0 hidden bg-black/5 md:block" />

        {/* Content */}
        <div className="relative z-10 flex flex-col md:h-full md:max-w-[500px] md:justify-center md:px-10 lg:max-w-[620px] lg:px-14">
          <div className="px-6 pb-8 pt-8 sm:px-8 sm:pt-10 md:px-0 md:py-0">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-green-700 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-white backdrop-blur-md md:mb-6">
              <span className="h-2 w-2 rounded-full bg-[#DA3327]" />
              Limited Time Deal
            </div>

            <h1 className="max-w-[560px] text-[39px] font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-[48px] md:text-[56px] lg:text-[68px]">
              Hot Deals,
              <br />
              Fresh Food,
              <br />
              <span className="text-[#DA3327]">Fast Delivery.</span>
            </h1>

            <p className="mt-6 max-w-[460px] text-[17px] font-medium leading-[1.55] text-white/95 sm:text-[18px] md:mt-6 md:max-w-[420px] md:text-[18px] lg:mt-7 lg:max-w-[460px] lg:text-[20px]">
              Order pizza, subs, wings, breakfast and more from your nearest
              Stoko&apos;s location.
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/mainwebsite/location?action=menu"
                className="inline-flex h-[52px] min-w-[185px] items-center justify-center gap-2 rounded-full bg-[#DA3327] px-7 text-[15px] font-extrabold uppercase tracking-wide text-white shadow-[0_12px_25px_rgba(218,51,39,0.28)] transition hover:bg-[#c22b20] md:h-[50px] md:min-w-[175px] lg:h-[52px] lg:min-w-[185px]"
              >
                Start Order
                <ArrowRight size={18} strokeWidth={3} />
              </Link>

              <Link
                href="/mainwebsite/location?action=menu"
                className="inline-flex h-[52px] min-w-[155px] items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 text-[15px] font-extrabold uppercase tracking-wide text-white backdrop-blur-md transition hover:bg-white/18 md:h-[50px] md:min-w-[145px] lg:h-[52px] lg:min-w-[155px]"
              >
                View Menu
              </Link>
            </div>
          </div>

          {/* Mobile Bottom Image */}
          <div className="relative h-[280px] w-full overflow-hidden md:hidden">
            <Image
              src="/images/mainwebsitehero4.png"
              alt="Stoko's pizza"
              fill
              priority
              className="object-cover object-bottom"
            />

            <div className="absolute inset-0 bg-[linear-gradient(180deg,#005321_0%,rgba(0,83,33,0.80)_8%,rgba(0,83,33,0.35)_35%,rgba(0,83,33,0.10)_100%)]" />
            <div className="absolute inset-0 bg-[#005321]/20" />
          </div>
        </div>
      </div>
    </section>
  );
}