"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  order_number: number;
  created_at: string;
};

export default function CallPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, created_at")
      .eq("status", "ready")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("呼出注文取得エラー:", error);
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

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-wide text-white md:text-6xl">
            お呼出番号
          </h1>

          <p className="mt-3 text-lg font-bold text-slate-300 md:text-2xl">
            お料理が完成しました
          </p>
        </header>

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center">
            <p className="text-2xl font-black text-slate-800">
              読み込み中...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-black text-slate-400 md:text-5xl">
                現在、お呼出番号はありません
              </p>

              <p className="mt-4 text-lg font-bold text-slate-500">
                料理が完成すると番号が表示されます
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl bg-white p-8 text-center shadow-2xl"
              >
                <p className="text-lg font-black text-slate-500 md:text-xl">
                  お呼出番号
                </p>

                <p className="mt-3 text-7xl font-black tracking-widest text-slate-950 md:text-8xl">
                  {String(order.order_number).padStart(3, "0")}
                </p>

                <div className="mt-6 rounded-2xl bg-green-100 px-4 py-3">
                  <p className="text-xl font-black text-green-700 md:text-2xl">
                    お料理が完成しました
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-sm font-bold text-slate-500 md:text-base">
            自動更新中
          </p>
        </div>
      </div>
    </main>
  );
}