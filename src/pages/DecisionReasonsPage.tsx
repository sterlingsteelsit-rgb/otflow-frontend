/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { SelectField } from "../components/ui/SelectField";
import { useAuth } from "../auth/AuthContext";
import {
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUpDown,
  Shield,
} from "lucide-react";

type ReasonType = "APPROVE" | "REJECT";

type ReasonRow = {
  _id: string;
  type: ReasonType;
  label: string;
  active: boolean;
  sort: number;
  createdAt?: string;
  updatedAt?: string;
};

type EditForm = {
  id?: string;
  type: ReasonType;
  label: string;
  active: boolean;
  sort: number;
};

const TYPE_OPTIONS = [
  { label: "Approve Reasons", value: "APPROVE" },
  { label: "Reject Reasons", value: "REJECT" },
] as const;

function safeNum(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function DecisionReasonsPage() {
  const { has, state } = useAuth();

  const authReady = !state.loading && !!state.accessToken;

  const canRead = has("reasons.read");
  const canCreate = has("reasons.create");
  const canUpdate = has("reasons.update");
  const canDelete = has("reasons.delete");

  const [activeTab, setActiveTab] = useState<ReasonType>("APPROVE");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReasonRow[]>([]);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({
    type: "APPROVE",
    label: "",
    active: true,
    sort: 0,
  });

  const tabItems = useMemo(
    () => items.filter((x) => x.type === activeTab),
    [items, activeTab],
  );

  async function load() {
    if (!canRead) return;
    setLoading(true);
    try {
      const r = await api.get("/decision-reasons", {
        params: { type: activeTab },
      });
      setItems(r.data.items ?? []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load reasons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    if (!canRead) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, canRead, activeTab]);

  function openCreate() {
    if (!canCreate) return toast.error("No permission to create reasons");
    setForm({ type: activeTab, label: "", active: true, sort: 0 });
    setModalOpen(true);
  }

  function openEdit(r: ReasonRow) {
    if (!canUpdate) return toast.error("No permission to update reasons");
    setForm({
      id: r._id,
      type: r.type,
      label: r.label,
      active: r.active,
      sort: safeNum(r.sort, 0),
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.label.trim()) return toast.error("Reason label is required");

    setSaving(true);
    const t = toast.loading(form.id ? "Updating..." : "Creating...");
    try {
      const payload = {
        type: form.type,
        label: form.label.trim(),
        active: form.active,
        sort: safeNum(form.sort, 0),
      };

      if (form.id) {
        // update
        await api.patch(`/decision-reasons/${form.id}`, {
          label: payload.label,
          active: payload.active,
          sort: payload.sort,
        });
      } else {
        // create
        await api.post("/decision-reasons", payload);
      }

      toast.success(form.id ? "Updated" : "Created", { id: t });
      setModalOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(r: ReasonRow) {
    if (!canUpdate) return toast.error("No permission to update reasons");
    const t = toast.loading("Updating...");
    try {
      await api.patch(`/decision-reasons/${r._id}`, { active: !r.active });
      toast.success("Updated", { id: t });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  async function remove(r: ReasonRow) {
    if (!canDelete) return toast.error("No permission to delete reasons");
    if (!confirm(`Delete reason: "${r.label}" ?`)) return;

    const t = toast.loading("Deleting...");
    try {
      await api.delete(`/decision-reasons/${r._id}`);
      toast.success("Deleted", { id: t });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  if (!authReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Shield className="h-12 w-12 text-gray-400" />
          <div className="text-lg font-black text-gray-900">
            Decision Reasons
          </div>
          <div className="text-sm text-gray-600">
            You don&apos;t have permission to view this page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Decision Reasons
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            Manage dynamic approve/reject reasons used in OT decisions.
          </div>
        </div>

        {canCreate ? (
          <Button
            onClick={openCreate}
            variant="ghost"
            icon={<Plus className="h-4 w-4" />}
            iconPosition="left"
            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
          >
            Add Reason
          </Button>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 bg-gray-50/50 w-fit">
        {TYPE_OPTIONS.map((t) => {
          const is = activeTab === t.value;
          const Icon = t.value === "APPROVE" ? CheckCircle : XCircle;
          return (
            <Button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              variant={is ? "ghost" : "ghost"}
              icon={<Icon className="h-4 w-4" />}
              iconPosition="left"
              className={`font-black border ${
                is
                  ? "border-brand-blue bg-gradient-to-r from-brand-blue/10 to-blue-100/30 text-brand-blue"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </Button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200/50 px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white/80">
          <div className="flex items-center gap-3">
            {activeTab === "APPROVE" ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <div className="font-black text-gray-900">
              {activeTab === "APPROVE" ? "Approve" : "Reject"} Reasons
            </div>
          </div>
          <div className="text-xs text-gray-600">
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : (
              `${tabItems.length} item(s)`
            )}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white/80">
              <tr className="text-left">
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Label
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Sort
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
              {tabItems.map((r) => (
                <tr
                  key={r._id}
                  className="transition-all duration-150 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${r.type === "APPROVE" ? "bg-gradient-to-br from-green-500/20 to-green-100/50" : "bg-gradient-to-br from-red-500/20 to-red-100/50"}`}
                      >
                        {r.type === "APPROVE" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-black text-gray-900">
                          {r.label}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {r._id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-gray-400" />
                      <div className="font-medium text-gray-900">
                        {safeNum(r.sort, 0)}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        r.active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {r.active ? (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                          Active
                        </>
                      ) : (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-500"></div>
                          Inactive
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canUpdate ? (
                        <Button
                          variant="ghost"
                          onClick={() => openEdit(r)}
                          icon={<Edit2 className="h-3 w-3" />}
                          iconPosition="left"
                          className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                        >
                          Edit
                        </Button>
                      ) : null}

                      {canUpdate ? (
                        <Button
                          variant="ghost"
                          onClick={() => toggleActive(r)}
                          title="Enable/Disable"
                          icon={
                            r.active ? (
                              <ToggleLeft className="h-3 w-3" />
                            ) : (
                              <ToggleRight className="h-3 w-3" />
                            )
                          }
                          iconPosition="left"
                          className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                        >
                          {r.active ? "Disable" : "Enable"}
                        </Button>
                      ) : null}

                      {canDelete ? (
                        <Button
                          variant="ghost"
                          onClick={() => remove(r)}
                          icon={<Trash2 className="h-3 w-3" />}
                          iconPosition="left"
                          className="text-red-700 font-black border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && tabItems.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-gray-500"
                    colSpan={4}
                  >
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8">
                      <div className="text-sm text-gray-500">
                        No reasons found for this category.
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Click "Add Reason" to create a new one
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        title={form.id ? "Edit Reason" : "Add Reason"}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <SelectField
            label="Type"
            value={form.type}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, type: v as ReasonType }))
            }
            options={[
              { label: "Approve", value: "APPROVE" },
              { label: "Reject", value: "REJECT" },
            ]}
            className="border-gray-300"
          />

          <Input
            label="Label"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Approved by supervisor"
            className="border-gray-300"
          />

          <Input
            label="Sort (lower first)"
            type="number"
            value={String(form.sort)}
            onChange={(e) =>
              setForm((f) => ({ ...f, sort: safeNum(e.target.value, 0) }))
            }
            className="border-gray-300"
          />

          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                Active
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {form.id ? "Updating..." : "Creating..."}
                </span>
              ) : form.id ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
