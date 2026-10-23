"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type Staff = {
id: string;
display_name: string;
created_at: string;
};

type LoggedInStaff = {
id: string;
displayName: string;
};

export default function StaffPage() {
const router = useRouter();

const [staff, setStaff] = useState<Staff[]>([]);
const [loggedInStaff, setLoggedInStaff] =
useState<LoggedInStaff | null>(null);
const [selectedStaffId, setSelectedStaffId] = useState("");
const [displayName, setDisplayName] = useState("");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [switching, setSwitching] = useState(false);
const [message, setMessage] = useState("");
const [errorMessage, setErrorMessage] = useState("");

useEffect(() => {
loadStaff();
loadLoggedInStaff();
}, []);

async function loadStaff() {
setLoading(true);
setErrorMessage("");

const { data, error } = await supabase
  .from("staff_profiles")
  .select("id, display_name, created_at")
  .order("display_name");

if (error) {
  console.error("スタッフ取得エラー:", error);
  setErrorMessage("スタッフ情報を読み込めませんでした。");
  setLoading(false);
  return;
}

setStaff(data ?? []);
setLoading(false);

}

function loadLoggedInStaff() {
const savedStaff = localStorage.getItem("kitchen-order-staff");

if (!savedStaff) {
  setLoggedInStaff(null);
  return;
}

try {
  const parsedStaff = JSON.parse(savedStaff);

  if (parsedStaff.id && parsedStaff.displayName) {
    setLoggedInStaff({
      id: parsedStaff.id,
      displayName: parsedStaff.displayName,
    });

    setSelectedStaffId(parsedStaff.id);
  } else {
    localStorage.removeItem("kitchen-order-staff");
    setLoggedInStaff(null);
  }
} catch (error) {
  console.error("ログインスタッフ情報の読み込みに失敗しました:", error);
  localStorage.removeItem("kitchen-order-staff");
  setLoggedInStaff(null);
}

}

async function handleRegister(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

const trimmedName = displayName.trim();

if (!trimmedName) {
  setErrorMessage("スタッフ名を入力してください。");
  return;
}

setSaving(true);
setMessage("");
setErrorMessage("");

const { error } = await supabase
  .from("staff_profiles")
  .insert({
    display_name: trimmedName,
  });

if (error) {
  console.error("スタッフ登録エラー:", error);

  if (error.code === "23505") {
    setErrorMessage("同じ名前のスタッフがすでに登録されています。");
  } else {
    setErrorMessage("スタッフ登録に失敗しました。");
  }

  setSaving(false);
  return;
}

setDisplayName("");
setMessage("スタッフを登録しました。");

await loadStaff();
setSaving(false);

}

function handleSwitchStaff() {
setMessage("");
setErrorMessage("");

if (!selectedStaffId) {
  setErrorMessage("スタッフを選択してください。");
  return;
}

const selectedStaff = staff.find(
  (person) => person.id === selectedStaffId
);

if (!selectedStaff) {
  setErrorMessage("スタッフ情報が見つかりません。");
  return;
}

setSwitching(true);

const newLoggedInStaff = {
  id: selectedStaff.id,
  displayName: selectedStaff.display_name,
};

localStorage.setItem(
  "kitchen-order-staff",
  JSON.stringify(newLoggedInStaff)
);

setLoggedInStaff(newLoggedInStaff);

setSwitching(false);

router.push("/");

}

return (
<main className="min-h-screen bg-slate-100 px-4 py-6 md:px-6">
<div className="mx-auto max-w-5xl">
<div className="mb-6">
<p className="text-sm font-bold text-slate-500">Store System</p>

      <h1 className="mt-1 text-3xl font-black text-slate-900">
        スタッフ管理
      </h1>
    </div>

    {message && (
      <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700">
        {message}
      </div>
    )}

    {errorMessage && (
      <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
        {errorMessage}
      </div>
    )}

    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-black text-slate-500">
          現在ログイン中のスタッフ
        </p>

        <div className="mt-4 rounded-2xl bg-slate-900 p-5 text-white">
          {loggedInStaff ? (
            <>
              <p className="text-2xl font-black">
                {loggedInStaff.displayName}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-300">
                現在このスタッフで注文を受け付けています
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-black">未ログイン</p>

              <p className="mt-1 text-sm font-bold text-slate-300">
                下のスタッフ切り替えから選択してください
              </p>
            </>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">
          スタッフを切り替える
        </h2>

        <p className="mt-2 text-sm font-bold text-slate-500">
          登録されているスタッフから選択してください。
        </p>

        <select
          value={selectedStaffId}
          onChange={(event) => {
            setSelectedStaffId(event.target.value);
            setMessage("");
            setErrorMessage("");
          }}
          className="mt-5 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-4 text-lg font-black text-slate-900 outline-none focus:border-slate-900"
        >
          <option value="">スタッフを選択</option>

          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.display_name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSwitchStaff}
          disabled={!selectedStaffId || switching}
          className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-4 text-lg font-black text-white hover:bg-slate-800 disabled:bg-slate-300"
        >
          {switching ? "切り替え中..." : "このスタッフでログイン"}
        </button>
      </section>
    </div>

    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            登録されているスタッフ
          </h2>

          <p className="mt-1 text-sm font-bold text-slate-500">
            {staff.length}人登録されています
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl bg-slate-100 p-6 text-center">
          <p className="font-bold text-slate-600">
            スタッフ情報を読み込んでいます...
          </p>
        </div>
      ) : staff.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-100 p-6 text-center">
          <p className="font-bold text-slate-600">
            登録されているスタッフはいません。
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((person) => {
            const isLoggedIn = loggedInStaff?.id === person.id;

            return (
              <button
                key={person.id}
                type="button"
                onClick={() => setSelectedStaffId(person.id)}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  selectedStaffId === person.id
                    ? "border-slate-900 bg-slate-100"
                    : "border-slate-200 bg-white hover:border-slate-400"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black text-slate-900">
                    {person.display_name}
                  </span>

                  {isLoggedIn && (
                    <span className="whitespace-nowrap rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                      ログイン中
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>

    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">
        新しいスタッフを登録
      </h2>

      <form
        onSubmit={handleRegister}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="スタッフ名を入力"
          className="flex-1 rounded-2xl border-2 border-slate-300 px-4 py-4 font-bold outline-none focus:border-slate-900"
        />

        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-slate-900 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:bg-slate-300"
        >
          {saving ? "登録中..." : "スタッフを登録"}
        </button>
      </form>
    </section>
  </div>
</main>

);
}