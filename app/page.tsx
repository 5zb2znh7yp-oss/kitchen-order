"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type Product = {
id: string;
name: string;
price: number;
is_active: boolean;
};

type CartItem = {
productId: string;
name: string;
price: number;
quantity: number;
};

export default function Home() {
const [products, setProducts] = useState<Product[]>([]);
const [cart, setCart] = useState<CartItem[]>([]);
const [cashReceived, setCashReceived] = useState("");
const [loading, setLoading] = useState(true);
const [checkingOut, setCheckingOut] = useState(false);
const [receipt, setReceipt] = useState<{
orderNumber: number;
total: number;
cashReceived: number;
change: number;
} | null>(null);

useEffect(() => {
loadProducts();
}, []);

async function loadProducts() {
setLoading(true);

const { data, error } = await supabase
  .from("products")
  .select("id, name, price, is_active")
  .eq("is_active", true)
  .order("created_at", { ascending: true });

if (error) {
  console.error("商品取得エラー:", error);
  alert("商品を取得できませんでした。");
  setLoading(false);
  return;
}

setProducts((data ?? []) as Product[]);
setLoading(false);

}

function addProduct(product: Product) {
setCart((current) => {
const existing = current.find(
(item) => item.productId === product.id
);

  if (existing) {
    return current.map((item) =>
      item.productId === product.id
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item
    );
  }

  return [
    ...current,
    {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    },
  ];
});

}

function increaseQuantity(productId: string) {
setCart((current) =>
current.map((item) =>
item.productId === productId
? {
...item,
quantity: item.quantity + 1,
}
: item
)
);
}

function decreaseQuantity(productId: string) {
setCart((current) =>
current
.map((item) =>
item.productId === productId
? {
...item,
quantity: item.quantity - 1,
}
: item
)
.filter((item) => item.quantity > 0)
);
}

function clearCart() {
setCart([]);
setCashReceived("");
}

const total = cart.reduce(
(sum, item) => sum + item.price * item.quantity,
0
);

const cash = Number(cashReceived) || 0;
const change = cash - total;

async function checkout() {
if (cart.length === 0) {
alert("商品を選択してください。");
return;
}

if (cash < total) {
  alert("預かり金額が不足しています。");
  return;
}

setCheckingOut(true);

const { data: orderNumber, error: numberError } =
  await supabase.rpc("next_order_number");

if (numberError) {
  console.error("整理番号取得エラー:", numberError);
  alert("整理番号を取得できませんでした。");
  setCheckingOut(false);
  return;
}

const items = cart.map((item) => ({
  productId: item.productId,
  name: item.name,
  price: item.price,
  quantity: item.quantity,
}));

const { error: insertError } = await supabase
  .from("orders")
  .insert({
    order_number: orderNumber,
    total_price: total,
    cash_received: cash,
    change_amount: change,
    status: "new",
    items,
  });

if (insertError) {
  console.error("注文登録エラー:", insertError);
  alert("注文を登録できませんでした。");
  setCheckingOut(false);
  return;
}

setReceipt({
  orderNumber,
  total,
  cashReceived: cash,
  change,
});

setCart([]);
setCashReceived("");
setCheckingOut(false);

}

if (receipt) {
return (
<main className="min-h-screen bg-slate-100 p-4 md:p-8">
<div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
<div className="w-full rounded-3xl bg-white p-6 shadow-xl md:p-10">
<div className="text-center">
<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
<span className="text-4xl font-black text-green-700">
✓
</span>
</div>

          <h1 className="mt-5 text-3xl font-black text-slate-950 md:text-4xl">
            注文受付完了
          </h1>

          <p className="mt-2 text-lg font-bold text-slate-700">
            厨房へ注文を送信しました
          </p>
        </div>

        <div className="mt-8 rounded-3xl bg-slate-950 p-8 text-center">
          <p className="text-lg font-black text-slate-300">
            整理番号
          </p>

          <p className="mt-2 text-7xl font-black tracking-widest text-white md:text-8xl">
            {String(receipt.orderNumber).padStart(3, "0")}
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="flex justify-between">
            <span className="font-bold text-slate-700">
              合計
            </span>

            <span className="text-xl font-black text-slate-950">
              ¥{receipt.total.toLocaleString("ja-JP")}
            </span>
          </div>

          <div className="mt-3 flex justify-between">
            <span className="font-bold text-slate-700">
              預かり
            </span>

            <span className="text-xl font-black text-slate-950">
              ¥
              {receipt.cashReceived.toLocaleString(
                "ja-JP"
              )}
            </span>
          </div>

          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
            <span className="font-black text-slate-800">
              おつり
            </span>

            <span className="text-2xl font-black text-green-700">
              ¥{receipt.change.toLocaleString("ja-JP")}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setReceipt(null)}
          className="mt-6 w-full rounded-2xl bg-blue-600 py-5 text-xl font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
        >
          次の注文
        </button>
      </div>
    </div>
  </main>
);

}

