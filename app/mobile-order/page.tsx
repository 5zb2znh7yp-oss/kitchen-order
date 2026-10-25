"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type CartItem = {
productId: string;
name: string;
price: number;
quantity: number;
};

type MobileOrder = {
id: string;
order_number: number;
total_price: number;
items: CartItem[];
status: string;
created_at: string;
payment_status: "unpaid" | "paid";
cash_received: number;
change_amount: number;
};

type Receipt = {
orderNumber: number;
total: number;
cashReceived: number;
change: number;
};

export default function MobileOrderPage() {
const [unpaidOrders, setUnpaidOrders] = useState<MobileOrder[]>([]);
const [selectedOrder, setSelectedOrder] = useState<MobileOrder | null>(null);
const [cashReceived, setCashReceived] = useState("");
const [loading, setLoading] = useState(true);
const [processingPayment, setProcessingPayment] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const [receipt, setReceipt] = useState<Receipt | null>(null);

useEffect(() => {
loadUnpaidOrders();

const timer = window.setInterval(() => {
  loadUnpaidOrders();
}, 3000);

return () => {
  window.clearInterval(timer);
};

}, []);

async function loadUnpaidOrders() {
const { data, error } = await supabase
.from("orders")
.select(
"id, order_number, total_price, items, status, created_at, payment_status, cash_received, change_amount"
)
.eq("order_source", "mobile")
.eq("payment_status", "unpaid")
.neq("status", "cancelled")
.order("created_at", { ascending: true });

if (error) {
  console.error("未払いモバイル注文取得エラー:", error);
  setErrorMessage(
    "未払いのモバイル注文を取得できませんでした。"
  );
  setLoading(false);
  return;
}

const orders = (data ?? []) as MobileOrder[];

setUnpaidOrders(orders);
setLoading(false);

if (selectedOrder) {
  const latest = orders.find(
    (order) => order.id === selectedOrder.id
  );

  if (!latest) {
    setSelectedOrder(null);
    setCashReceived("");
  }
}

}

function selectOrder(order: MobileOrder) {
setSelectedOrder(order);
setCashReceived("");
setErrorMessage("");
}

function backToList() {
if (processingPayment) {
return;
}

setSelectedOrder(null);
setCashReceived("");
setErrorMessage("");

}

const paymentTotal = selectedOrder?.total_price ?? 0;
const paymentCash = Number(cashReceived) || 0;
const paymentChange = Math.max(
0,
paymentCash - paymentTotal
);

async function completePayment() {
if (processingPayment || !selectedOrder) {
return;
}

setErrorMessage("");

if (paymentCash < paymentTotal) {
  setErrorMessage("預かり金額が不足しています。");
  return;
}

if (paymentTotal <= 0) {
  setErrorMessage("会計金額が正しくありません。");
  return;
}

setProcessingPayment(true);

try {
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      cash_received: paymentCash,
      change_amount: paymentChange,
    })
    .eq("id", selectedOrder.id)
    .eq("payment_status", "unpaid");

  if (error) {
    console.error("モバイル注文会計エラー:", error);
    setErrorMessage(
      "支払い処理に失敗しました。もう一度お試しください。"
    );
    return;
  }

  setReceipt({
    orderNumber: selectedOrder.order_number,
    total: paymentTotal,
    cashReceived: paymentCash,
    change: paymentChange,
  });

  setSelectedOrder(null);
  setCashReceived("");

  await loadUnpaidOrders();
} catch (error) {
  console.error("支払い処理エラー:", error);
  setErrorMessage(
    "通信エラーが発生しました。支払いは確定していません。"
  );
} finally {
  setProcessingPayment(false);
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
            支払い完了
          </h1>

          <p className="mt-2 text-lg font-bold text-slate-700">
            モバイル注文の会計が完了しました
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
          未払い注文に戻る
        </button>
      </div>
    </div>
  </main>
);

}

