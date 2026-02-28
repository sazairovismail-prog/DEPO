import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Excel Benzeri Tablo - Izgara Temalı",
  description: "Modern, izgara temalı elektronik tablo uygulaması",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
