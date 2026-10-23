"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type OrderItem = {
productId: string;
name: string;
price: number;
quantity: number;
};

type OrderStatus =
| "new"
| "cooking"
| "ready"
| "completed"
| "cancelled";

type Order = {
id: string;
order_number: number;
total_price: number;
items: OrderItem[];
status: OrderStatus;
created_at: string;
};

function formatTime(dateString: string) {
return new Date(dateString).toLocaleTimeString("ja-JP", {
hour: "2-digit",
minute: "2-digit",
});
}

export default function KitchenPage() {
const [orders, setOrders] = useState<Order[]>([]);
const [loading, setLoading] = useState(true);
const [updatingId, setUpdatingId] = useState<string | null>(null);

const loadOrders = useCallback(async () => {
const { data, error } = await supabase
.from("orders")
.select("id, order_number, total_price, items, status, created_at")
.in("status", ["new", "cooking", "ready"])
.order("created_at", { ascending: true });

if (error) {
  console.error("厨房注文取得エラー:", error);
  setLoading(false);
  return;
}

setOrders((data ?? []) as Order[]);
setLoading(false);

}, []);

useEffect(() => {
loadOrders();

const timer = window.setInterval(() => {
  loadOrders();
}, 3000);

return () => {
  window.clearInterval(timer);
};

}, [loadOrders]);

async function updateStatus(
orderId: string,
nextStatus: "cooking" | "ready" | "completed"
) {
setUpdatingId(orderId);

const { error } = await supabase
  .from("orders")
  .update({
    status: nextStatus,
  })
  .eq("id", orderId);

if (error) {
  console.error("注文ステータス更新エラー:", error);
  alert("注文状態を更新できませんでした。");
  setUpdatingId(null);
  return;
}

await loadOrders();
setUpdatingId(null);

}

async function cancelOrder(order: Order) {
const itemsText = order.items
.map((item) => `${item.name} × ${item.quantity}`)
.join("\n");


const message =
  `注文番号 ${String(order.order_number).padStart(3, "0")}\n\n` +
  `${itemsText}\n\n` +
  `合計 ¥${order.total_price.toLocaleString("ja-JP")}\n\n` +
  `この注文を取り消しますか？\n\n` +
  `取り消した注文は注文履歴には残りますが、売上には含まれません。`;

const confirmed = window.confirm(message);

if (!confirmed) {
  return;
}

setUpdatingId(order.id);

const { error } = await supabase
  .from("orders")
  .update({
    status: "cancelled",
  })
  .eq("id", order.id);

if (error) {
  console.error("注文取消しエラー:", error);
  alert("注文を取り消せませんでした。");
  setUpdatingId(null);
  return;
}

setOrders((currentOrders) =>
  currentOrders.filter(
    (currentOrder) => currentOrder.id !== order.id
  )
);

setUpdatingId(null);

}

const newOrders = orders.filter(
(order) => order.status === "new"
);

const cookingOrders = orders.filter(
(order) => order.status === "cooking"
);

const readyOrders = orders.filter(
(order) => order.status === "ready"
);

return (
<main className="min-h-screen bg-slate-100 p-3 sm:p-4 md:p-5">
<div className="mx-auto max-w-[1900px]">
<header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
<div>
<h1 className="text-3xl font-black text-slate-950 md:text-4xl">
厨房
</h1>

        <p className="mt-1 text-base font-bold text-slate-700">
          注文を確認して調理状態を更新してください。
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white px-5 py-3 shadow-sm">
          <p className="text-sm font-black text-slate-600">
            表示中
          </p>

          <p className="text-3xl font-black text-slate-950">
            {orders.length}
            <span className="ml-1 text-base">
              件
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="rounded-2xl bg-slate-950 px-6 py-4 text-lg font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
        >
          更新
        </button>
      </div>
    </header>

    {loading ? (
      <div className="rounded-3xl bg-white p-14 text-center shadow-sm">
        <p className="text-xl font-black text-slate-700">
          注文を読み込んでいます...
        </p>
      </div>
    ) : (
      <div className="grid gap-5 xl:grid-cols-3">
        <KitchenColumn
          title="新規"
          subtitle="これから調理"
          count={newOrders.length}
          orders={newOrders}
          headerClass="bg-blue-600"
          countClass="text-blue-700"
          buttonText="調理開始"
          buttonClass="bg-blue-600 hover:bg-blue-700"
          nextStatus="cooking"
          updatingId={updatingId}
          onUpdate={updateStatus}
          onCancel={cancelOrder}
        />

        <KitchenColumn
          title="調理中"
          subtitle="現在調理中"
          count={cookingOrders.length}
          orders={cookingOrders}
          headerClass="bg-orange-500"
          countClass="text-orange-700"
          buttonText="調理完了"
          buttonClass="bg-orange-500 hover:bg-orange-600"
          nextStatus="ready"
          updatingId={updatingId}
          onUpdate={updateStatus}
          onCancel={cancelOrder}
        />

        <KitchenColumn
          title="完成"
          subtitle="お客様を呼出"
          count={readyOrders.length}
          orders={readyOrders}
          headerClass="bg-green-600"
          countClass="text-green-700"
          buttonText="呼出済みにする"
          buttonClass="bg-green-600 hover:bg-green-700"
          nextStatus="completed"
          updatingId={updatingId}
          onUpdate={updateStatus}
          onCancel={cancelOrder}
        />
      </div>
    )}
  </div>
</main>

);
}

