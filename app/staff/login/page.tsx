"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type Staff = {
  id: string;
  display_name: string;
};

export default function StaffLoginPage() {
  const router = useRouter();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("staff_profiles")
      .select("id, display_name")
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

  function handleLogin() {
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

    localStorage.setItem(
      "kitchen-order-staff",
      JSON.stringify({
        id: selectedStaff.id,
        displayName: selectedStaff.display_name,
      })
    );

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-3xl bg-white p-6 shadow-lg md:p-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-bold text-slate-500">
              Store System
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Staff Login
            </h1>

            <p className="mt-3 text-sm font-bold text-slate-500">
              スタッフ名を選択してください
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-slate-100 p-6 text-center">
              <p className="font-bold text-slate-600">
                スタッフ情報を読み込んでいます...
              </p>
            </div>
          ) : staff.length === 0 ? (
            <div className="rounded-2xl bg-slate-100 p-6 text-center">
              <p className="font-bold text-slate-700">
                登録されているスタッフがいません。
              </p>

              <button
                type="button"
                onClick={() => router.push("/staff")}
                className="mt-4 rounded-xl bg-slate-900 px-5 py-3 font-black text-white hover:bg-slate-800"
              >
                スタッフ登録へ
              </button>
            </div>
          ) : (
            <>
              <label
                htmlFor="staff"
                className="mb-2 block text-sm font-black text-slate-700"
              >
                スタッフ
              </label>

              <select
                id="staff"
                value={selectedStaffId}
                onChange={(event) => {
                  setSelectedStaffId(event.target.value);
                  setErrorMessage("");
                }}
                className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-4 text-lg font-black text-slate-900 outline-none focus:border-slate-900"
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
                onClick={handleLogin}
                disabled={!selectedStaffId}
                className="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-4 text-lg font-black text-white hover:bg-slate-800 disabled:bg-slate-300"
              >
                ログイン
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
