"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type Product = {
id: string;
name: string;
price: number;
};

type CartItem = {
productId: string;
name: string;
price: number;
quantity: number;
};

type BusinessStatus = {
id: number;
is_open: boolean;
opened_at: string | null;
closed_at: string | null;
};

export default function MobilePage() {
const [products, setProducts] = useState<Product[]>([]);
const [cart, setCart] = useState<CartItem[]>([]);
const [isOpen, setIsOpen] = useState(false);
const [loading, setLoading] = useState(true);
const [ordering, setOrdering] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const [orderNumber, setOrderNumber] = useState<number | null>(null);

useEffect(() => {
loadData();

const timer = window.setInterval(() => {
  loadBusinessStatus();
}, 5000);

return () => {
  window.clearInterval(timer);
};

}, []);

async function loadData() {
setLoading(true);
setErrorMessage("");

await Promise.all([
  loadProducts(),
  loadBusinessStatus(),
]);

setLoading(false);

}

async function loadProducts() {
const { data, error } = await supabase
.from("products")
.select("id, name, price")
.eq("is_active", true)
.order("created_at", { ascending: true });

if (error) {
  console.error("商品取得エラー:", error);
  setErrorMessage("商品を取得できませんでした。");
  return;
}

setProducts((data ?? []) as Product[]);

}

async function loadBusinessStatus() {
const { data, error } = await supabase
.from("business_status")
.select("id, is_open, opened_at, closed_at")
.eq("id", 1)
.maybeSingle();

if (error) {
  console.error("営業状態取得エラー:", error);
  return;
}

if (data) {
  setIsOpen((data as BusinessStatus).is_open);
}

}

function addToCart(product: Product) {
if (!isOpen || ordering) {
return;
}

setErrorMessage("");

setCart((currentCart) => {
  const existing = currentCart.find(
    (item) => item.productId === product.id
  );

  if (existing) {
    return currentCart.map((item) =>
      item.productId === product.id
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item
    );
  }

  return [
    ...currentCart,
    {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    },
  ];
});

}

function changeQuantity(productId: string, amount: number) {
if (!isOpen || ordering) {
return;
}

setCart((currentCart) =>
  currentCart
    .map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity: item.quantity + amount,
          }
        : item
    )
    .filter((item) => item.quantity > 0)
);

}

const total = cart.reduce(
(sum, item) => sum + item.price * item.quantity,
0
);

async function submitOrder() {
if (ordering) {
return;
}

setErrorMessage("");

if (!isOpen) {
  setErrorMessage("現在は注文受付時間外です。");
  return;
}

if (cart.length === 0) {
  setErrorMessage("商品を1つ以上選択してください。");
  return;
}

setOrdering(true);

try {
  const { data: businessStatus, error: statusError } =
    await supabase
      .from("business_status")
      .select("is_open")
      .eq("id", 1)
      .maybeSingle();

  if (statusError) {
    console.error("営業状態再確認エラー:", statusError);
    setErrorMessage(
      "営業状態を確認できませんでした。もう一度お試しください。"
    );
    return;
  }

  if (!businessStatus?.is_open) {
    setIsOpen(false);
    setCart([]);
    setErrorMessage("現在は注文受付時間外です。");
    return;
  }

  const { data: orderNumberData, error: numberError } =
    await supabase.rpc("next_order_number");

  if (numberError) {
    console.error("整理番号取得エラー:", numberError);
    setErrorMessage(
      "整理番号を取得できませんでした。もう一度お試しください。"
    );
    return;
  }

  const nextNumber = Number(orderNumberData);

  if (!Number.isFinite(nextNumber) || nextNumber <= 0) {
    setErrorMessage("整理番号が正しく取得できませんでした。");
    return;
  }

  const { error: insertError } = await supabase
    .from("orders")
    .insert({
      order_number: nextNumber,
      total_price: total,
      cash_received: 0,
      change_amount: 0,
      status: "new",
      items: cart,
      staff_name: "モバイル注文",
      order_source: "mobile",
      payment_status: "unpaid",
    });

  if (insertError) {
    console.error("モバイル注文登録エラー:", insertError);
    setErrorMessage(
      "注文を送信できませんでした。もう一度お試しください。"
    );
    return;
  }

  setOrderNumber(nextNumber);
  setCart([]);
} catch (error) {
  console.error("モバイル注文エラー:", error);
  setErrorMessage(
    "通信エラーが発生しました。もう一度お試しください。"
  );
} finally {
  setOrdering(false);
}

}

