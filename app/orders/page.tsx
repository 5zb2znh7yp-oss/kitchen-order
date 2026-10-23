"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderStatus = "new" | "cooking" | "ready" | "completed";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayKey, setTodayKey] = useState("");

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
    const now = new Date();

    const key = new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(now)
      .replaceAll("/", "-");

    setTodayKey(key);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const todayOrders = orders.filter(
    (order) => formatDateKey(order.created_at) === todayKey
  );

  const todaySales = todayOrders.reduce(
    (sum, order) => sum + order.total_price,
    0
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
              これまでの注文と売上を確認できます。
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

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-600">
              本日の注文数
            </p>

            <p className="mt-2 text-4xl font-black text-slate-900">
              {todayOrders.length}
              <span className="ml-2 text-xl">
                件
              </span>
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-600">
              本日の売上
            </p>

            <p className="mt-2 text-4xl font-black text-slate-900">
              ¥{todaySales.toLocaleString("ja-JP")}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center">
            <p className="text-lg font-bold text-slate-600">
              注文履歴を読み込んでいます...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center">
            <p className="text-lg font-bold text-slate-600">
              注文履歴はありません
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
              {orders.map((order) => (
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

