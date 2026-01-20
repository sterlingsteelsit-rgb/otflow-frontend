import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../auth/AuthContext";
import {
  UserPlus,
  Edit2,
  Trash2,
  Undo,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type EmployeeRow = {
  _id: string;
  empId: string;
  name: string;
  email?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
};

export function EmployeesPage() {
  const { has } = useAuth();

  const [items, setItems] = useState<EmployeeRow[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState("");

  const [showEmail, setShowEmail] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);

  const [form, setForm] = useState({ empId: "", name: "", email: "" });
  const [showOptional, setShowOptional] = useState(false);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  async function loadEmployees() {
    const r = await api.get("/employees", {
      params: {
        page,
        limit,
        search: search || undefined,
        includeDeleted: includeDeleted ? "true" : undefined,
      },
    });
    setItems(r.data.items);
    setTotal(r.data.total);
  }

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, includeDeleted]);

  async function onSearch() {
    setPage(1);
    await loadEmployees();
  }

  function openCreate() {
    setEditing(null);
    setForm({ empId: "", name: "", email: "" });
    setShowOptional(false);
    setOpen(true);
  }

  function openEdit(emp: EmployeeRow) {
    if (emp.isDeleted) {
      toast.error("This employee is deleted. Restore first.");
      return;
    }
    setEditing(emp);
    setForm({ empId: emp.empId, name: emp.name, email: emp.email ?? "" });
    setShowOptional(!!emp.email);
    setOpen(true);
  }

  async function save() {
    const t = toast.loading(
      editing ? "Updating employee..." : "Creating employee...",
    );

    try {
      if (!editing && !form.empId.trim()) {
        toast.error("empId is required", { id: t });
        return;
      }
      if (!form.name.trim()) {
        toast.error("name is required", { id: t });
        return;
      }

      if (!editing) {
        await api.post("/employees", {
          empId: form.empId.trim(),
          name: form.name.trim(),
          email:
            showOptional && form.email.trim() ? form.email.trim() : undefined,
        });
      } else {
        await api.patch(`/employees/${editing._id}`, {
          name: form.name.trim(),
          email: showOptional ? form.email.trim() || undefined : undefined,
        });
      }

      toast.success("Saved", { id: t });
      setOpen(false);
      await loadEmployees();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  async function delEmp(emp: EmployeeRow) {
    if (emp.isDeleted) return;
    if (!confirm(`Delete employee ${emp.empId}? (safe delete)`)) return;

    const t = toast.loading("Deleting...");
    try {
      await api.patch(`/employees/${emp._id}/delete`);
      toast.success("Deleted", { id: t });
      await loadEmployees();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  async function restoreEmp(emp: EmployeeRow) {
    if (!emp.isDeleted) return;

    const t = toast.loading("Restoring...");
    try {
      await api.patch(`/employees/${emp._id}/restore`);
      toast.success("Restored", { id: t });
      await loadEmployees();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Employees
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            Manage employee records and information
          </div>
        </div>
        {has("employees.create") ? (
          <Button
            onClick={openCreate}
            variant="ghost"
            icon={<UserPlus className="h-4 w-4" />}
            iconPosition="left"
            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
          >
            Create Employee
          </Button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input
            label="Search"
            placeholder="empId or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-gray-300"
          />

          <div className="flex items-end">
            <Button
              variant="ghost"
              icon={<Search className="h-4 w-4" />}
              iconPosition="left"
              className="w-full text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
              onClick={onSearch}
            >
              Search
            </Button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                Show deleted
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                Show email column
              </span>
            </label>
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
                  Emp ID
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Name
                </th>
                {showEmail ? (
                  <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                    Email
                  </th>
                ) : null}
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Status
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {items.map((emp) => (
                <tr
                  key={emp._id}
                  className="transition-all duration-150 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue/20 to-blue-100/50">
                        <User className="h-4 w-4 text-brand-blue" />
                      </div>
                      <div>
                        <div className="font-black text-gray-900">
                          {emp.empId}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created {new Date(emp.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{emp.name}</div>
                  </td>

                  {showEmail ? (
                    <td className="px-5 py-4 text-gray-700">
                      {emp.email ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                          <span className="font-medium">{emp.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  ) : null}

                  <td className="px-5 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${emp.isDeleted ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
                    >
                      {emp.isDeleted ? (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                          Deleted
                        </>
                      ) : (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                          Active
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {has("employees.update") ? (
                        <Button
                          variant="ghost"
                          onClick={() => openEdit(emp)}
                          disabled={!!emp.isDeleted}
                          title={emp.isDeleted ? "Restore to edit" : "Edit"}
                          icon={<Edit2 className="h-3 w-3" />}
                          iconPosition="left"
                          className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit
                        </Button>
                      ) : null}

                      {!emp.isDeleted && has("employees.delete") ? (
                        <Button
                          variant="ghost"
                          onClick={() => delEmp(emp)}
                          icon={<Trash2 className="h-3 w-3" />}
                          iconPosition="left"
                          className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                        >
                          Delete
                        </Button>
                      ) : null}

                      {emp.isDeleted && has("employees.restore") ? (
                        <Button
                          variant="ghost"
                          onClick={() => restoreEmp(emp)}
                          icon={<Undo className="h-3 w-3" />}
                          iconPosition="left"
                          className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                        >
                          Restore
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
                    colSpan={showEmail ? 5 : 4}
                  >
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8">
                      <div className="text-sm text-gray-500">
                        No employees found
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
            employees
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              icon={<ChevronLeft className="h-4 w-4" />}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </Button>

            <Button
              variant="ghost"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              icon={<ChevronRight className="h-4 w-4" />}
              iconPosition="right"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={editing ? "Edit Employee" : "Create Employee"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label="Emp ID"
            value={form.empId}
            disabled={!!editing}
            onChange={(ev) =>
              setForm((s) => ({ ...s, empId: ev.target.value }))
            }
            className="border-gray-300"
          />

          <Input
            label="Name"
            value={form.name}
            onChange={(ev) => setForm((s) => ({ ...s, name: ev.target.value }))}
            className="border-gray-300"
          />

          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Optional fields
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowOptional((v) => !v)}
                iconPosition="left"
                className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
              >
                {showOptional ? "Hide" : "Add email"}
              </Button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Additional information for the employee
            </div>
          </div>

          {showOptional ? (
            <Input
              label="Email (optional)"
              value={form.email}
              onChange={(ev) =>
                setForm((s) => ({ ...s, email: ev.target.value }))
              }
              className="border-gray-300"
            />
          ) : null}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow"
            >
              {editing ? "Save Changes" : "Create Employee"}
            </Button>
          </div>

          {editing ? (
            <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
              Note: Emp ID cannot be changed after creation.
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
