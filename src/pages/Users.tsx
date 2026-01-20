import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../auth/AuthContext";
import {
  Edit2,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  Key,
} from "lucide-react";

type Role = { _id: string; name: string; permissions: string[] };
type UserRow = {
  _id: string;
  email: string;
  username: string;
  canApprove: boolean;
  isActive: boolean;
  roleId: Role;
  createdAt: string;
};

export function UsersPage() {
  const { has } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isActive, setIsActive] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    roleId: "",
    canApprove: false,
  });

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  async function loadRoles() {
    const r = await api.get("/roles");
    setRoles(r.data.items);
  }

  async function loadUsers() {
    const r = await api.get("/users", {
      params: {
        page,
        limit,
        search: search || undefined,
        roleId: roleId || undefined,
        isActive: isActive || undefined,
      },
    });
    setItems(r.data.items);
    setTotal(r.data.total);
  }

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleId, isActive]);

  async function onSearch() {
    setPage(1);
    await loadUsers();
  }

  function openCreate() {
    setEditing(null);
    setForm({
      email: "",
      username: "",
      password: "",
      roleId: roles[0]?._id ?? "",
      canApprove: false,
    });
    setOpen(true);
  }

  function openEdit(u: UserRow) {
    setEditing(u);
    setForm({
      email: u.email,
      username: u.username,
      password: "",
      roleId: u.roleId?._id ?? "",
      canApprove: u.canApprove,
    });
    setOpen(true);
  }

  async function save() {
    const t = toast.loading(editing ? "Updating user..." : "Creating user...");
    try {
      if (!form.email || !form.username || !form.roleId) {
        toast.error("Email, username and role are required", { id: t });
        return;
      }

      if (!editing) {
        if (!form.password || form.password.length < 8) {
          toast.error("Password must be at least 8 characters", { id: t });
          return;
        }
        await api.post("/users", {
          email: form.email,
          username: form.username,
          password: form.password,
          roleId: form.roleId,
          canApprove: form.canApprove,
        });
      } else {
        await api.patch(`/users/${editing._id}`, {
          email: form.email,
          username: form.username,
          roleId: form.roleId,
          canApprove: form.canApprove,
        });
      }

      toast.success("Saved", { id: t });
      setOpen(false);
      await loadUsers();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  async function toggleActive(u: UserRow) {
    const t = toast.loading(u.isActive ? "Disabling..." : "Enabling...");
    try {
      await api.patch(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success("Updated", { id: t });
      await loadUsers();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  async function resetPassword(u: UserRow) {
    const newPass = prompt("Enter new password (min 8):");
    if (!newPass) return;
    if (newPass.length < 8) return toast.error("Password too short");

    const t = toast.loading("Resetting password...");
    try {
      await api.patch(`/users/${u._id}/password`, { password: newPass });
      toast.success("Password reset", { id: t });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            User Manager
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            Manage system users and permissions
          </div>
        </div>
        {has("users.create") ? (
          <Button
            onClick={openCreate}
            variant="ghost"
            icon={<UserPlus className="h-4 w-4" />}
            iconPosition="left"
            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
          >
            Create User
          </Button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input
            label="Search"
            placeholder="email or username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-gray-300"
          />
          <Select
            label="Role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="border-gray-300"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
            className="border-gray-300"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </Select>
          <div className="flex items-end">
            <Button
              variant="ghost"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow"
              onClick={onSearch}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white/80">
              <tr className="text-left">
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Email
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Username
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Role
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Approve
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Status
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((u) => (
                <tr
                  key={u._id}
                  className="transition-all duration-150 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/30"
                >
                  <td className="px-5 py-4">
                    <div className="text-gray-900">{u.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">
                      {u.username}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue/20 to-blue-100/50">
                        <Shield className="h-3 w-3 text-brand-blue" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {u.roleId?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${u.canApprove ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"}`}
                    >
                      {u.canApprove ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Yes
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          No
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                    >
                      {u.isActive ? (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                          Active
                        </>
                      ) : (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                          Disabled
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {has("users.update") ? (
                        <Button
                          variant="ghost"
                          onClick={() => openEdit(u)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow"
                          icon={<Edit2 className="h-3 w-3" />}
                        >
                          Edit
                        </Button>
                      ) : null}
                      {has("users.disable") ? (
                        <Button
                          variant="ghost"
                          onClick={() => toggleActive(u)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow"
                        >
                          {u.isActive ? "Disable" : "Enable"}
                        </Button>
                      ) : null}
                      {has("users.resetPassword") ? (
                        <Button
                          variant="ghost"
                          onClick={() => resetPassword(u)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow"
                          icon={<Key className="h-3 w-3" />}
                        >
                          Reset PW
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-gray-500"
                    colSpan={6}
                  >
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8">
                      <div className="text-sm text-gray-500">
                        No users found
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Try adjusting your search filters
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200/50 px-5 py-3.5 bg-gradient-to-t from-gray-50 to-white/80">
          <div className="text-xs text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">{pages}</span> •{" "}
            <span className="font-semibold text-gray-900">{total}</span> total
            users
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={editing ? "Edit User" : "Create User"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label="Email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            className="border-gray-300"
          />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) =>
              setForm((s) => ({ ...s, username: e.target.value }))
            }
            className="border-gray-300"
          />
          {!editing ? (
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((s) => ({ ...s, password: e.target.value }))
              }
              className="border-gray-300"
            />
          ) : null}
          <Select
            label="Role"
            value={form.roleId}
            onChange={(e) => setForm((s) => ({ ...s, roleId: e.target.value }))}
            className="border-gray-300"
          >
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </Select>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.canApprove}
              onChange={(e) =>
                setForm((s) => ({ ...s, canApprove: e.target.checked }))
              }
              className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue/50"
            />
            Can Approve (future use)
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow"
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow"
            >
              {editing ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