return (
<main className="min-h-screen bg-slate-100 p-3 sm:p-4 md:p-6">
<div className="mx-auto max-w-[1600px]">
<header className="mb-5 md:mb-6">
<h1 className="text-3xl font-black text-slate-950 md:text-4xl">
注文入力
</h1>

      <p className="mt-1 text-base font-bold text-slate-700">
        商品を選択して会計を行ってください。
      </p>
    </header>

    <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:gap-6">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-950">
            商品
          </h2>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
            {products.length} 商品
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              商品を読み込んでいます...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              販売中の商品がありません。
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const cartItem = cart.find(
                (item) => item.productId === product.id
              );

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className={
                    "min-h-[170px] rounded-2xl border-2 bg-white p-6 text-left shadow-sm transition " +
                    "hover:border-blue-400 hover:shadow-md " +
                    "active:scale-[0.98] " +
                    (cartItem
                      ? "border-blue-500 ring-4 ring-blue-100"
                      : "border-slate-200")
                  }
                >
                  <div className="flex min-h-[130px] flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-950 md:text-3xl">
                        {product.name}
                      </h3>

                      <p className="mt-3 text-2xl font-black text-slate-700">
                        ¥{product.price.toLocaleString("ja-JP")}
                      </p>
                    </div>

                    {cartItem ? (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-800">
                          注文中
                        </span>

                        <span className="text-2xl font-black text-blue-700">
                          × {cartItem.quantity}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-4 text-sm font-black text-slate-500">
                        タップして追加
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="bg-slate-950 px-5 py-5 md:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">
                注文内容
              </h2>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-xl bg-slate-700 px-4 py-3 text-sm font-black text-white hover:bg-slate-600"
                >
                  クリア
                </button>
              )}
            </div>
          </div>

          <div className="p-4 md:p-5">
            {cart.length === 0 ? (
              <div className="rounded-2xl bg-slate-100 p-8 text-center md:p-10">
                <p className="text-lg font-black text-slate-600">
                  商品を選択してください
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="rounded-2xl border-2 border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black text-slate-950">
                          {item.name}
                        </p>

                        <p className="mt-1 font-bold text-slate-700">
                          ¥
                          {(
                            item.price * item.quantity
                          ).toLocaleString("ja-JP")}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(
                              item.productId
                            )
                          }
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-2xl font-black text-slate-900 hover:bg-slate-300 active:scale-95"
                        >
                          −
                        </button>

                        <span className="w-8 text-center text-xl font-black text-slate-950">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(
                              item.productId
                            )
                          }
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-2xl font-black text-white hover:bg-slate-800 active:scale-95"
                        >
                          ＋
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 border-t-2 border-slate-200 pt-5">
              <div className="flex items-end justify-between gap-4">
                <span className="text-lg font-black text-slate-700">
                  合計
                </span>

                <span className="text-4xl font-black text-slate-950">
                  ¥{total.toLocaleString("ja-JP")}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="cash"
                className="mb-2 block text-lg font-black text-slate-800"
              >
                預かり金額
              </label>

              <input
                id="cash"
                type="number"
                inputMode="numeric"
                min="0"
                value={cashReceived}
                onChange={(event) =>
                  setCashReceived(event.target.value)
                }
                placeholder="例：2000"
                className="w-full rounded-2xl border-2 border-slate-300 bg-white px-5 py-5 text-2xl font-black text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div
              className={
                "mt-4 rounded-2xl p-5 " +
                (cash >= total && total > 0
                  ? "bg-green-100"
                  : "bg-slate-100")
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-700">
                  おつり
                </span>

                <span
                  className={
                    "text-3xl font-black " +
                    (cash >= total && total > 0
                      ? "text-green-700"
                      : "text-slate-500")
                  }
                >
                  ¥
                  {Math.max(
                    0,
                    change
                  ).toLocaleString("ja-JP")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={checkout}
              disabled={
                checkingOut ||
                cart.length === 0 ||
                cash < total
              }
              className="mt-5 w-full rounded-2xl bg-blue-600 py-6 text-xl font-black text-white shadow-md transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 md:text-2xl"
            >
              {checkingOut
                ? "注文登録中..."
                : "会計して注文確定"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</main>

);
}