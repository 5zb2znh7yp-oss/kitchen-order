"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type Product = {
id: string;
name: string;
price: number;
is_active: boolean;
created_at: string;
};

export default function ProductsPage() {
const [products, setProducts] = useState<Product[]>([]);
const [name, setName] = useState("");
const [price, setPrice] = useState("");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

const loadProducts = useCallback(async () => {
const { data, error } = await supabase
.from("products")
.select("id, name, price, is_active, created_at")
.order("created_at", { ascending: true });

if (error) {
  console.error("商品取得エラー:", error);
  alert("商品を取得できませんでした。");
  setLoading(false);
  return;
}

setProducts((data ?? []) as Product[]);
setLoading(false);

}, []);

useEffect(() => {
loadProducts();
}, [loadProducts]);

async function addProduct() {
const trimmedName = name.trim();
const numericPrice = Number(price);

if (!trimmedName) {
  alert("商品名を入力してください。");
  return;
}

if (!Number.isInteger(numericPrice) || numericPrice < 0) {
  alert("価格は0円以上の整数で入力してください。");
  return;
}

setSaving(true);

const { error } = await supabase.from("products").insert({
  name: trimmedName,
  price: numericPrice,
  is_active: true,
});

if (error) {
  console.error("商品追加エラー:", error);
  alert("商品を追加できませんでした。");
  setSaving(false);
  return;
}

setName("");
setPrice("");
await loadProducts();
setSaving(false);

}

async function toggleProduct(product: Product) {
const { error } = await supabase
.from("products")
.update({
is_active: !product.is_active,
})
.eq("id", product.id);

if (error) {
  console.error("販売状態変更エラー:", error);
  alert("販売状態を変更できませんでした。");
  return;
}

await loadProducts();

}

async function editProduct(product: Product) {
const newName = window.prompt(
"商品名を入力してください。",
product.name
);

if (newName === null) {
  return;
}

const trimmedName = newName.trim();

if (!trimmedName) {
  alert("商品名を空にすることはできません。");
  return;
}

const newPriceText = window.prompt(
  "価格を入力してください。",
  String(product.price)
);

if (newPriceText === null) {
  return;
}

const newPrice = Number(newPriceText);

if (!Number.isInteger(newPrice) || newPrice < 0) {
  alert("価格は0円以上の整数で入力してください。");
  return;
}

const { error } = await supabase
  .from("products")
  .update({
    name: trimmedName,
    price: newPrice,
  })
  .eq("id", product.id);

if (error) {
  console.error("商品編集エラー:", error);
  alert("商品を変更できませんでした。");
  return;
}

await loadProducts();

}

async function deleteProduct(product: Product) {
const confirmed = window.confirm("商品を削除しますか？");

if (!confirmed) {
  return;
}

const { error } = await supabase
  .from("products")
  .delete()
  .eq("id", product.id);

if (error) {
  console.error("商品削除エラー:", error);
  alert("商品を削除できませんでした。");
  return;
}

await loadProducts();

}

return (
<main className="min-h-screen bg-gray-50 p-6 text-gray-900">
<div className="mx-auto max-w-5xl">
<div className="mb-8">
<h1 className="text-3xl font-black text-gray-900">
商品管理
</h1>

      <p className="mt-2 text-base font-medium text-gray-700">
        注文画面で使用する商品を管理します。
      </p>
    </div>

    <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-black text-gray-900">
        商品を追加
      </h2>

      <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="商品名"
          className="rounded-xl border border-gray-300 px-4 py-3 text-base font-medium text-gray-900 outline-none placeholder:text-gray-500 focus:border-black"
        />

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="価格"
          min="0"
          step="1"
          className="rounded-xl border border-gray-300 px-4 py-3 text-base font-medium text-gray-900 outline-none placeholder:text-gray-500 focus:border-black"
        />

        <button
          type="button"
          onClick={addProduct}
          disabled={saving}
          className="rounded-xl bg-black px-6 py-3 font-bold text-white disabled:opacity-50"
        >
          {saving ? "追加中..." : "商品を追加"}
        </button>
      </div>
    </section>

    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">
          商品一覧
        </h2>

        <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-900">
          {products.length}件
        </span>
      </div>

      {loading ? (
        <div className="py-10 text-center text-base font-bold text-gray-700">
          読み込み中...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-10 text-center text-base font-bold text-gray-700">
          商品が登録されていません。
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-300 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-gray-900">
                    {product.name}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      product.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {product.is_active
                      ? "販売中"
                      : "販売停止"}
                  </span>
                </div>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  ¥{product.price.toLocaleString("ja-JP")}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => editProduct(product)}
                  className="rounded-lg border border-gray-400 bg-white px-4 py-2 font-bold text-gray-900 hover:bg-gray-100"
                >
                  編集
                </button>

                <button
                  type="button"
                  onClick={() => toggleProduct(product)}
                  className="rounded-lg border border-gray-400 bg-white px-4 py-2 font-bold text-gray-900 hover:bg-gray-100"
                >
                  {product.is_active
                    ? "販売停止"
                    : "販売再開"}
                </button>

                <button
                  type="button"
                  onClick={() => deleteProduct(product)}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 font-bold text-red-700 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  </div>
</main>

);
}