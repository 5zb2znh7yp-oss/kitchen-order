"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type Order = {
id: string;
order_number: number;
created_at: string;
};

function formatTime(dateString: string) {
return new Date(dateString).toLocaleTimeString("ja-JP", {
hour: "2-digit",
minute: "2-digit",
});
}

export default function CallPage() {
const [orders, setOrders] = useState<Order[]>([]);
const [loading, setLoading] = useState(true);

const loadOrders = useCallback(async () => {
const { data, error } = await supabase
.from("orders")
.select("id, order_number, created_at")
.eq("status", "ready")
.order("created_at", { ascending: false });

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

const latestOrder = orders[0];
const otherOrders = orders.slice(1);

return (
<main className="min-h-screen bg-slate-950 px-4 py-6 md:px-8 md:py-10">
<div className="mx-auto max-w-[1900px]">
<header className="mb-8 text-center md:mb-10">
<p className="text-xl font-black tracking-widest text-green-400 md:text-2xl">
店舗からのお知らせ
</p>

      <h1 className="mt-2 text-5xl font-black tracking-wide text-white md:text-7xl">
        お呼出番号
      </h1>

      <p className="mt-3 text-lg font-bold text-slate-300 md:text-2xl">
        お料理が完成しました
      </p>
    </header>

    {loading ? (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="rounded-3xl bg-white px-10 py-12 text-center shadow-2xl">
          <p className="text-2xl font-black text-slate-800 md:text-3xl">
            読み込み中...
          </p>
        </div>
      </div>
    ) : orders.length === 0 ? (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 md:h-32 md:w-32">
            <span className="text-5xl md:text-6xl">
              ✓
            </span>
          </div>

          <p className="mt-8 text-3xl font-black text-white md:text-5xl">
            現在、お呼出番号はありません
          </p>

          <p className="mt-4 text-lg font-bold text-slate-400 md:text-2xl">
            料理が完成すると番号が表示されます
          </p>
        </div>
      </div>
    ) : (
      <>
        <section className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="bg-green-600 px-6 py-5 text-center md:px-10 md:py-7">
              <p className="text-2xl font-black text-white md:text-4xl">
                お呼出中
              </p>
            </div>

            <div className="px-6 py-10 text-center md:px-10 md:py-14">
              <p className="text-xl font-black text-slate-500 md:text-3xl">
                お呼出番号
              </p>

              <p className="mt-2 text-[7rem] font-black leading-none tracking-widest text-slate-950 md:text-[11rem]">
                {String(latestOrder.order_number).padStart(3, "0")}
              </p>

              <div className="mx-auto mt-8 max-w-2xl rounded-3xl bg-green-100 px-5 py-5 md:px-8 md:py-7">
                <p className="text-2xl font-black text-green-700 md:text-4xl">
                  お料理が完成しました
                </p>

                <p className="mt-2 text-base font-bold text-green-700/80 md:text-xl">
                  カウンターまでお越しください
                </p>
              </div>

              <p className="mt-5 text-base font-bold text-slate-500 md:text-lg">
                完成時刻 {formatTime(latestOrder.created_at)}
              </p>
            </div>
          </div>
        </section>

        {otherOrders.length > 0 && (
          <section className="mt-10">
            <div className="mb-5 text-center">
              <h2 className="text-2xl font-black text-white md:text-3xl">
                その他のお呼出番号
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {otherOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl bg-white p-6 text-center shadow-xl md:p-8"
                >
                  <p className="text-base font-black text-slate-500 md:text-lg">
                    お呼出番号
                  </p>

                  <p className="mt-2 text-6xl font-black tracking-widest text-slate-950 md:text-7xl">
                    {String(order.order_number).padStart(3, "0")}
                  </p>

                  <div className="mt-5 rounded-2xl bg-green-100 px-4 py-3">
                    <p className="text-lg font-black text-green-700 md:text-xl">
                      お料理完成
                    </p>
                  </div>

                  <p className="mt-3 text-sm font-bold text-slate-500 md:text-base">
                    {formatTime(order.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </>
    )}

    <footer className="mt-10 text-center md:mt-14">
      <p className="text-sm font-bold text-slate-500 md:text-base">
        自動更新中
      </p>
    </footer>
  </div>
</main>

);
}