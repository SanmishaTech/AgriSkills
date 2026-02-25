import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import HomeNavbar from "@/components/HomeNavbar";
import LayoutWrapper from "@/components/LayoutWrapper";
import LastUrlTracker from "@/components/LastUrlTracker";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Gram Kushal",
  description: "Learn modern agricultural skills and techniques",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased mobile-only"
        style={{ fontFamily: "'Helvetica Neue LT', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
      >
        <LayoutWrapper>
          <LastUrlTracker />
          <HomeNavbar />
          <main className="h-full">
            {children}
          </main>
          <Footer />
        </LayoutWrapper>
      </body>
    </html>
  );
}
