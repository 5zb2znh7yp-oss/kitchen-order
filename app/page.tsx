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

type Staff = {
id: string;
display_name: string;
};

type BusinessStatus = {
id: number;
is_open: boolean;
opened_at: string | null;
closed_at: string | null;
};

export default function Home() {
const [products, setProducts] = useState<Product[]>([]);
const [staff, setStaff] = useState<Staff[]>([]);
const [selectedStaffName, setSelectedStaffName] = useState("");
const [cart, setCart] = useState<CartItem[]>([]);
const [cashReceived, setCashReceived] = useState("");
const [loading, setLoading] = useState(true);
const [checkingOut, setCheckingOut] = useState(false);
const [changingBusinessStatus, setChangingBusinessStatus] = useState(false);
const [isOpen, setIsOpen] = useState(false);
const [errorMessage, setErrorMessage] = useState("");

const [receipt, setReceipt] = useState<{
orderNumber: number;
total: number;
cashReceived: number;
change: number;
staffName: string;
} | null>(null);

useEffect(() => {
loadProducts();
loadStaff();
loadBusinessStatus();

const savedStaff = localStorage.getItem("kitchen-order-staff");

if (savedStaff) {
  try {
    const parsedStaff = JSON.parse(savedStaff);

    if (parsedStaff.displayName) {
      setSelectedStaffName(parsedStaff.displayName);
    }
  } catch (error) {
    console.error(
      "保存されたスタッフ情報の読み込みに失敗しました:",
      error
    );

    localStorage.removeItem("kitchen-order-staff");
  }
}

const interval = window.setInterval(() => {
  loadBusinessStatus();
}, 5000);

return () => {
  window.clearInterval(interval);
};

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

  setErrorMessage(
    "商品を取得できませんでした。通信状態を確認して、ページを再読み込みしてください。"
  );

  setLoading(false);
  return;
}

setProducts((data ?? []) as Product[]);
setLoading(false);

}

async function loadStaff() {
const { data, error } = await supabase
.from("staff_profiles")
.select("id, display_name")
.order("display_name");

if (error) {
  console.error("スタッフ取得エラー:", error);

  setErrorMessage(
    "スタッフを取得できませんでした。スタッフ登録を確認してください。"
  );

  return;
}

setStaff(data ?? []);

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
  const status = data as BusinessStatus;
  setIsOpen(status.is_open);
}

}

async function changeBusinessStatus(nextIsOpen: boolean) {
if (changingBusinessStatus) {
return;
}

setErrorMessage("");
setChangingBusinessStatus(true);

const now = new Date().toISOString();

const updateData = nextIsOpen
  ? {
      is_open: true,
      opened_at: now,
      closed_at: null,
      updated_at: now,
    }
  : {
      is_open: false,
      closed_at: now,
      updated_at: now,
    };

const { error } = await supabase
  .from("business_status")
  .update(updateData)
  .eq("id", 1);

if (error) {
  console.error("営業状態変更エラー:", error);

  setErrorMessage(
    "注文受付の状態を変更できませんでした。通信状態を確認してください。"
  );

  setChangingBusinessStatus(false);
  return;
}

setIsOpen(nextIsOpen);

if (!nextIsOpen) {
  setCart([]);
  setCashReceived("");
}

setChangingBusinessStatus(false);

}

