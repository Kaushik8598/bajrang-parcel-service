import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "BAJRANG Road Lines & Parcel Service",
  description: "Admin panel for BAJRANG Road Lines & Parcel Service — manage bookings, deliveries, branches, and more.",
  keywords: ["parcel service", "transport", "logistics", "admin"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