if (selectedOrder) {
return (
<main className="min-h-screen bg-slate-100 p-4 md:p-8">
<div className="mx-auto max-w-2xl">
<header className="mb-5">
<button type="button" onClick={backToList} disabled={processingPayment} className="rounded-xl bg-white px-5 py-3 font-black text-slate-800 shadow-sm disabled:opacity-50" >
← 未払い注文に戻る
</button>
</header>

      <div className="rounded-3xl bg-white p-6 shadow-xl md:p-10">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-yellow-400 px-5 py-2 text-sm font-black text-yellow-950">
            🟨 モバイル注文
          </span>

          <p className="mt-5 text-sm font-black text-slate-600">
            整理番号
          </p>

          <p className="mt-1 text-6xl font-black tracking-widest text-slate-950 md:text-7xl">
            {String(selectedOrder.order_number).padStart(
              3,
              "0"
            )}
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-100 p-5">
          <p className="mb-4 text-sm font-black text-slate-600">
            注文内容
          </p>

          <div className="space-y-3">
            {selectedOrder.items.map((item, index) => (
              <div
                key={selectedOrder.id + "-" + index}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-lg font-black text-slate-950">
                  {item.name}
                </span>

                <span className="rounded-xl bg-white px-4 py-2 text-lg font-black text-slate-950">
                  × {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between border-t-2 border-slate-200 pt-5">
          <span className="text-lg font-black text-slate-700">
            合計
          </span>

          <span className="text-4xl font-black text-slate-950">
            ¥{paymentTotal.toLocaleString("ja-JP")}
          </span>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border-2 border-red-200 bg-red-50 p-4">
            <p className="font-black text-red-700">
              {errorMessage}
            </p>
          </div>
        ) : null}

        <div className="mt-6">
          <label
            htmlFor="mobile-payment-cash"
            className="mb-2 block text-lg font-black text-slate-800"
          >
            預かり金額
          </label>

          <input
            id="mobile-payment-cash"
            type="number"
            inputMode="numeric"
            min="0"
            value={cashReceived}
            onChange={(event) => {
              setCashReceived(event.target.value);
              setErrorMessage("");
            }}
            disabled={processingPayment}
            placeholder="例：2000"
            className="w-full rounded-2xl border-2 border-slate-300 bg-white px-5 py-5 text-2xl font-black text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div
          className={
            "mt-4 rounded-2xl p-5 " +
            (paymentCash >= paymentTotal && paymentTotal > 0
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
                (paymentCash >= paymentTotal &&
                paymentTotal > 0
                  ? "text-green-700"
                  : "text-slate-500")
              }
            >
              ¥{paymentChange.toLocaleString("ja-JP")}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={completePayment}
          disabled={
            processingPayment ||
            paymentTotal <= 0 ||
            paymentCash < paymentTotal
          }
          className="mt-5 w-full rounded-2xl bg-green-600 py-6 text-xl font-black text-white shadow-md transition hover:bg-green-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 md:text-2xl"
        >
          {processingPayment
            ? "支払い処理中..."
            : "支払済みにする"}
        </button>
      </div>
    </div>
  </main>
);

}

return (
<main className="min-h-screen bg-slate-100 p-3 sm:p-4 md:p-6">
<div className="mx-auto max-w-[1400px]">
<header className="mb-6">
<h1 className="text-3xl font-black text-slate-950 md:text-4xl">
モバイルオーダー
</h1>

      <p className="mt-2 text-base font-bold text-slate-700">
        お客様がスマホから注文した商品を、店頭で会計します。
      </p>
    </header>

    {errorMessage ? (
      <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 p-4">
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
    ) : null}

    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-950">
            未払いのモバイル注文
          </h2>

          <p className="mt-1 font-bold text-slate-600">
            商品完成後、お客様から現金を受け取ったら注文を選択してください。
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-yellow-800">
          {unpaidOrders.length} 件
        </span>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="font-black text-slate-600">
            未払い注文を読み込んでいます...
          </p>
        </div>
      ) : unpaidOrders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-xl font-black text-slate-600">
            未払いのモバイル注文はありません
          </p>

          <p className="mt-2 font-bold text-slate-500">
            新しいモバイル注文が入ると、ここに表示されます。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {unpaidOrders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => selectOrder(order)}
              className="rounded-3xl border-4 border-yellow-300 bg-yellow-50 p-5 text-left shadow-sm transition hover:bg-yellow-100 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-yellow-950">
                    🟨 未払い
                  </span>

                  <p className="mt-3 text-sm font-black text-slate-600">
                    整理番号
                  </p>

                  <p className="text-5xl font-black tracking-widest text-slate-950">
                    {String(order.order_number).padStart(
                      3,
                      "0"
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-slate-500">
                    合計
                  </p>

                  <p className="mt-1 text-2xl font-black text-slate-950">
                    ¥{order.total_price.toLocaleString("ja-JP")}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2 rounded-2xl bg-white p-4">
                {order.items.map((item, index) => (
                  <div
                    key={order.id + "-item-" + index}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="font-black text-slate-900">
                      {item.name}
                    </span>

                    <span className="font-black text-slate-700">
                      × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-yellow-400 py-4 text-center">
                <span className="text-lg font-black text-yellow-950">
                  この注文を会計する
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  </div>
</main>

);
}