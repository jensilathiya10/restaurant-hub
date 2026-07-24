"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/utils";
import { Icons } from "./Icon";

type MenuItem = {
  id: string; categoryId: string; name: string; description: string | null; price: number;
  available: number | boolean; prepMinutes?: number;
};
type Category = { id: string; name: string };

type EditForm = { name: string; description: string; price: string; prepMinutes: string; categoryId: string; available: boolean };

export default function MenuManager({ categories, items }: { categories: Category[]; items: MenuItem[] }) {
  const router = useRouter();
  const [newCatName, setNewCatName] = useState("");
  const [form, setForm] = useState({ name: "", price: "", categoryId: categories[0]?.id || "", description: "", prepMinutes: "10" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function addCategory() {
    if (!newCatName.trim()) return;
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCatName }) });
    setNewCatName("");
    router.refresh();
  }

  async function addItem() {
    if (!form.name || !form.price || !form.categoryId) return;
    setSaving(true);
    await fetch("/api/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price), prepMinutes: Number(form.prepMinutes) }),
    });
    setSaving(false);
    setForm({ name: "", price: "", categoryId: categories[0]?.id || "", description: "", prepMinutes: "10" });
    router.refresh();
  }

  async function toggleAvailable(id: string, available: boolean) {
    await fetch(`/api/menu-items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ available: !available }) });
    router.refresh();
  }

  async function removeItem(id: string) {
    await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      prepMinutes: String(item.prepMinutes ?? 10),
      categoryId: item.categoryId,
      available: item.available === 1 || item.available === true,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit(id: string) {
    if (!editForm) return;
    setSavingEdit(true);
    await fetch(`/api/menu-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        description: editForm.description,
        price: Number(editForm.price),
        prepMinutes: Number(editForm.prepMinutes),
        categoryId: editForm.categoryId,
        available: editForm.available,
      }),
    });
    setSavingEdit(false);
    setEditingId(null);
    setEditForm(null);
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-sm mb-3">{cat.name}</h3>
            <div className="space-y-2">
              {items.filter((i) => i.categoryId === cat.id).map((item) => {
                const isEditing = editingId === item.id;
                const available = item.available === 1 || item.available === true;
                return (
                  <div key={item.id} className="border-b border-neutral-100 pb-2">
                    {!isEditing ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-neutral-400">{item.description}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{money(item.price)}</span>
                          <button
                            onClick={() => toggleAvailable(item.id, available)}
                            className={`text-[10px] px-2 py-1 rounded-full font-medium ${available ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"}`}
                          >
                            {available ? "In Stock" : "Out of Stock"}
                          </button>
                          <button onClick={() => startEdit(item)} className="text-neutral-400 hover:text-[var(--brand)]"><Icons.edit size={15} /></button>
                          <button onClick={() => removeItem(item.id)} className="text-neutral-400 hover:text-red-500"><Icons.trash size={15} /></button>
                        </div>
                      </div>
                    ) : (
                      editForm && (
                        <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
                          <div className="flex gap-2">
                            <input
                              placeholder="Name" value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                            />
                            <select
                              value={editForm.categoryId}
                              onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                              className="border rounded-lg px-2 py-1.5 text-sm"
                            >
                              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <input
                            placeholder="Description" value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full border rounded-lg px-3 py-1.5 text-sm"
                          />
                          <div className="flex gap-2">
                            <input
                              placeholder="Price" type="number" value={editForm.price}
                              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                              className="w-1/3 border rounded-lg px-3 py-1.5 text-sm"
                            />
                            <input
                              placeholder="Prep min" type="number" value={editForm.prepMinutes}
                              onChange={(e) => setEditForm({ ...editForm, prepMinutes: e.target.value })}
                              className="w-1/3 border rounded-lg px-3 py-1.5 text-sm"
                            />
                            <div className="w-1/3 flex rounded-lg border overflow-hidden text-xs">
                              <button
                                type="button"
                                onClick={() => setEditForm({ ...editForm, available: true })}
                                className={`flex-1 py-1.5 font-medium ${editForm.available ? "bg-emerald-500 text-white" : "bg-white text-neutral-500"}`}
                              >
                                In Stock
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditForm({ ...editForm, available: false })}
                                className={`flex-1 py-1.5 font-medium ${!editForm.available ? "bg-neutral-600 text-white" : "bg-white text-neutral-500"}`}
                              >
                                Out of Stock
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-lg border text-neutral-500">Cancel</button>
                            <button
                              disabled={savingEdit}
                              onClick={() => saveEdit(item.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white font-medium disabled:opacity-50"
                            >
                              {savingEdit ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
              {items.filter((i) => i.categoryId === cat.id).length === 0 && <p className="text-xs text-neutral-400">No items in this category yet.</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h3 className="font-semibold text-sm mb-3">Add Category</h3>
          <div className="flex gap-2">
            <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Sides" className="flex-1 border rounded-lg px-3 py-1.5 text-sm" />
            <button onClick={addCategory} className="bg-neutral-800 text-white rounded-lg px-3 py-1.5 text-sm">Add</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h3 className="font-semibold text-sm mb-3">Add Menu Item</h3>
          <div className="space-y-2">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
            <div className="flex gap-2">
              <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm" />
              <input placeholder="Prep min" type="number" value={form.prepMinutes} onChange={(e) => setForm({ ...form, prepMinutes: e.target.value })} className="w-1/2 border rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button disabled={saving} onClick={addItem} className="w-full bg-[var(--brand)] text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
              {saving ? "Adding…" : "Add Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
