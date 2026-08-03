import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import DynamicHeader from "@/components/DynamicHeader";

export const metadata: Metadata = {
  title: "Marketim - Online Alışveriş",
  description: "Kaliteli ürünleri uygun fiyatlarla sunan online alışveriş deneyimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased min-h-screen flex flex-col">
        <DynamicHeader>
          <main className="flex-1">{children}</main>
        </DynamicHeader>
        <Footer />
      </body>
    </html>
  );
}
