"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
{ href: "/", label: "注文入力" },
{ href: "/kitchen", label: "キッチン" },
{ href: "/call", label: "呼出画面" },
{ href: "/orders", label: "注文履歴・売上" },
{ href: "/products", label: "商品管理" },
];

export default function Navbar() {
const pathname = usePathname();

return (
<nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
<div className="mx-auto max-w-[1600px] px-3 py-3 md:px-6">
<div className="flex items-center gap-3 overflow-x-auto">
<Link href="/" className="mr-2 shrink-0 text-lg font-black text-slate-900 md:text-xl" >
店舗システム
</Link>

      <div className="flex shrink-0 gap-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition md:text-base " +
                (isActive
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  </div>
</nav>

);
}