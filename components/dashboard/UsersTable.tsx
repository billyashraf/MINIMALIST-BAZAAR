"use client";

import { useEffect, useState } from "react";

const PRODUCT_LIMIT = 10;

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  productCount: number;
  createdAt: string;
}

const roleBadge: Record<string, string> = {
  customer: "bg-gray-100 text-gray-600",
  seller: "bg-blue-50 text-blue-700",
  admin: "bg-black text-white",
};

const roleVisibility: Record<string, string> = {
  customer: "Cannot list products",
  seller: "Personal page only",
  admin: "Home page",
};

const roleVisibilityColor: Record<string, string> = {
  customer: "text-gray-400",
  seller: "text-blue-600",
  admin: "text-green-600",
};

export default function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load users");
        return r.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const promote = async (id: string, role: "seller" | "admin") => {
    setBusy(id + role);
    const res = await fetch(`/api/admin/users/${id}/promote`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)));
    }
    setBusy(null);
  };

  const demote = async (id: string, currentRole: string) => {
    setBusy(id + "demote");
    const res = await fetch(`/api/admin/users/${id}/demote`, { method: "PATCH" });
    if (res.ok) {
      const next = currentRole === "admin" ? "seller" : "customer";
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role: next } : u)));
    }
    setBusy(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const customers = users.filter((u) => u.role === "customer");
  const sellers = users.filter((u) => u.role === "seller");
  const admins = users.filter((u) => u.role === "admin");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Customers</p>
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Sellers</p>
          <p className="text-2xl font-bold text-blue-600">{sellers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Admins</p>
          <p className="text-2xl font-bold text-green-600">{admins.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">All users</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">User</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Products</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Visibility</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`capitalize text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-700">
                  {u.role === "customer" ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <>
                      {u.productCount}
                      {u.role === "seller" && (
                        <span className="text-gray-400"> / {PRODUCT_LIMIT}</span>
                      )}
                    </>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium ${roleVisibilityColor[u.role] ?? "text-gray-400"}`}>
                    {roleVisibility[u.role]}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {u.role === "customer" && (
                      <button
                        onClick={() => promote(u._id, "seller")}
                        disabled={busy === u._id + "seller"}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {busy === u._id + "seller" ? "…" : "→ Seller"}
                      </button>
                    )}
                    {(u.role === "customer" || u.role === "seller") && (
                      <button
                        onClick={() => promote(u._id, "admin")}
                        disabled={busy === u._id + "admin"}
                        className="px-3 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        {busy === u._id + "admin" ? "…" : "→ Admin"}
                      </button>
                    )}
                    {u.role !== "customer" && (
                      <button
                        onClick={() => demote(u._id, u.role)}
                        disabled={busy === u._id + "demote"}
                        className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        {busy === u._id + "demote"
                          ? "…"
                          : u.role === "admin"
                          ? "← Seller"
                          : "← User"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
