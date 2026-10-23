"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
const router = useRouter();

const [staffName, setStaffName] = useState("");
const [password, setPassword] = useState("");
const [errorMessage, setErrorMessage] = useState("");
const [loading, setLoading] = useState(false);

async function handleLogin(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setErrorMessage("");

const name = staffName.trim();

if (!name) {
  setErrorMessage("スタッフ名を入力してください。");
  return;
}

if (!password) {
  setErrorMessage("パスワードを入力してください。");
  return;
}

setLoading(true);

try {
  const email = `${name}@staff.local`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    setErrorMessage(
      "スタッフ名またはパスワードが正しくありません。"
    );
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("display_name")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    setErrorMessage("スタッフ情報が見つかりません。");
    return;
  }

  router.replace("/");
} catch {
  setErrorMessage(
    "通信エラーが発生しました。時間をおいてもう一度お試しください。"
  );
} finally {
  setLoading(false);
}

}

return (
<main className="min-h-screen bg-slate-100 px-4 py-10">
<div className="mx-auto max-w-md">
<div className="rounded-3xl bg-white p-6 shadow-lg md:p-8">
<div className="mb-8 text-center">
<p className="text-sm font-bold text-slate-500">
店舗システム
</p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          スタッフログイン
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label
            htmlFor="staff-name"
            className="mb-2 block text-base font-black text-slate-800"
          >
            スタッフ名
          </label>

          <input
            id="staff-name"
            type="text"
            value={staffName}
            onChange={(event) => {
              setStaffName(event.target.value);
              setErrorMessage("");
            }}
            placeholder="例：山田"
            autoComplete="username"
            disabled={loading}
            className="w-full rounded-2xl border border-slate-300 px-4 py-4 text-lg font-bold outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-base font-black text-slate-800"
          >
            パスワード
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrorMessage("");
            }}
            placeholder="パスワードを入力"
            autoComplete="current-password"
            disabled={loading}
            className="w-full rounded-2xl border border-slate-300 px-4 py-4 text-lg font-bold outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-lg font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  </div>
</main>

);
}