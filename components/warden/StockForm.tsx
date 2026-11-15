"use client";

// The warden's stock screen. Owner: F2 (Frontend: Warden Mobile Screens).

import { useState } from "react";

type ItemOption = { id: number; name: string; category: string; unit: string; balance: number };

const show = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

export function StockForm({ items: initialItems, today }: { items: ItemOption[]; today: string }) {
  const [items, setItems] = useState(initialItems);
  const [itemId, setItemId] = useState<number | "">("");
  const [type, setType] = useState<"out" | "in">("out");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const item = items.find((i) => i.id === itemId);
  const categories = [...new Set(items.map((i) => i.category))];
  const amount = Number(quantity);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return setMessage({ kind: "error", text: "Choose an item." });
    if (!quantity || !(amount > 0)) return setMessage({ kind: "error", text: "Enter a quantity above zero." });

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, type, quantity: amount, expiryDate: type === "in" && expiryDate ? expiryDate : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((all) => all.map((i) => (i.id === item.id ? { ...i, balance: data.balance } : i)));
      setMessage({
        kind: "ok",
        text: `Saved. ${item.name}: ${show(data.balance)} ${item.unit} now in stock.`,
      });
      setQuantity("");
      setExpiryDate("");
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error && err.message ? err.message : "Could not save. Check the connection and try again." });
    }
    setSaving(false);
  }

  const field = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";
  const toggle = (selected: boolean) =>
    `flex-1 rounded-lg border px-3 py-3 text-base font-semibold ${selected ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-700"}`;

  return (
    <form onSubmit={save}>
      <h1 className="text-xl font-semibold text-slate-900">Stock</h1>
      <p className="text-sm text-slate-600">Record what was used or what arrived.</p>

      <div className="mt-5 flex gap-2">
        <button type="button" aria-pressed={type === "out"} onClick={() => setType("out")} className={toggle(type === "out")}>
          Used (stock out)
        </button>
        <button type="button" aria-pressed={type === "in"} onClick={() => setType("in")} className={toggle(type === "in")}>
          Arrived (stock in)
        </button>
      </div>

      <label className="mt-5 block text-sm font-medium text-slate-700">
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
        <p className="mt-2 text-sm text-slate-600">
          In stock now:{" "}
          <span className="font-semibold text-slate-900">
            {show(item.balance)} {item.unit}
          </span>
        </p>
      )}

      <label className="mt-5 block text-sm font-medium text-slate-700">
        Quantity{item ? ` (${item.unit})` : ""}
        <input className={field} type="number" inputMode="decimal" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
      </label>

      {type === "in" && (
        <label className="mt-5 block text-sm font-medium text-slate-700">
          Expiry date (if it has one)
          <input className={field} type="date" min={today} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </label>
      )}

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`mt-5 rounded-lg px-3 py-2.5 text-sm ${message.kind === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </p>
      )}

      <button disabled={saving} className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-3.5 text-base font-semibold text-white active:bg-teal-800 disabled:opacity-60">
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
