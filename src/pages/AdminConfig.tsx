/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import {
  Shield,
  Plus,
  Save,
  Check,
  Users,
  RefreshCw,
  Lock,
  AlertCircle,
} from "lucide-react";
import Loading from "../components/ui/Loading";

type Role = { _id: string; name: string; permissions: string[] };

export function AdminConfigPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<string[]>([]);
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const selectedPerms = useMemo(
    () => new Set(selected?.permissions ?? []),
    [selected],
  );

  async function load() {
    setLoading(true);
    try {
      const [rRoles, rPerms] = await Promise.all([
        api.get("/roles"),
        api.get("/roles/permissions"),
      ]);
      setRoles(rRoles.data.items);
      setPerms(rPerms.data.items);
      if (!selected && rRoles.data.items.length)
        setSelected(rRoles.data.items[0]);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePerm(p: string) {
    if (!selected) return;
    const set = new Set(selected.permissions);
    if (set.has(p)) set.delete(p);
    else set.add(p);
    setSelected({ ...selected, permissions: Array.from(set) });
  }

  async function saveSelected() {
    if (!selected) return;
    setSaving(true);
    const t = toast.loading("Saving role...");
    try {
      await api.patch(`/roles/${selected._id}`, {
        permissions: selected.permissions,
        name: selected.name,
      });
      toast.success("Saved", { id: t });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    } finally {
      setSaving(false);
    }
  }

  async function createRole() {
    const name = newRoleName.trim();
    if (!name) return toast.error("Role name required");

    const t = toast.loading("Creating role...");
    try {
      await api.post("/roles", { name, permissions: [] });
      toast.success("Created", { id: t });
      setOpenCreate(false);
      setNewRoleName("");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Role Management
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            Configure system roles and permissions
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={load}
            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? <Loading variant="dots" /> : "Refresh"}
          </Button>
          <Button
            onClick={() => setOpenCreate(true)}
            variant="ghost"
            icon={<Plus className="h-4 w-4" />}
            iconPosition="left"
            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
          >
            Create Role
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Roles List */}
        <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-blue" />
              <div className="text-sm font-black text-gray-900">Roles</div>
            </div>
            <div className="text-xs text-gray-600">{roles.length} role(s)</div>
          </div>
          <div className="space-y-2">
            {roles.map((r) => (
              <button
                key={r._id}
                className={[
                  "w-full rounded-lg px-4 py-3 text-left text-sm transition-all duration-200 flex items-center justify-between",
                  selected?._id === r._id
                    ? "bg-gradient-to-r from-brand-blue to-blue-600 text-white shadow-md"
                    : "border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm",
                ].join(" ")}
                onClick={() => setSelected(r)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      selected?._id === r._id
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-brand-blue/20 to-blue-100/50"
                    }`}
                  >
                    <Shield
                      className={`h-4 w-4 ${selected?._id === r._id ? "text-white" : "text-brand-blue"}`}
                    />
                  </div>
                  <div>
                    <div className="font-black">{r.name}</div>
                    <div className="text-xs opacity-80">
                      {r.permissions.length} permission(s)
                    </div>
                  </div>
                </div>
                {selected?._id === r._id && <Check className="h-4 w-4" />}
              </button>
            ))}
            {roles.length === 0 && !loading && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 text-center">
                <div className="text-sm text-gray-500">
                  No roles created yet
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Click "Create Role" to add a new role
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Permissions Panel */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-brand-blue" />
              <div className="text-sm font-black text-gray-900">
                Permissions
              </div>
            </div>
            {selected && (
              <Button
                onClick={saveSelected}
                variant="ghost"
                icon={<Save className="h-4 w-4" />}
                iconPosition="left"
                className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </div>

          {selected ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                <div className="text-sm">
                  Editing role:{" "}
                  <span className="font-black text-brand-blue">
                    {selected.name}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  ID: <span className="font-mono">{selected._id}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {perms.map((p) => {
                  const checked = selectedPerms.has(p);
                  return (
                    <label
                      key={p}
                      className={`relative flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
                        checked
                          ? "border-brand-blue bg-gradient-to-r from-brand-blue/10 to-blue-100/20"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex h-5 items-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePerm(p)}
                          className="sr-only peer"
                        />
                        <div
                          className={`h-5 w-5 rounded border ${
                            checked
                              ? "border-brand-blue bg-brand-blue"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {checked && (
                            <Check className="h-4 w-4 p-0.5 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 break-words">
                          {p}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Permission to {p.split(".").pop()?.toLowerCase()}
                        </div>
                      </div>
                      <div
                        className={`h-2 w-2 rounded-full ${checked ? "bg-brand-blue" : "bg-gray-300"}`}
                      ></div>
                    </label>
                  );
                })}
              </div>

              <div className="rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50/80 to-yellow-100/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <div className="font-medium text-gray-900">
                      Important Note
                    </div>
                    <div className="mt-1">
                      Changes apply on next token refresh/login. Users may need
                      to logout/login to get updated permissions immediately.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <Shield className="h-12 w-12 text-gray-400" />
                <div className="text-sm text-gray-500">
                  Select a role from the left panel to manage permissions
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      <Modal
        open={openCreate}
        title="Create New Role"
        onClose={() => setOpenCreate(false)}
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Create a new role with custom permissions. Permissions can be
            configured after creation.
          </div>
          <Input
            label="Role name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="border-gray-300"
            placeholder="e.g., Manager, Supervisor, Auditor"
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setOpenCreate(false)}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={createRole}
              className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow"
            >
              Create Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