function addProduct(product: Product) {
if (checkingOut || !isOpen) {
return;
}

setErrorMessage("");

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
if (checkingOut || !isOpen) {
return;
}

setErrorMessage("");

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
if (checkingOut || !isOpen) {
return;
}

setErrorMessage("");

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
if (checkingOut || !isOpen) {
return;
}

setErrorMessage("");
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
if (checkingOut) {
return;
}

setErrorMessage("");

if (!isOpen) {
  setErrorMessage("現在、注文受付を終了しています。");
  return;
}

if (!selectedStaffName) {
  setErrorMessage("担当スタッフを選択してください。");
  return;
}

if (cart.length === 0) {
  setErrorMessage("商品を選択してください。");
  return;
}

if (cash < total) {
  setErrorMessage("預かり金額が不足しています。");
  return;
}

setCheckingOut(true);

try {
  const { data: currentStatus, error: statusError } = await supabase
    .from("business_status")
    .select("is_open")
    .eq("id", 1)
    .maybeSingle();

  if (statusError) {
    console.error("営業状態確認エラー:", statusError);

    setErrorMessage(
      "営業状態を確認できませんでした。もう一度お試しください。"
    );

    return;
  }

  if (!currentStatus?.is_open) {
    setIsOpen(false);
    setCart([]);
    setCashReceived("");

    setErrorMessage(
      "注文受付が終了しました。今回の注文は登録されていません。"
    );

    return;
  }

  const { data: orderNumber, error: numberError } =
    await supabase.rpc("next_order_number");

  if (numberError) {
    console.error("整理番号取得エラー:", numberError);

    setErrorMessage(
      "整理番号を取得できませんでした。通信状態を確認して、もう一度お試しください。"
    );

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
      staff_name: selectedStaffName,
    });

  if (insertError) {
    console.error("注文登録エラー:", insertError);

    setErrorMessage(
      "注文を登録できませんでした。注文は確定していません。通信状態を確認して、もう一度お試しください。"
    );

    return;
  }

  setReceipt({
    orderNumber,
    total,
    cashReceived: cash,
    change,
    staffName: selectedStaffName,
  });

  setCart([]);
  setCashReceived("");
} catch (error) {
  console.error("会計処理エラー:", error);

  setErrorMessage(
    "通信エラーが発生しました。注文は確定していません。もう一度お試しください。"
  );
} finally {
  setCheckingOut(false);
}

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

        <div className="mt-6 rounded-2xl bg-blue-50 p-5 text-center">
          <p className="text-sm font-black text-slate-600">
            担当スタッフ
          </p>

          <p className="mt-1 text-2xl font-black text-blue-700">
            {receipt.staffName}
          </p>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-950 p-8 text-center">
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
              ¥{receipt.cashReceived.toLocaleString("ja-JP")}
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
<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
<div>
<h1 className="text-3xl font-black text-slate-950 md:text-4xl">
注文入力
</h1>

          <p className="mt-1 text-base font-bold text-slate-700">
            商品を選択して会計を行ってください。
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-black text-slate-500">
                注文受付状態
              </p>

              <p
                className={
                  "mt-1 text-xl font-black " +
                  (isOpen
                    ? "text-green-700"
                    : "text-red-600")
                }
              >
                {isOpen
                  ? "🟢 注文受付中"
                  : "🔴 注文受付終了"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => changeBusinessStatus(!isOpen)}
              disabled={changingBusinessStatus}
              className={
                "rounded-xl px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50 " +
                (isOpen
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700")
              }
            >
              {changingBusinessStatus
                ? "変更中..."
                : isOpen
                  ? "注文受付を終了"
                  : "注文受付を開始"}
            </button>
          </div>
        </div>
      </div>
    </header>

    {!isOpen && (
      <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-center">
        <p className="text-xl font-black text-red-700">
          現在、注文受付を終了しています
        </p>

        <p className="mt-1 font-bold text-red-600">
          「注文受付を開始」を押すと注文できるようになります。
        </p>
      </div>
    )}

    {errorMessage && (
      <div
        role="alert"
        className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl font-black text-red-600">
            !
          </span>

          <div>
            <p className="font-black text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="mt-2 text-sm font-black text-red-600 underline"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    )}

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

        {!isOpen ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-xl font-black text-red-600">
              注文受付終了中
            </p>

            <p className="mt-2 font-bold text-slate-600">
              営業を開始すると商品を選択できます。
            </p>
          </div>
        ) : loading ? (
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
                  disabled={checkingOut || !isOpen}
                  className={
                    "min-h-[170px] rounded-2xl border-2 bg-white p-6 text-left shadow-sm transition " +
                    "hover:border-blue-400 hover:shadow-md " +
                    "active:scale-[0.98] " +
                    "disabled:cursor-not-allowed disabled:opacity-60 " +
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
                  disabled={checkingOut || !isOpen}
                  className="rounded-xl bg-slate-700 px-4 py-3 text-sm font-black text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  クリア
                </button>
              )}
            </div>
          </div>

          <div className="p-4 md:p-5">
            <div className="mb-5 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
              <label
                htmlFor="staff"
                className="mb-2 block text-lg font-black text-slate-800"
              >
                担当スタッフ
              </label>

              <select
                id="staff"
                value={selectedStaffName}
                onChange={(event) => {
                  setSelectedStaffName(event.target.value);
                  setErrorMessage("");
                }}
                disabled={checkingOut || !isOpen}
                className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-4 text-lg font-black text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="">
                  スタッフを選択してください
                </option>

                {staff.map((person) => (
                  <option
                    key={person.id}
                    value={person.display_name}
                  >
                    {person.display_name}
                  </option>
                ))}
              </select>
            </div>

            {cart.length === 0 ? (
              <div className="rounded-2xl bg-slate-100 p-8 text-center md:p-10">
                <p className="text-lg font-black text-slate-600">
                  {isOpen
                    ? "商品を選択してください"
                    : "注文受付終了中です"}
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
                            decreaseQuantity(item.productId)
                          }
                          disabled={checkingOut || !isOpen}
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-2xl font-black text-slate-900 hover:bg-slate-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          −
                        </button>

                        <span className="w-8 text-center text-xl font-black text-slate-950">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(item.productId)
                          }
                          disabled={checkingOut || !isOpen}
                          className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-2xl font-black text-white hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
                disabled={checkingOut || !isOpen}
                placeholder="例：2000"
                className="w-full rounded-2xl border-2 border-slate-300 bg-white px-5 py-5 text-2xl font-black text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
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
                  ¥{Math.max(0, change).toLocaleString("ja-JP")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={checkout}
              disabled={
                checkingOut ||
                !isOpen ||
                !selectedStaffName ||
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