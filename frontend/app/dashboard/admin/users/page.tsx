"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import api from "@/lib/api";
import { DiceBearAvatar } from "@/components/ui/dicebear-avatar";
import { SkeletonTable } from "@/components/ui/skeleton";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  roles: { role: string }[];
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-purple-50 text-purple-700",
  SELLER: "bg-orange-50 text-orange-700",
  BUYER: "bg-cyan-50 text-cyan-700",
  DRIVER: "bg-green-50 text-green-700",
};

export default function AdminUsersPage() {
  const { data, isLoading } = useQuery<{ data: AdminUser[]; total: number }>({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/admin/users?page=1&limit=100").then((r) => r.data),
  });

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Pengguna</h1>
        <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} total pengguna terdaftar di Seapedia.</p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><SkeletonTable rows={6} /></div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="w-14 h-14 text-purple-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800">Belum ada pengguna terdaftar</h3>
          <p className="text-sm text-gray-500 mt-1">User akan muncul di sini setelah ada yang mendaftar di Seapedia.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Username</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Roles</th>
                <th className="text-right px-4 py-3 font-semibold">Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <DiceBearAvatar seed={u.username} className="h-8 w-8 ring-2 ring-purple-100" />
                      <p className="font-medium text-gray-800">{u.username}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r.role} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[r.role] || "bg-gray-100 text-gray-600"}`}>
                          {r.role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
