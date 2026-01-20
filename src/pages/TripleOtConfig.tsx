/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../auth/AuthContext";
import {
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
  FileText,
} from "lucide-react";

type TripleRow = {
  _id: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
};

export function TripleOtConfigPage() {
  const { has } = useAuth();

  const canRead = has("tripleOt.read");
  const canCreate = has("tripleOt.create");
  const canDelete = has("tripleOt.delete");

  const [items, setItems] = useState<TripleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => a.date.localeCompare(b.date));
  }, [items]);

  async function load() {
    if (!canRead) return;
    setLoading(true);
    try {
      const r = await api.get("/triple-ot");
      setItems(r.data.items ?? []);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ?? "Failed to load triple OT dates",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead]);

  function openAdd() {
    setDate("");
    setNote("");
    setOpen(true);
  }

  async function add() {
    if (!canCreate) return toast.error("No permission");
    if (!date) return toast.error("Pick a date");
    const t = toast.loading("Adding...");
    try {
      await api.post("/triple-ot", {
        date,
        note: note.trim() ? note.trim() : undefined,
      });
      toast.success("Added", { id: t });
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  async function del(row: TripleRow) {
    if (!canDelete) return toast.error("No permission");
    if (!confirm(`Remove triple OT date ${row.date}?`)) return;
    const t = toast.loading("Removing...");
    try {
      await api.delete(`/triple-ot/${row._id}`);
      toast.success("Removed", { id: t });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  if (!canRead)
    return (
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <AlertTriangle className="h-5 w-5" />
          <div className="text-sm">No permission to view triple OT dates.</div>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Triple OT Configuration
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            Manage dates designated for triple overtime rates
          </div>
        </div>
        {canCreate ? (
          <Button
            onClick={openAdd}
            variant="ghost"
            icon={<Plus className="h-4 w-4" />}
            iconPosition="left"
            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
          >
            Add Date
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-yellow-50/80 to-orange-100/50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <div className="text-sm font-black text-gray-900">
              Triple OT Dates
            </div>
            <div className="mt-1 text-sm text-gray-700">
              Dates listed here will be treated as{" "}
              <span className="font-semibold text-orange-700">Triple OT</span>{" "}
              by the backend. These dates override normal/double OT
              calculations.
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200/50 px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white/80">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-orange-600" />
            <div className="font-black text-gray-900">Triple OT Dates</div>
          </div>
          <div className="text-xs text-gray-600">
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : (
              `${sorted.length} date(s)`
            )}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white/80">
              <tr className="text-left">
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Date
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Note
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Created
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((r) => (
                <tr
                  key={r._id}
                  className="transition-all duration-150 hover:bg-gradient-to-r hover:from-orange-50/30 hover:to-yellow-100/20"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-100/50">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-black text-gray-900">{r.date}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(r.date).toLocaleDateString(undefined, {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {r.note ? (
                      <div className="flex items-start gap-2 max-w-xs">
                        <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-gray-700">{r.note}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {canDelete ? (
                      <Button
                        variant="ghost"
                        onClick={() => del(r)}
                        icon={<Trash2 className="h-3 w-3" />}
                        iconPosition="left"
                        className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                      >
                        Delete
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}

              {!loading && sorted.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-gray-500"
                    colSpan={4}
                  >
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8">
                      <div className="text-sm text-gray-500">
                        No triple OT dates configured yet.
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Click "Add Date" to add triple OT dates
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        title="Add Triple OT Date"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-gray-300"
          />
          <Input
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="border-gray-300"
          />
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
              onClick={add}
              className="rounded-lg border border-orange-500 bg-gradient-to-r from-orange-500 to-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-orange-600 hover:to-yellow-700 hover:shadow"
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
