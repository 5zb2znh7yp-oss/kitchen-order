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
cash_received: number;
change_amount: number;
status: OrderStatus;
items: OrderItem[];
created_at: string;
};

type ProductSales = {
name: string;
quantity: number;
sales: number;
};

function statusLabel(status: OrderStatus) {
switch (status) {
case "new":
return "新規";
case "cooking":
return "調理中";
case "ready":
return "完成";
case "completed":
return "呼出済み";
case "cancelled":
return "取消";
default:
return status;
}
}

function statusClass(status: OrderStatus) {
switch (status) {
case "new":
return "bg-blue-100 text-blue-700";
case "cooking":
return "bg-orange-100 text-orange-700";
case "ready":
return "bg-green-100 text-green-700";
case "completed":
return "bg-slate-100 text-slate-700";
case "cancelled":
return "bg-red-100 text-red-700";
default:
return "bg-slate-100 text-slate-700";
}
}

function formatTime(dateString: string) {
const timestamp = Date.parse(dateString);

if (Number.isNaN(timestamp)) {
return "--:--";
}

return new Intl.DateTimeFormat("ja-JP", {
hour: "2-digit",
minute: "2-digit",
}).format(timestamp);
}

function formatDateKey(dateString: string) {
const timestamp = Date.parse(dateString);

if (Number.isNaN(timestamp)) {
return "";
}

return new Intl.DateTimeFormat("ja-JP", {
year: "numeric",
month: "2-digit",
day: "2-digit",
})
.format(timestamp)
.replaceAll("/", "-");
}

function getTodayKey() {
const now = new Date();

return new Intl.DateTimeFormat("ja-JP", {
year: "numeric",
month: "2-digit",
day: "2-digit",
})
.format(now)
.replaceAll("/", "-");
}

