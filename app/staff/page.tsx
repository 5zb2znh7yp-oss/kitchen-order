"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Staff = {
id: string;
display_name: string;
};

export default function StaffPage() {
const [staff, setStaff] = useState<Staff[]>([]);
const [staffName, setStaffName] = useState("");
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");
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
  setErrorMessage("Failed to load staff.");
  setLoading(false);
  return;
}

setStaff(data ?? []);
setLoading(false);

}

async function handleRegister(event: FormEvent<HTMLFormElement>) {
event.preventDefault();

setMessage("");
setErrorMessage("");

const name = staffName.trim();

if (!name) {
  setErrorMessage("Please enter a staff name.");
  return;
}

setSaving(true);

const { error } = await supabase
  .from("staff_profiles")
  .insert({
    display_name: name,
  });

if (error) {
  if (error.code === "23505") {
    setErrorMessage("This staff name is already registered.");
  } else {
    setErrorMessage("Failed to register staff.");
  }

  setSaving(false);
  return;
}

setStaffName("");
setMessage("Staff registered successfully.");

await loadStaff();

setSaving(false);

}

return (
<main className="min-h-screen bg-slate-100 px-4 py-10">
<div className="mx-auto max-w-2xl">
<div className="rounded-3xl bg-white p-6 shadow-lg md:p-8">
<div className="mb-8 text-center">
<p className="text-sm font-bold text-slate-500">
Store System
</p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Staff Management
        </h1>

        <p className="mt-3 text-sm font-bold text-slate-500">
          Register a staff name
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleRegister} className="mb-8 flex gap-3">
        <input
          type="text"
          value={staffName}
          onChange={(event) => {
            setStaffName(event.target.value);
            setMessage("");
            setErrorMessage("");
          }}
          placeholder="Example: Yamada"
          disabled={saving}
          className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-4 text-lg font-bold outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
        />

        <button
          type="submit"
          disabled={saving}
          className="shrink-0 rounded-2xl bg-slate-900 px-5 py-4 text-base font-black text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {saving ? "Saving..." : "Register"}
        </button>
      </form>

      <div>
        <h2 className="mb-4 text-xl font-black text-slate-900">
          Registered Staff
        </h2>

        {loading ? (
          <p className="font-bold text-slate-500">
            Loading...
          </p>
        ) : staff.length === 0 ? (
          <p className="rounded-2xl bg-slate-100 p-5 text-center font-bold text-slate-500">
            No staff registered yet.
          </p>
        ) : (
          <div className="space-y-3">
            {staff.map((person) => (
              <div
                key={person.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-lg font-black text-slate-800"
              >
                {person.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
</main>

);
}