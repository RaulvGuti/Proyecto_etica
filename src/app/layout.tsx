import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Puente",
  description: "Red de apoyo al migrante",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}