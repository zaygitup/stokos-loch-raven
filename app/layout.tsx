import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Stoko's Loch Raven – Online Ordering",
  description:
    "Order fresh pizza, subs, wings & more from Stoko's Loch Raven. Fast online ordering with pickup & delivery.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stoko's",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#16A34A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${jakarta.variable} min-h-screen bg-white font-sans antialiased dark:bg-black`}
      >
        <ClerkProvider>
          <main className="min-h-screen">{children}</main>

          <Script
            id="stripe-back-fix"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              window.addEventListener("pageshow", function (event) {
                var stripeStarted = sessionStorage.getItem("stripe_checkout_started");

                if (stripeStarted === "1" || event.persisted) {
                  sessionStorage.removeItem("stripe_checkout_started");
                  window.location.reload();
                }
              });
            `,
            }}
          />
        </ClerkProvider>
      </body>
    </html>
  );
}