"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

export default function StaffPage() {
const [staffList, setStaffList] = useState<StaffProfile[]>([]);
const [displayNameInput, setDisplayNameInput] = useState("");
const [selectedStaffId, setSelectedStaffId] = useState("");
const [loggedInStaff, setLoggedInStaff] = useState<LoggedInStaff | null>(
null
);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);

async function loadStaff() {
const { data, error } = await supabase
.from("staff_profiles")
.select("id, display_name, is_owner, can_manage_finance")
.order("created_at", { ascending: true });

if (error) {
  console.error("スタッフ読み込みエラー:", error);
  window.alert("スタッフ情報を読み込めませんでした。");
  return;
}

setStaffList((data ?? []) as StaffProfile[]);

}

useEffect(() => {
const savedStaff = localStorage.getItem("kitchen-order-staff");

if (savedStaff) {
  try {
    const parsed = JSON.parse(savedStaff);

    if (parsed.id && parsed.displayName) {
      setLoggedInStaff({
        id: parsed.id,
        displayName: parsed.displayName,
      });
    }
  } catch (error) {
    console.error("ログインスタッフ情報の読み込みに失敗しました:", error);
  }
}

async function initialize() {
  await loadStaff();
  setLoading(false);
}

initialize();

}, []);

const currentStaff = staffList.find(
(staff) => staff.id === loggedInStaff?.id
);

const isOwner = currentStaff?.is_owner === true;

function switchStaff(staff: StaffProfile) {
const staffData = {
id: staff.id,
displayName: staff.display_name,
};

localStorage.setItem(
  "kitchen-order-staff",
  JSON.stringify(staffData)
);

setLoggedInStaff(staffData);
window.location.reload();

}

async function registerStaff() {
const name = displayNameInput.trim();

if (!name) {
  window.alert("スタッフ名を入力してください。");
  return;
}

setSaving(true);

const { data, error } = await supabase
  .from("staff_profiles")
  .insert({
    display_name: name,
  })
  .select("id, display_name, is_owner, can_manage_finance")
  .single();

if (error) {
  console.error("スタッフ登録エラー:", error);
  window.alert("スタッフを登録できませんでした。");
  setSaving(false);
  return;
}

setDisplayNameInput("");
setSaving(false);

await loadStaff();

if (!loggedInStaff && data) {
  switchStaff(data as StaffProfile);
  return;
}

window.alert("スタッフを登録しました。");

}

async function changeDisplayName() {
if (!selectedStaffId) {
window.alert("変更するスタッフを選択してください。");
return;
}

const staff = staffList.find(
  (item) => item.id === selectedStaffId
);

if (!staff) {
  return;
}

const newName = window.prompt(
  "新しいスタッフ名を入力してください。",
  staff.display_name
);

if (newName === null) {
  return;
}

const name = newName.trim();

if (!name) {
  window.alert("スタッフ名を入力してください。");
  return;
}

const { error } = await supabase
  .from("staff_profiles")
  .update({
    display_name: name,
  })
  .eq("id", selectedStaffId);

if (error) {
  console.error("スタッフ名変更エラー:", error);
  window.alert("スタッフ名を変更できませんでした。");
  return;
}

await loadStaff();

if (loggedInStaff?.id === selectedStaffId) {
  const updatedStaff = {
    id: selectedStaffId,
    displayName: name,
  };

  localStorage.setItem(
    "kitchen-order-staff",
    JSON.stringify(updatedStaff)
  );

  setLoggedInStaff(updatedStaff);
}

setSelectedStaffId("");
window.alert("スタッフ名を変更しました。");

}

async function setOwner(staff: StaffProfile) {
if (!isOwner) {
window.alert("主だけが管理者を変更できます。");
return;
}

const pin = window.prompt("主PINを入力してください。");

if (pin === null) {
  return;
}

const { data, error } = await supabase.rpc(
  "change_staff_permissions",
  {
    input_pin: pin,
    target_staff_id: staff.id,
    make_owner: true,
    allow_finance: true,
  }
);

if (error) {
  console.error("主変更エラー:", error);
  window.alert("主の変更に失敗しました。");
  return;
}

if (data !== true) {
  window.alert("PINが正しくありません。");
  return;
}

await loadStaff();

window.alert(
  staff.display_name + " さんを主に変更しました。"
);

}

