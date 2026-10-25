"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
{ href: "/", label: "注文入力" },
{ href: "/mobile-order", label: "モバイルオーダー" },
{ href: "/kitchen", label: "キッチン" },
{ href: "/call", label: "呼出画面" },
{ href: "/orders", label: "注文履歴・売上" },
{ href: "/products", label: "商品管理" },
{ href: "/staff", label: "スタッフ管理" },
{ href: "/finance", label: "資金管理" },
];

export default function Navbar() {
const pathname = usePathname();

if (pathname === "/mobile") {
return null;
}

return (
<nav className="border-b border-slate-200 bg-white">
<div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
{links.map((link) => {
const active =
link.href === "/"
? pathname === "/"
: pathname.startsWith(link.href);

      return (
        <Link
          key={link.href}
          href={link.href}
          className={
            "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black transition " +
            (active
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200")
          }
        >
          {link.label}
        </Link>
      );
    })}
  </div>
</nav>

);
}