export default function OrdersPage() {
const [orders, setOrders] = useState<Order[]>([]);
const [loading, setLoading] = useState(true);
const [selectedDate, setSelectedDate] = useState("");

const loadOrders = useCallback(async () => {
setLoading(true);

const { data, error } = await supabase
  .from("orders")
  .select(
    "id, order_number, total_price, cash_received, change_amount, status, items, created_at"
  )
  .order("created_at", { ascending: false });

if (error) {
  console.error("注文履歴取得エラー:", error);
  setLoading(false);
  return;
}

setOrders((data ?? []) as Order[]);
setLoading(false);

}, []);

useEffect(() => {
setSelectedDate(getTodayKey());
}, []);

useEffect(() => {
loadOrders();
}, [loadOrders]);

const selectedDateOrders = orders.filter(
(order) => formatDateKey(order.created_at) === selectedDate
);

const validSelectedDateOrders = selectedDateOrders.filter(
(order) => order.status !== "cancelled"
);

const cancelledSelectedDateOrders = selectedDateOrders.filter(
(order) => order.status === "cancelled"
);

const selectedDateSales = validSelectedDateOrders.reduce(
(sum, order) => sum + order.total_price,
0
);

const averageOrderValue =
validSelectedDateOrders.length > 0
? Math.round(
selectedDateSales / validSelectedDateOrders.length
)
: 0;

const productSalesMap: Record<string, ProductSales> = {};

validSelectedDateOrders.forEach((order) => {
order.items.forEach((item) => {
if (!productSalesMap[item.productId]) {
productSalesMap[item.productId] = {
name: item.name,
quantity: 0,
sales: 0,
};
}

  productSalesMap[item.productId].quantity += item.quantity;
  productSalesMap[item.productId].sales +=
    item.price * item.quantity;
});

});

const productSales = Object.values(productSalesMap).sort(
(a, b) => b.sales - a.sales
);

return (
<main className="min-h-screen bg-slate-100 p-4 md:p-6">
<div className="mx-auto max-w-[1600px]">
<header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
<div>
<h1 className="text-3xl font-black text-slate-900 md:text-4xl">
注文履歴・売上
</h1>

        <p className="mt-1 font-medium text-slate-700">
          日付を選択して注文と売上を確認できます。
        </p>
      </div>

      <button
        type="button"
        onClick={loadOrders}
        className="rounded-xl bg-slate-900 px-5 py-3 font-black text-white hover:bg-slate-800"
      >
        更新
      </button>
    </header>

    <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-slate-900">
            集計日
          </p>

          <p className="mt-1 text-sm font-medium text-slate-600">
            確認したい日付を選択してください。
          </p>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(event) =>
            setSelectedDate(event.target.value)
          }
          className="rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-lg font-black text-slate-900 outline-none focus:border-slate-900"
        />
      </div>
    </div>

    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="font-bold text-slate-600">
          {selectedDate} の注文数
        </p>

        <p className="mt-2 text-4xl font-black text-slate-900">
          {validSelectedDateOrders.length}
          <span className="ml-2 text-xl">件</span>
        </p>

        <p className="mt-2 text-sm font-bold text-slate-500">
          取消を除く
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="font-bold text-slate-600">
          {selectedDate} の売上
        </p>

        <p className="mt-2 text-4xl font-black text-slate-900">
          ¥{selectedDateSales.toLocaleString("ja-JP")}
        </p>

        <p className="mt-2 text-sm font-bold text-slate-500">
          取消を除く
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="font-bold text-slate-600">
          平均客単価
        </p>

        <p className="mt-2 text-4xl font-black text-slate-900">
          ¥{averageOrderValue.toLocaleString("ja-JP")}
        </p>

        <p className="mt-2 text-sm font-bold text-slate-500">
          1注文あたり
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="font-bold text-slate-600">
          取消件数
        </p>

        <p className="mt-2 text-4xl font-black text-red-600">
          {cancelledSelectedDateOrders.length}
          <span className="ml-2 text-xl">件</span>
        </p>

        <p className="mt-2 text-sm font-bold text-slate-500">
          売上には含まれません
        </p>
      </div>
    </div>

    <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-black text-slate-900">
          商品別売上
        </h2>

        <p className="mt-1 text-sm font-medium text-slate-600">
          選択した日の販売実績です。取消した注文は含まれていません。
        </p>
      </div>

      {productSales.length === 0 ? (
        <div className="p-8 text-center">
          <p className="font-bold text-slate-600">
            この日の商品売上はありません
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {productSales.map((product) => (
            <div
              key={product.name}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div>
                <p className="text-lg font-black text-slate-900">
                  {product.name}
                </p>

                <p className="mt-1 font-bold text-slate-600">
                  販売数 {product.quantity}個
                </p>
              </div>

              <p className="text-xl font-black text-slate-900">
                ¥{product.sales.toLocaleString("ja-JP")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>

    {loading ? (
      <div className="rounded-2xl bg-white p-12 text-center">
        <p className="text-lg font-bold text-slate-600">
          注文履歴を読み込んでいます...
        </p>
      </div>
    ) : selectedDateOrders.length === 0 ? (
      <div className="rounded-2xl bg-white p-12 text-center">
        <p className="text-lg font-bold text-slate-600">
          この日の注文履歴はありません
        </p>
      </div>
    ) : (
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-black text-slate-900">
            注文一覧
          </h2>
        </div>

        <div className="divide-y divide-slate-200">
          {selectedDateOrders.map((order) => (
            <div
              key={order.id}
              className="p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-wrap items-start gap-5">
                  <div>
                    <p className="text-sm font-bold text-slate-600">
                      整理番号
                    </p>

                    <p className="text-3xl font-black text-slate-900">
                      {String(order.order_number).padStart(3, "0")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-600">
                      受付時刻
                    </p>

                    <p className="text-lg font-black text-slate-800">
                      {formatTime(order.created_at)}
                    </p>
                  </div>

                  <span
                    className={
                      "rounded-full px-4 py-2 text-sm font-black " +
                      statusClass(order.status)
                    }
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-sm font-bold text-slate-600">
                    合計
                  </p>

                  <p className="text-2xl font-black text-slate-900">
                    ¥{order.total_price.toLocaleString("ja-JP")}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-black text-slate-600">
                    注文内容
                  </p>

                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={order.id + "-" + index}
                        className="flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-900">
                          {item.name}
                        </span>

                        <span className="font-black text-slate-900">
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-black text-slate-600">
                    会計
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">
                        合計
                      </span>

                      <span className="font-black text-slate-900">
                        ¥{order.total_price.toLocaleString("ja-JP")}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">
                        預かり
                      </span>

                      <span className="font-black text-slate-900">
                        ¥{order.cash_received.toLocaleString("ja-JP")}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="font-bold text-slate-700">
                        おつり
                      </span>

                      <span className="text-lg font-black text-slate-900">
                        ¥{order.change_amount.toLocaleString("ja-JP")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
</main>

);
}