if (orderNumber !== null) {
return (
<main className="min-h-screen bg-slate-100 p-4">
<div className="mx-auto flex min-h-screen max-w-lg items-center justify-center">
<div className="w-full rounded-3xl bg-white p-6 text-center shadow-xl md:p-8">
<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
<span className="text-4xl font-black text-green-700">
✓
</span>
</div>

        <h1 className="mt-6 text-3xl font-black text-slate-950">
          注文を受け付けました
        </h1>

        <p className="mt-3 font-bold text-slate-600">
          商品が完成するまでお待ちください。
        </p>

        <div className="mt-8 rounded-3xl bg-slate-950 p-7">
          <p className="text-sm font-black text-slate-300">
            整理番号
          </p>

          <p className="mt-2 text-7xl font-black tracking-widest text-white">
            {String(orderNumber).padStart(3, "0")}
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-yellow-50 p-5 text-left">
          <p className="font-black text-yellow-900">
            お支払いについて
          </p>

          <p className="mt-2 font-bold leading-7 text-yellow-900">
            商品完成後、店頭で現金にてお支払いください。
          </p>

          <p className="mt-2 font-bold leading-7 text-yellow-900">
            おつりが必要な場合は、会計時にスタッフへお伝えください。
          </p>
        </div>

        <p className="mt-6 text-sm font-bold text-slate-500">
          この画面は注文確認用です。整理番号をお控えください。
        </p>
      </div>
    </div>
  </main>
);

}

if (loading) {
return (
<main className="min-h-screen bg-slate-100 p-4">
<div className="mx-auto flex min-h-screen max-w-lg items-center justify-center">
<div className="rounded-3xl bg-white px-8 py-10 text-center shadow-xl">
<p className="text-xl font-black text-slate-700">
注文画面を読み込んでいます...
</p>
</div>
</div>
</main>
);
}

return (
<main className="min-h-screen bg-slate-100 pb-36">
<header className="bg-slate-950 px-4 py-6 text-white">
<div className="mx-auto max-w-lg">
<p className="text-sm font-black text-slate-300">
お客様用
</p>

      <h1 className="mt-1 text-3xl font-black">
        モバイルオーダー
      </h1>

      <div className="mt-4">
        {isOpen ? (
          <span className="inline-flex rounded-full bg-green-500 px-4 py-2 text-sm font-black text-white">
            🟢 注文受付中
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-red-500 px-4 py-2 text-sm font-black text-white">
            🔴 現在は注文受付終了
          </span>
        )}
      </div>
    </div>
  </header>

  <div className="mx-auto max-w-lg px-4 py-5">
    {!isOpen ? (
      <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 p-5">
        <p className="text-lg font-black text-red-700">
          現在はモバイル注文を受け付けていません。
        </p>

        <p className="mt-2 font-bold leading-7 text-red-600">
          店舗の注文受付が開始されると、ここから注文できます。
        </p>
      </div>
    ) : null}

    {errorMessage ? (
      <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 p-4">
        <p className="font-black text-red-700">
          {errorMessage}
        </p>
      </div>
    ) : null}

    <section>
      <h2 className="mb-4 text-2xl font-black text-slate-950">
        商品を選択
      </h2>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-black text-slate-600">
            現在販売中の商品がありません。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const cartItem = cart.find(
              (item) => item.productId === product.id
            );

            const quantity = cartItem?.quantity ?? 0;

            return (
              <div
                key={product.id}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xl font-black text-slate-950">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-lg font-black text-slate-700">
                      ¥{product.price.toLocaleString("ja-JP")}
                    </p>
                  </div>

                  {quantity === 0 ? (
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={!isOpen || ordering}
                      className="shrink-0 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      追加
                    </button>
                  ) : (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(product.id, -1)
                        }
                        disabled={!isOpen || ordering}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-2xl font-black text-slate-900 disabled:opacity-50"
                      >
                        −
                      </button>

                      <span className="w-8 text-center text-xl font-black text-slate-950">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(product.id, 1)
                        }
                        disabled={!isOpen || ordering}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-2xl font-black text-white disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  </div>

  <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
    <div className="mx-auto flex max-w-lg items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-500">
          注文合計
        </p>

        <p className="truncate text-2xl font-black text-slate-950">
          ¥{total.toLocaleString("ja-JP")}
        </p>
      </div>

      <button
        type="button"
        onClick={submitOrder}
        disabled={
          !isOpen ||
          ordering ||
          cart.length === 0 ||
          total <= 0
        }
        className="shrink-0 rounded-2xl bg-green-600 px-6 py-4 text-lg font-black text-white shadow-md transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        {ordering ? "送信中..." : "注文を送信"}
      </button>
    </div>
  </div>
</main>

);
}