"use client";

import { useEffect, useState } from "react";
import { Lock, Mail, Plus, Server, Shield, Trash2, UserCheck } from "lucide-react";

type DbAdmin = {
  _id: string;
  email: string;
  addedBy?: string;
  createdAt: string;
};

export default function AdminsPage() {
  const [dbAdmins, setDbAdmins] = useState<DbAdmin[]>([]);
  const [systemAdmins, setSystemAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/emails");
      const data = await res.json();
      if (data.success) {
        setDbAdmins(data.dbAdmins || []);
        setSystemAdmins(data.systemAdmins || []);
      }
    } catch (error) {
      console.error("Failed to load admin emails:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    try {
      setAdding(true);
      setMessage(null);

      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message || "Admin added successfully.", type: "success" });
        setEmailInput("");
        fetchAdmins();
      } else {
        setMessage({ text: data.message || "Failed to add admin.", type: "error" });
      }
    } catch (error) {
      console.error("Add admin error:", error);
      setMessage({ text: "An error occurred.", type: "error" });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    const confirmDelete = confirm(`Are you sure you want to revoke admin access for ${email}?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/emails/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message || "Admin access revoked.", type: "success" });
        fetchAdmins();
      } else {
        setMessage({ text: data.message || "Failed to revoke admin.", type: "error" });
      }
    } catch (error) {
      console.error("Delete admin error:", error);
      setMessage({ text: "An error occurred.", type: "error" });
    }
  };

  return (
    <div className="min-h-screen p-5 md:p-2">
      <div className="mx-auto max-w-[1600px]">
        {/* Banner */}
        <div className="mb-7 rounded-[30px] bg-[#14743A] p-8 text-white shadow-[0_18px_45px_rgba(20,116,58,0.18)] md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-white/12 px-4 py-2">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/85">
                  Access Control
                </p>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
                Admin Management
              </h1>

              <p className="mt-4 max-w-4xl text-base font-medium text-white/85">
                Manage administrators who can log in to Stoko&apos;s admin panel. Add extra admins dynamically to the database or view system bootstrap accounts configured via environment variables.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          {/* Add Admin Form */}
          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-xl font-black text-zinc-950 mb-1">Add Admin</h2>
            <p className="text-sm font-medium text-zinc-500 mb-5">
              Authorize a new email address to access this panel.
            </p>

            {message && (
              <div
                className={`mb-5 rounded-2xl p-4 text-sm font-semibold border ${
                  message.type === "success"
                    ? "bg-green-50 border-green-100 text-green-800"
                    : "bg-red-50 border-red-100 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="admin@stokos.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-zinc-900 outline-none focus:border-green-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adding || !emailInput.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-green-700 hover:bg-green-800 disabled:bg-zinc-150 disabled:text-zinc-400 py-3 text-sm font-black text-white transition shadow-sm"
              >
                <Plus size={16} />
                {adding ? "Adding..." : "Add Admin Account"}
              </button>
            </form>
          </div>

          {/* Admin List Table */}
          <div className="min-w-0 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-black text-zinc-950">Active Admins</h2>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                All administrators currently allowed to access this panel.
              </p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm font-bold text-zinc-400">
                Loading accounts...
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-zinc-50 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                      <tr>
                        <th className="px-5 py-4">Admin Email</th>
                        <th className="px-5 py-4">Source</th>
                        <th className="px-5 py-4">Added By</th>
                        <th className="px-5 py-4">Date Added</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {/* System Env Admins */}
                      {systemAdmins.map((email) => (
                        <tr key={`sys-${email}`} className="bg-zinc-50/30">
                          <td className="px-5 py-5 align-middle">
                            <span className="font-bold text-zinc-900">{email}</span>
                          </td>
                          <td className="px-5 py-5 align-middle">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-black uppercase text-blue-700">
                              <Server size={12} />
                              System (.env)
                            </span>
                          </td>
                          <td className="px-5 py-5 align-middle text-zinc-500 font-semibold">
                            Environment
                          </td>
                          <td className="px-5 py-5 align-middle text-zinc-500 font-semibold">
                            N/A
                          </td>
                          <td className="px-5 py-5 align-middle">
                            <div className="flex justify-end items-center gap-1.5 text-zinc-400 font-black text-xs">
                              <Lock size={12} />
                              <span>Read-Only</span>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Database Admins */}
                      {dbAdmins.map((admin) => (
                        <tr key={admin._id} className="bg-white">
                          <td className="px-5 py-5 align-middle">
                            <span className="font-bold text-zinc-900">{admin.email}</span>
                          </td>
                          <td className="px-5 py-5 align-middle">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-black uppercase text-green-800">
                              <UserCheck size={12} />
                              Database
                            </span>
                          </td>
                          <td className="px-5 py-5 align-middle text-zinc-700 font-semibold">
                            {admin.addedBy || "Unknown"}
                          </td>
                          <td className="px-5 py-5 align-middle text-zinc-500 font-semibold">
                            {new Date(admin.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-5 py-5 align-middle">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleDeleteAdmin(admin._id, admin.email)}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 hover:border-red-200 px-3 py-2 text-xs font-black text-[#DA3327] transition hover:bg-red-100"
                              >
                                <Trash2 size={13} />
                                Revoke Access
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {systemAdmins.length === 0 && dbAdmins.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-10 text-center font-bold text-zinc-400">
                            No administrators configured.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
