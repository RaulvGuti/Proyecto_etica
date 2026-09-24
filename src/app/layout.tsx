import type { Metadata } from "next";
import "../styles/globals.css";
import EmergencyBar from "@/components/EmergencyBar";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Puente — Red de Apoyo al Migrante",
  description: "Salud, comunidad y directorio de apoyo para migrantes en Guatemala",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <EmergencyBar />
        <NavBar />
        {children}
      </body>
    </html>
  );
}