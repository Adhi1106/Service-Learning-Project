"use client";

// The warden's stock screen. Owner: F2 (Warden phone screens).

import { useRouter } from "next/navigation";
import { useState } from "react";
import { amount } from "@/lib/format";
import { relativeDay } from "@/lib/dates";

type ItemOption = { id: number; name: string; category: string; unit: string; balance: number };
type Entry = { id: number; item: string; unit: string; type: "in" | "out"; quantity: number; date: string; note: string | null };

const NOTES = {
  out: ["Issued to kitchen", "Issued to dorms", "Issued from sick room", "Issued for school"],
  in: ["Monthly purchase", "Donation in kind", "Purchase, medical store"],
};

type Props = { items: ItemOption[]; today: string; recent: Entry[]; initialType: "in" | "out" };

export function StockForm({ items: initialItems, today, recent, initialType }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [itemId, setItemId] = useState<number | "">("");
  const [type, setType] = useState<"out" | "in">(initialType);
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const item = items.find((i) => i.id === itemId);
  const categories = [...new Set(items.map((i) => i.category))];
  const amountEntered = Number(quantity);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return setMessage({ kind: "error", text: "Choose an item." });
    if (!quantity || !(amountEntered > 0)) return setMessage({ kind: "error", text: "Enter a quantity above zero." });

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          type,
          quantity: amountEntered,
          expiryDate: type === "in" && expiryDate ? expiryDate : null,
          note: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((all) => all.map((i) => (i.id === item.id ? { ...i, balance: data.balance } : i)));
      setMessage({ kind: "ok", text: `Saved. ${item.name}: ${amount(data.balance, item.unit)} now in stock.` });
      setQuantity("");
      setExpiryDate("");
      setNote("");
      router.refresh();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error && err.message ? err.message : "Could not save. Check the connection and try again." });
    }
    setSaving(false);
  }

  const field =
    "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";
  const toggle = (selected: boolean) =>
    `rounded-lg px-3 py-2.5 text-sm font-semibold transition ${selected ? "bg-white text-teal-800 shadow-sm" : "text-slate-600"}`;

  return (
    <>
      <form onSubmit={save}>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Stock</h1>
        <p className="mt-1 text-sm text-slate-500">Record what was issued from the store, or what arrived.</p>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1">
          <button type="button" aria-pressed={type === "out"} onClick={() => setType("out")} className={toggle(type === "out")}>
            Used (stock out)
          </button>
          <button type="button" aria-pressed={type === "in"} onClick={() => setType("in")} className={toggle(type === "in")}>
            Arrived (stock in)
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <label className="block text-sm font-medium text-slate-700">
            Item
            <select
              className={field}
              value={itemId}
              onChange={(e) => {
                setItemId(e.target.value ? Number(e.target.value) : "");
                setMessage(null);
              }}
            >
              <option value="">Choose an item</option>
              {categories.map((c) => (
                <optgroup key={c} label={c}>
                  {items
                    .filter((i) => i.category === c)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          {item && (
            <p className="mt-2 text-sm text-slate-500">
              In stock now: <span className="font-semibold text-slate-900">{amount(item.balance, item.unit)}</span>
            </p>
          )}

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Quantity{item ? ` (${item.unit})` : ""}
            <input className={field} type="number" inputMode="decimal" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
          </label>

          {type === "in" && (
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Expiry date <span className="font-normal text-slate-400">(if it has one)</span>
              <input className={field} type="date" min={today} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </label>
          )}

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Note <span className="font-normal text-slate-400">(optional)</span>
            <input className={field} value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder={type === "out" ? "Issued to kitchen" : "Supplier or donor"} />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {NOTES[type].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNote(n)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${note === n ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={`mt-4 rounded-xl px-3.5 py-2.5 text-sm ${message.kind === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"}`}
          >
            {message.text}
          </p>
        )}

        <button disabled={saving} className="mt-4 w-full rounded-xl bg-teal-700 px-4 py-3.5 text-base font-semibold text-white shadow-sm active:bg-teal-800 disabled:opacity-60">
          {saving ? "Saving..." : "Save"}
        </button>
      </form>

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Your recent entries</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate text-slate-800">
                    {t.type === "in" ? "Received" : "Issued"} {amount(t.quantity, t.unit)} {t.item}
                  </span>
                  {t.note && <span className="block truncate text-xs text-slate-500">{t.note}</span>}
                </span>
                <span className="shrink-0 text-xs text-slate-400">{relativeDay(t.date, today)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