async function toggleFinance(staff: StaffProfile) {
if (!isOwner) {
window.alert("主だけが資金管理権限を変更できます。");
return;
}

if (staff.is_owner) {
  window.alert("主は資金管理を利用できます。");
  return;
}

const pin = window.prompt("主PINを入力してください。");

if (pin === null) {
  return;
}

const { data, error } = await supabase.rpc(
  "change_staff_permissions",
  {
    input_pin: pin,
    target_staff_id: staff.id,
    make_owner: false,
    allow_finance: !staff.can_manage_finance,
  }
);

if (error) {
  console.error("資金管理権限変更エラー:", error);
  window.alert("資金管理権限の変更に失敗しました。");
  return;
}

if (data !== true) {
  window.alert("PINが正しくありません。");
  return;
}

await loadStaff();

}

if (loading) {
return (
<main className="min-h-screen bg-slate-100 text-slate-900">
<div className="flex min-h-screen items-center justify-center">
<p className="text-xl font-black">
スタッフ情報を読み込んでいます...
</p>
</div>
</main>
);
}

return (
<main className="min-h-screen bg-slate-100 text-slate-900">
<div className="mx-auto max-w-7xl px-4 py-6">
<div className="mb-6">
<h1 className="text-3xl font-black text-slate-900">
スタッフ管理
</h1>
<p className="mt-1 font-medium text-slate-600">
スタッフの登録、名前変更、主・資金管理権限を管理します。
</p>
</div>

    <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">
        現在のスタッフ
      </h2>

      {loggedInStaff ? (
        <div className="mt-4 rounded-xl bg-slate-100 p-4">
          <p className="text-sm font-bold text-slate-500">
            現在ログイン中
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {loggedInStaff.displayName}
          </p>

          {isOwner ? (
            <p className="mt-2 font-black text-blue-600">
              主
            </p>
          ) : currentStaff?.can_manage_finance ? (
            <p className="mt-2 font-black text-green-600">
              資金管理権限あり
            </p>
          ) : (
            <p className="mt-2 font-bold text-slate-500">
              スタッフ
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 font-bold text-slate-500">
          まだスタッフが選択されていません。
        </p>
      )}
    </section>

    <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">
        スタッフ登録
      </h2>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={displayNameInput}
          onChange={(event) =>
            setDisplayNameInput(event.target.value)
          }
          placeholder="スタッフ名"
          className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 outline-none focus:border-slate-900"
        />

        <button
          type="button"
          onClick={registerStaff}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {saving ? "登録中..." : "スタッフを登録"}
        </button>
      </div>
    </section>

    <section className="rounded-2xl bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-black text-slate-900">
          スタッフ一覧
        </h2>
      </div>

      <div className="divide-y divide-slate-200">
        {staffList.map((staff) => (
          <div
            key={staff.id}
            className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p className="text-xl font-black text-slate-900">
                {staff.display_name}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {staff.is_owner ? (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-black text-blue-700">
                    主
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">
                    スタッフ
                  </span>
                )}

                {staff.can_manage_finance ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-black text-green-700">
                    資金管理OK
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-500">
                    資金管理なし
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => switchStaff(staff)}
                className="rounded-xl bg-slate-900 px-4 py-3 font-black text-white hover:bg-slate-700"
              >
                このスタッフに切替
              </button>

              <button
                type="button"
                onClick={() => setSelectedStaffId(staff.id)}
                className="rounded-xl bg-slate-200 px-4 py-3 font-black text-slate-800 hover:bg-slate-300"
              >
                名前変更
              </button>

              {isOwner && !staff.is_owner ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOwner(staff)}
                    className="rounded-xl bg-blue-100 px-4 py-3 font-black text-blue-700 hover:bg-blue-200"
                  >
                    主にする
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFinance(staff)}
                    className="rounded-xl bg-green-100 px-4 py-3 font-black text-green-700 hover:bg-green-200"
                  >
                    {staff.can_manage_finance
                      ? "資金管理をOFF"
                      : "資金管理をON"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))}

        {staffList.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-bold text-slate-500">
              スタッフがまだ登録されていません。
            </p>
          </div>
        ) : null}
      </div>
    </section>
  </div>
</main>

);
}