function KitchenColumn({
title,
subtitle,
count,
orders,
headerClass,
countClass,
buttonText,
buttonClass,
nextStatus,
updatingId,
onUpdate,
onCancel,
}: {
title: string;
subtitle: string;
count: number;
orders: Order[];
headerClass: string;
countClass: string;
buttonText: string;
buttonClass: string;
nextStatus: "cooking" | "ready" | "completed";
updatingId: string | null;
onUpdate: (
orderId: string,
nextStatus: "cooking" | "ready" | "completed"
) => void;
onCancel: (order: Order) => void;
}) {
return (
<section className="overflow-hidden rounded-3xl bg-white shadow-sm">
<div className={headerClass + " px-5 py-5 text-white md"}>
<div className="flex items-center justify-between">
<div>
<h2 className="text-3xl font-black md:text-4xl">
{title}
</h2>

        <p className="mt-1 text-base font-bold text-white/90">
          {subtitle}
        </p>
      </div>

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white md:h-18 md:w-18">
        <span
          className={"text-3xl font-black " + countClass}
        >
          {count}
        </span>
      </div>
    </div>
  </div>

  <div className="min-h-[500px] space-y-4 bg-slate-50 p-4 md:p-5">
    {orders.length === 0 ? (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white">
        <div className="text-center">
          <p className="text-xl font-black text-slate-600">
            注文はありません
          </p>

          <p className="mt-2 font-bold text-slate-500">
            新しい注文を待っています
          </p>
        </div>
      </div>
    ) : (
      orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          buttonText={buttonText}
          buttonClass={buttonClass}
          nextStatus={nextStatus}
          updatingId={updatingId}
          onUpdate={onUpdate}
          onCancel={onCancel}
        />
      ))
    )}
  </div>
</section>

);
}

function OrderCard({
order,
buttonText,
buttonClass,
nextStatus,
updatingId,
onUpdate,
onCancel,
}: {
order: Order;
buttonText: string;
buttonClass: string;
nextStatus: "cooking" | "ready" | "completed";
updatingId: string | null;
onUpdate: (
orderId: string,
nextStatus: "cooking" | "ready" | "completed"
) => void;
onCancel: (order: Order) => void;
}) {
return (
<div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm md:p-6">
<div className="flex items-start justify-between gap-4">
<div>
<p className="text-sm font-black text-slate-600 md:text-base">
整理番号
</p>

      <p className="mt-1 text-6xl font-black tracking-widest text-slate-950 md:text-7xl">
        {String(order.order_number).padStart(3, "0")}
      </p>
    </div>

    <div className="text-right">
      <p className="text-sm font-black text-slate-500">
        受付
      </p>

      <p className="mt-1 text-xl font-black text-slate-800 md:text-2xl">
        {formatTime(order.created_at)}
      </p>
    </div>
  </div>

  <div className="my-5 border-t-2 border-slate-100" />

  <div className="rounded-2xl bg-slate-100 p-4 md:p-5">
    <p className="mb-4 text-sm font-black text-slate-600 md:text-base">
      注文内容
    </p>

    <div className="space-y-3">
      {order.items.map((item, index) => (
        <div
          key={order.id + "-" + index}
          className="flex items-center justify-between gap-3"
        >
          <span className="min-w-0 text-xl font-black text-slate-950 md:text-2xl">
            {item.name}
          </span>

          <span className="shrink-0 rounded-xl bg-white px-4 py-2 text-xl font-black text-slate-950 shadow-sm md:text-2xl">
            × {item.quantity}
          </span>
        </div>
      ))}
    </div>
  </div>

  <div className="mt-4 flex items-center justify-between">
    <span className="text-base font-bold text-slate-600">
      合計
    </span>

    <span className="text-2xl font-black text-slate-950">
      ¥{order.total_price.toLocaleString("ja-JP")}
    </span>
  </div>

  <button
    type="button"
    onClick={() => onUpdate(order.id, nextStatus)}
    disabled={updatingId === order.id}
    className={
      "mt-5 min-h-[68px] w-full rounded-2xl py-5 text-2xl font-black text-white shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:min-h-[76px] md:text-3xl " +
      buttonClass
    }
  >
    {updatingId === order.id
      ? "更新中..."
      : buttonText}
  </button>

  <button
    type="button"
    onClick={() => onCancel(order)}
    disabled={updatingId === order.id}
    className="mt-3 min-h-[52px] w-full rounded-2xl border-2 border-red-300 bg-white py-3 text-lg font-black text-red-600 transition hover:bg-red-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
  >
    注文取消し
  </button>
</div>

);
}