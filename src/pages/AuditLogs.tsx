/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SelectField } from "../components/ui/SelectField";
import { useAuth } from "../auth/AuthContext";
import {
  Eye,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  FileText,
  RefreshCw,
} from "lucide-react";

type AuditRow = {
  _id: string;
  createdAt: string;
  actorUserId?: { username?: string; email?: string } | null;
  action: string;
  entityType: string;
  entityId: string;
};

const ENTITY_TYPES = [
  { label: "All Types", value: "" },
  { label: "OT Entry", value: "OT_ENTRY" },
  { label: "Employee", value: "EMPLOYEE" },
  { label: "User", value: "USER" },
  { label: "Role", value: "ROLE" },
  { label: "Triple OT", value: "TRIPLE_OT" },
];

export function AuditLogsPage() {
  const { has } = useAuth();
  const canRead = has("audit.read");

  const [items, setItems] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 50;

  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    if (!canRead) return;
    setLoading(true);
    try {
      const r = await api.get("/audit", {
        params: {
          page,
          limit,
          entityType: entityType || undefined,
          entityId: entityId.trim() || undefined,
          from: from || undefined,
          to: to || undefined,
        },
      });
      setItems(r.data.items ?? []);
      setTotal(r.data.total ?? 0);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead, page]);

  if (!canRead)
    return (
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Shield className="h-12 w-12 text-gray-400" />
          <div className="text-lg font-black text-gray-900">Audit Logs</div>
          <div className="text-sm text-gray-600">
            You don&apos;t have permission to view audit logs.
          </div>
        </div>
      </div>
    );

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Audit Logs
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            Track all system activities and changes
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={load}
          icon={<RefreshCw className="h-4 w-4" />}
          iconPosition="left"
          className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <SelectField
            label="Entity Type"
            value={entityType}
            onValueChange={(v) => setEntityType(v)}
            options={ENTITY_TYPES.map((x) => ({
              label: x.label,
              value: x.value,
            }))}
            className="border-gray-300"
          />
          <Input
            label="Entity ID"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="border-gray-300"
            placeholder="Search by ID..."
          />
          <Input
            label="From Date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border-gray-300"
          />
          <Input
            label="To Date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border-gray-300"
          />

          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => {
                setPage(1);
                load();
              }}
              icon={<Filter className="h-4 w-4" />}
              iconPosition="left"
              className="w-full text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200/50 px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white/80">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-brand-blue" />
            <div className="font-black text-gray-900">Audit Logs</div>
          </div>
          <div className="text-xs text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">{pages}</span> •{" "}
            <span className="font-semibold text-gray-900">{total}</span> total
            logs
            {loading && (
              <span className="ml-2">
                • <RefreshCw className="h-3 w-3 animate-spin inline" />
              </span>
            )}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white/80">
              <tr className="text-left">
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Timestamp
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Actor
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Action
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Entity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((a) => (
                <tr
                  key={a._id}
                  className="transition-all duration-150 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue/20 to-blue-100/50">
                        <Clock className="h-4 w-4 text-brand-blue" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(a.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-purple-100/50">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {a.actorUserId?.username ??
                            a.actorUserId?.email ??
                            "System"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {a.actorUserId?.email ? "User" : "System"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                        a.action.includes("CREATE")
                          ? "bg-green-50 text-green-700"
                          : a.action.includes("UPDATE") ||
                              a.action.includes("EDIT")
                            ? "bg-blue-50 text-blue-700"
                            : a.action.includes("DELETE") ||
                                a.action.includes("REMOVE")
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {a.action.includes("CREATE") && "➕"}
                      {a.action.includes("UPDATE") && "✏️"}
                      {a.action.includes("DELETE") && "🗑️"}
                      {a.action}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          a.entityType === "OT_ENTRY"
                            ? "bg-gradient-to-br from-blue-500/20 to-blue-100/50"
                            : a.entityType === "EMPLOYEE"
                              ? "bg-gradient-to-br from-green-500/20 to-green-100/50"
                              : a.entityType === "USER"
                                ? "bg-gradient-to-br from-purple-500/20 to-purple-100/50"
                                : "bg-gradient-to-br from-gray-500/20 to-gray-100/50"
                        }`}
                      >
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {a.entityType}
                        </div>
                        <div className="text-xs font-mono text-gray-500">
                          {a.entityId.substring(0, 12)}...
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-gray-500"
                    colSpan={4}
                  >
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8">
                      <div className="text-sm text-gray-500">
                        No audit logs found.
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Try adjusting your filters or check back later
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
          <div className="text-xs text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">{pages}</span>
          </div>
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
  );
}
