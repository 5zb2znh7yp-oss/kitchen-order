"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "注文入力" },
  { href: "/kitchen", label: "厨房" },
  { href: "/call", label: "呼出" },
  { href: "/orders", label: "注文履歴" },
  { href: "/products", label: "商品管理" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-700 bg-slate-950 px-3 py-3 shadow-lg">
      <div className="mx-auto flex max-w-[1600px] flex-wrap gap-2">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/" &&
              pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-3 text-sm font-black transition md:px-5 md:text-base ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}