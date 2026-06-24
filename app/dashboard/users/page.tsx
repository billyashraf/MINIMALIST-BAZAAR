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

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
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

  const promote = async (id: string) => {
    setPromoting(id);
    const res = await fetch(`/api/admin/users/${id}/promote`, { method: "PATCH" });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: "admin" } : u))
      );
    }
    setPromoting(null);
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

  const admins = users.filter((u) => u.role === "admin");
  const regular = users.filter((u) => u.role !== "admin");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">User Management</h1>
        <p className="text-gray-500 text-sm">
          Regular users can list up to {PRODUCT_LIMIT} products (personal page only). Promote to admin for unlimited products and home-page visibility.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Regular Users</p>
          <p className="text-2xl font-bold text-gray-900">{regular.length}</p>
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
              <th className="px-5 py-3" />
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
                  <span
                    className={`capitalize text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === "admin"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-700">
                  {u.productCount}
                  {u.role !== "admin" && (
                    <span className="text-gray-400"> / {PRODUCT_LIMIT}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {u.role === "admin" ? (
                    <span className="text-green-600 text-xs font-medium">Home page</span>
                  ) : (
                    <span className="text-gray-500 text-xs">Personal page only</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {u.role !== "admin" && (
                    <button
                      onClick={() => promote(u._id)}
                      disabled={promoting === u._id}
                      className="px-3 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
                    >
                      {promoting === u._id ? "Promoting…" : "Promote to admin"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
