"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/salud", label: "Salud y Autocuidado" },
  { href: "/comunidad", label: "Comunidad" },
  { href: "/directorio", label: "Directorio" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="wrap">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? "active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}