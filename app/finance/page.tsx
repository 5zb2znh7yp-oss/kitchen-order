"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Order = {
total_price: number;
status: string;
};

type FinanceSettings = {
id: number;
initial_funds: number;
};

type MaterialCostItem = {
id: string;
name: string;
amount: number;
created_at: string;
};

type StaffProfile = {
id: string;
display_name: string;
is_owner: boolean;
can_manage_finance: boolean;
};

type LoggedInStaff = {
id: string;
displayName: string;
};

export default function FinancePage() {
const router = useRouter();

const [checkingPermission, setCheckingPermission] = useState(true);
const [hasPermission, setHasPermission] = useState(false);

const [initialFunds, setInitialFunds] = useState(0);
const [initialFundsInput, setInitialFundsInput] = useState("");

const [totalSales, setTotalSales] = useState(0);

const [materialCostItems, setMaterialCostItems] = useState<MaterialCostItem[]>([]);
const [materialCost, setMaterialCost] = useState(0);

const [materialNameInput, setMaterialNameInput] = useState("");
const [materialAmountInput, setMaterialAmountInput] = useState("");

const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

const [savingFunds, setSavingFunds] = useState(false);
const [savingMaterial, setSavingMaterial] = useState(false);

useEffect(() => {
async function checkPermission() {
const savedStaff = localStorage.getItem("kitchen-order-staff");

  if (!savedStaff) {
    router.replace("/");
    return;
  }

  let loggedInStaff: LoggedInStaff;

  try {
    const parsedStaff = JSON.parse(savedStaff);

    if (!parsedStaff.id || !parsedStaff.displayName) {
      localStorage.removeItem("kitchen-order-staff");
      router.replace("/");
      return;
    }

    loggedInStaff = {
      id: parsedStaff.id,
      displayName: parsedStaff.displayName,
    };
  } catch (error) {
    console.error("ログインスタッフ情報の読み込みに失敗しました:", error);
    localStorage.removeItem("kitchen-order-staff");
    router.replace("/");
    return;
  }

  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, display_name, is_owner, can_manage_finance")
    .eq("id", loggedInStaff.id)
    .maybeSingle();

  if (error) {
    console.error("スタッフ権限確認エラー:", error);
    window.alert("スタッフ権限を確認できませんでした。");
    router.replace("/");
    return;
  }

  if (!data) {
    window.alert("スタッフ情報が見つかりません。");
    router.replace("/");
    return;
  }

  const staff = data as StaffProfile;

  if (!staff.is_owner && !staff.can_manage_finance) {
    window.alert("資金管理を利用する権限がありません。");
    router.replace("/");
    return;
  }

  setHasPermission(true);
  setCheckingPermission(false);
}

checkPermission();

}, [router]);

async function loadFinanceSettings() {
const { data, error } = await supabase
.from("finance_settings")
.select("id, initial_funds")
.eq("id", 1)
.maybeSingle();

if (error) {
  console.error("資金設定読み込みエラー:", error);
  return;
}

if (data) {
  const settings = data as FinanceSettings;
  setInitialFunds(settings.initial_funds);
  setInitialFundsInput(String(settings.initial_funds));
}

}

async function loadSales() {
const { data, error } = await supabase
.from("orders")
.select("total_price, status");

if (error) {
  console.error("売上読み込みエラー:", error);
  return;
}

const orders = (data ?? []) as Order[];

const sales = orders
  .filter((order) => order.status !== "cancelled")
  .reduce(
    (sum, order) => sum + Number(order.total_price || 0),
    0
  );

setTotalSales(sales);

}

async function loadMaterialCostItems() {
const { data, error } = await supabase
.from("material_cost_items")
.select("id, name, amount, created_at")
.order("created_at", { ascending: true });

if (error) {
  console.error("材料費内訳読み込みエラー:", error);
  return;
}

const items = (data ?? []) as MaterialCostItem[];

setMaterialCostItems(items);

const total = items.reduce(
  (sum, item) => sum + Number(item.amount || 0),
  0
);

setMaterialCost(total);

}

async function loadAll() {
await Promise.all([
loadFinanceSettings(),
loadSales(),
loadMaterialCostItems(),
]);
}

useEffect(() => {
if (!hasPermission) {
return;
}

loadAll();

}, [hasPermission]);

async function saveInitialFunds() {
const value = Number(initialFundsInput);

if (!Number.isInteger(value) || value < 0) {
  window.alert("もともとの資金は0円以上の整数で入力してください。");
  return;
}

setSavingFunds(true);

const { error } = await supabase
  .from("finance_settings")
  .update({
    initial_funds: value,
    updated_at: new Date().toISOString(),
  })
  .eq("id", 1);

if (error) {
  console.error("もともとの資金保存エラー:", error);
  window.alert("もともとの資金を保存できませんでした。");
  setSavingFunds(false);
  return;
}

setInitialFunds(value);
setSavingFunds(false);

window.alert("もともとの資金を保存しました。");

}

async function saveMaterialCostItem() {
const name = materialNameInput.trim();
const amount = Number(materialAmountInput);

if (!name) {
  window.alert("材料費名を入力してください。");
  return;
}

if (!Number.isInteger(amount) || amount < 0) {
  window.alert("材料費は0円以上の整数で入力してください。");
  return;
}

setSavingMaterial(true);

if (editingMaterialId) {
  const { error } = await supabase
    .from("material_cost_items")
    .update({
      name,
      amount,
    })
    .eq("id", editingMaterialId);

  if (error) {
    console.error("材料費内訳更新エラー:", error);
    window.alert("材料費内訳を更新できませんでした。");
    setSavingMaterial(false);
    return;
  }
} else {
  const { error } = await supabase
    .from("material_cost_items")
    .insert({
      name,
      amount,
    });

  if (error) {
    console.error("材料費内訳登録エラー:", error);
    window.alert("材料費内訳を登録できませんでした。");
    setSavingMaterial(false);
    return;
  }
}

setMaterialNameInput("");
setMaterialAmountInput("");
setEditingMaterialId(null);
setSavingMaterial(false);

await loadMaterialCostItems();

}

function startEditMaterial(item: MaterialCostItem) {
setEditingMaterialId(item.id);
setMaterialNameInput(item.name);
setMaterialAmountInput(String(item.amount));
}

function cancelEditMaterial() {
setEditingMaterialId(null);
setMaterialNameInput("");
setMaterialAmountInput("");
}

async function deleteMaterialCostItem(item: MaterialCostItem) {
const confirmed = window.confirm(
item.name + " の材料費内訳を削除しますか？"
);

if (!confirmed) {
  return;
}

const { error } = await supabase
  .from("material_cost_items")
  .delete()
  .eq("id", item.id);

if (error) {
  console.error("材料費内訳削除エラー:", error);
  window.alert("材料費内訳を削除できませんでした。");
  return;
}

if (editingMaterialId === item.id) {
  cancelEditMaterial();
}

await loadMaterialCostItems();

}

if (checkingPermission) {
return (
<main className="min-h-screen bg-slate-100 p-6 text-slate-900">
<div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-center shadow-sm">
<p className="text-lg font-black">
資金管理の権限を確認しています...
</p>
</div>
</main>
);
}

if (!hasPermission) {
return null;
}

const increasedFunds = totalSales - materialCost;
const currentFunds = initialFunds + increasedFunds;

const increaseRate =
initialFunds > 0
? Math.min(100, Math.max(0, (increasedFunds / initialFunds) * 100))
: increasedFunds > 0
? 100
: 0;

return (
<main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
<div className="mx-auto max-w-7xl">
<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
<div>
<h1 className="text-3xl font-black text-slate-900">
資金管理
</h1>

        <p className="mt-1 font-medium text-slate-600">
          売上と材料費から現在の資金を確認できます。
        </p>
      </div>

      <button
        type="button"
        onClick={loadAll}
        className="rounded-xl bg-white px-5 py-3 font-black text-slate-800 shadow-sm hover:bg-slate-50"
      >
        更新
      </button>
    </div>

    <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">
        もともとの資金
      </h2>

      <p className="mt-1 text-sm font-medium text-slate-500">
        開始時点で持っていた資金を入力してください。
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2">
          <span className="text-xl font-black text-slate-700">
            ¥
          </span>

          <input
            type="number"
            min="0"
            step="1"
            value={initialFundsInput}
            onChange={(event) =>
              setInitialFundsInput(event.target.value)
            }
            className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-xl font-black text-slate-900 outline-none focus:border-slate-900"
          />
        </div>

        <button
          type="button"
          onClick={saveInitialFunds}
          disabled={savingFunds}
          className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {savingFunds ? "保存中..." : "保存"}
        </button>
      </div>
    </section>

    <section className="mb-6 rounded-2xl bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-2xl font-black text-slate-900">
          材料費の内訳
        </h2>

        <p className="mt-1 text-sm font-medium text-slate-500">
          材料ごとの金額を登録すると、材料費合計が自動計算されます。
        </p>

        <p className="mt-3 text-2xl font-black text-red-600">
          合計 ¥{materialCost.toLocaleString("ja-JP")}
        </p>
      </div>

      <div className="p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto]">
          <input
            type="text"
            value={materialNameInput}
            onChange={(event) =>
              setMaterialNameInput(event.target.value)
            }
            placeholder="材料費名"
            className="rounded-xl border-2 border-slate-300 px-4 py-3 font-bold text-slate-900 outline-none focus:border-slate-900"
          />

          <div className="flex items-center gap-2">
            <span className="font-black text-slate-700">
              ¥
            </span>

            <input
              type="number"
              min="0"
              step="1"
              value={materialAmountInput}
              onChange={(event) =>
                setMaterialAmountInput(event.target.value)
              }
              placeholder="金額"
              className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 font-bold text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          <button
            type="button"
            onClick={saveMaterialCostItem}
            disabled={savingMaterial}
            className="rounded-xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {savingMaterial
              ? "保存中..."
              : editingMaterialId
                ? "更新"
                : "追加"}
          </button>

          {editingMaterialId ? (
            <button
              type="button"
              onClick={cancelEditMaterial}
              disabled={savingMaterial}
              className="rounded-xl bg-slate-200 px-5 py-3 font-black text-slate-800 hover:bg-slate-300"
            >
              キャンセル
            </button>
          ) : (
            <div />
          )}
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          {materialCostItems.length === 0 ? (
            <p className="p-5 text-center font-bold text-slate-500">
              材料費の登録はまだありません。
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {materialCostItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-black text-slate-900">
                      {item.name}
                    </p>

                    <p className="text-sm font-bold text-slate-500">
                      ¥{item.amount.toLocaleString("ja-JP")}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditMaterial(item)}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-200"
                    >
                      編集
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteMaterialCostItem(item)}
                      className="rounded-lg bg-red-100 px-3 py-2 text-sm font-black text-red-700 hover:bg-red-200"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-bold text-slate-600">
          もともとの資金
        </p>

        <p className="mt-2 text-3xl font-black text-slate-900">
          ¥{initialFunds.toLocaleString("ja-JP")}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-bold text-slate-600">
          総売上
        </p>

        <p className="mt-2 text-3xl font-black text-slate-900">
          ¥{totalSales.toLocaleString("ja-JP")}
        </p>

        <p className="mt-1 text-xs font-bold text-slate-500">
          キャンセル済み注文を除外
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-bold text-slate-600">
          増えた金額
        </p>

        <p
          className={
            "mt-2 text-3xl font-black " +
            (increasedFunds >= 0
              ? "text-green-600"
              : "text-red-600")
          }
        >
          ¥{increasedFunds.toLocaleString("ja-JP")}
        </p>

        <p className="mt-1 text-xs font-bold text-slate-500">
          売上 − 材料費
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-5 shadow-sm">
        <p className="font-bold text-slate-300">
          現在の資金
        </p>

        <p className="mt-2 text-3xl font-black text-white">
          ¥{currentFunds.toLocaleString("ja-JP")}
        </p>

        <p className="mt-1 text-xs font-bold text-slate-400">
          もともとの資金 + 増えた金額
        </p>
      </div>
    </section>

    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            資金の増加状況
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-500">
            もともとの資金から、どれだけ増えたかを表示しています。
          </p>
        </div>

        <p
          className={
            "text-2xl font-black " +
            (increasedFunds >= 0
              ? "text-green-600"
              : "text-red-600")
          }
        >
          ¥{increasedFunds.toLocaleString("ja-JP")}
        </p>
      </div>

      <div className="mt-5 h-5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{
            width: increaseRate + "%",
          }}
        />
      </div>
    </section>
  </div>
</main>

);
}