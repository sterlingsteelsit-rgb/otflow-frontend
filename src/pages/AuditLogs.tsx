/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo, type JSX } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SelectField } from "../components/ui/SelectField";
import { Modal } from "../components/ui/Modal";
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
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Key,
  Database,
  Download,
  Upload,
  Users,
  Settings,
  Search,
  Calendar,
  Info,
  Copy,
  ArrowLeftRight,
  Tag,
  Link,
  Globe,
} from "lucide-react";

type AuditRow = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  actorUserId?: {
    _id?: string;
    username?: string;
    email?: string;
    name?: string;
  } | null;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, unknown>;
  diff?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  decisionReason?: string;
  route?: string;
  ip?: string;
  userAgent?: string;
};

const ENTITY_TYPES = [
  { label: "All Types", value: "" },
  { label: "OT", value: "OT" },
  { label: "Employee", value: "EMPLOYEE" },
  { label: "User", value: "USER" },
  { label: "Role", value: "ROLE" },
  { label: "Decision Reason", value: "DECISION_REASON" },
  { label: "System", value: "SYSTEM" },
];

const ACTION_TYPES = [
  { label: "All Actions", value: "" },
  { label: "CREATE", value: "CREATE" },
  { label: "UPDATE", value: "UPDATE" },
  { label: "DELETE", value: "DELETE" },
  { label: "APPROVE", value: "APPROVE" },
  { label: "REJECT", value: "REJECT" },
  { label: "LOGIN", value: "LOGIN" },
  { label: "LOGOUT", value: "LOGOUT" },
  { label: "VIEW", value: "VIEW" },
  { label: "EXPORT", value: "EXPORT" },
  { label: "IMPORT", value: "IMPORT" },
];

// Helper functions
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

function truncateId(id: string, length: number = 8) {
  return id.length > length ? `${id.substring(0, length)}...` : id;
}

function formatActionLabel(action: string) {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function getActionIcon(action: string) {
  const upperAction = action.toUpperCase();

  if (
    upperAction.includes("CREATE") ||
    upperAction.includes("ADD") ||
    upperAction.includes("INSERT")
  ) {
    return <Plus className="h-3 w-3" />;
  }
  if (
    upperAction.includes("UPDATE") ||
    upperAction.includes("EDIT") ||
    upperAction.includes("MODIFY")
  ) {
    return <Pencil className="h-3 w-3" />;
  }
  if (
    upperAction.includes("DELETE") ||
    upperAction.includes("REMOVE") ||
    upperAction.includes("DESTROY")
  ) {
    return <Trash2 className="h-3 w-3" />;
  }
  if (
    upperAction.includes("VIEW") ||
    upperAction.includes("READ") ||
    upperAction.includes("SHOW")
  ) {
    return <Eye className="h-3 w-3" />;
  }
  if (
    upperAction.includes("APPROVE") ||
    upperAction.includes("ACCEPT") ||
    upperAction.includes("CONFIRM")
  ) {
    return <CheckCircle className="h-3 w-3" />;
  }
  if (
    upperAction.includes("REJECT") ||
    upperAction.includes("DECLINE") ||
    upperAction.includes("DENY")
  ) {
    return <XCircle className="h-3 w-3" />;
  }
  if (upperAction.includes("LOGIN") || upperAction.includes("AUTHENTICATE")) {
    return <Key className="h-3 w-3" />;
  }
  if (upperAction.includes("LOGOUT")) {
    return <Key className="h-3 w-3 rotate-180" />;
  }
  if (upperAction.includes("EXPORT") || upperAction.includes("DOWNLOAD")) {
    return <Download className="h-3 w-3" />;
  }
  if (upperAction.includes("IMPORT") || upperAction.includes("UPLOAD")) {
    return <Upload className="h-3 w-3" />;
  }
  if (upperAction.includes("USER") || upperAction.includes("EMPLOYEE")) {
    return <Users className="h-3 w-3" />;
  }
  if (upperAction.includes("SETTING") || upperAction.includes("CONFIG")) {
    return <Settings className="h-3 w-3" />;
  }

  return <FileText className="h-3 w-3" />;
}

function getActionStyle(action: string) {
  const upperAction = action.toUpperCase();

  if (
    upperAction.includes("CREATE") ||
    upperAction.includes("ADD") ||
    upperAction.includes("INSERT")
  ) {
    return "bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-800 border border-emerald-200";
  }
  if (
    upperAction.includes("UPDATE") ||
    upperAction.includes("EDIT") ||
    upperAction.includes("MODIFY")
  ) {
    return "bg-gradient-to-r from-blue-50 to-sky-50 text-sky-800 border border-sky-200";
  }
  if (
    upperAction.includes("DELETE") ||
    upperAction.includes("REMOVE") ||
    upperAction.includes("DESTROY")
  ) {
    return "bg-gradient-to-r from-red-50 to-rose-50 text-rose-800 border border-rose-200";
  }
  if (
    upperAction.includes("VIEW") ||
    upperAction.includes("READ") ||
    upperAction.includes("SHOW")
  ) {
    return "bg-gradient-to-r from-purple-50 to-violet-50 text-violet-800 border border-violet-200";
  }
  if (
    upperAction.includes("APPROVE") ||
    upperAction.includes("ACCEPT") ||
    upperAction.includes("CONFIRM")
  ) {
    return "bg-gradient-to-r from-emerald-50 to-teal-50 text-teal-800 border border-teal-200";
  }
  if (
    upperAction.includes("REJECT") ||
    upperAction.includes("DECLINE") ||
    upperAction.includes("DENY")
  ) {
    return "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border border-amber-200";
  }
  if (
    upperAction.includes("LOGIN") ||
    upperAction.includes("LOGOUT") ||
    upperAction.includes("AUTH")
  ) {
    return "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-800 border border-indigo-200";
  }
  if (upperAction.includes("EXPORT") || upperAction.includes("DOWNLOAD")) {
    return "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-800 border border-cyan-200";
  }
  if (upperAction.includes("IMPORT") || upperAction.includes("UPLOAD")) {
    return "bg-gradient-to-r from-teal-50 to-green-50 text-teal-800 border border-teal-200";
  }

  return "bg-gradient-to-r from-gray-50 to-slate-50 text-slate-800 border border-slate-200";
}

function getEntityIcon(entityType: string) {
  const upperType = entityType.toUpperCase();

  if (upperType.includes("OT")) {
    return <Clock className="h-4 w-4 text-blue-600" />;
  }
  if (upperType.includes("EMPLOYEE")) {
    return <Users className="h-4 w-4 text-green-600" />;
  }
  if (upperType.includes("USER")) {
    return <User className="h-4 w-4 text-purple-600" />;
  }
  if (upperType.includes("ROLE")) {
    return <Shield className="h-4 w-4 text-red-600" />;
  }
  if (upperType.includes("DECISION")) {
    return <FileText className="h-4 w-4 text-amber-600" />;
  }

  return <Database className="h-4 w-4 text-gray-600" />;
}

function getEntityStyle(entityType: string) {
  const upperType = entityType.toUpperCase();

  if (upperType.includes("OT")) {
    return "bg-gradient-to-br from-blue-500/20 to-blue-100/50";
  }
  if (upperType.includes("EMPLOYEE")) {
    return "bg-gradient-to-br from-green-500/20 to-green-100/50";
  }
  if (upperType.includes("USER")) {
    return "bg-gradient-to-br from-purple-500/20 to-purple-100/50";
  }
  if (upperType.includes("ROLE")) {
    return "bg-gradient-to-br from-red-500/20 to-red-100/50";
  }
  if (upperType.includes("DECISION")) {
    return "bg-gradient-to-br from-amber-500/20 to-amber-100/50";
  }

  return "bg-gradient-to-br from-gray-500/20 to-gray-100/50";
}

// Helper to render changes in a user-friendly way
function renderChanges(diff?: { before?: any; after?: any }) {
  if (!diff) return null;

  const changes: JSX.Element[] = [];

  // Handle before changes
  if (diff.before) {
    Object.entries(diff.before).forEach(([key, value]) => {
      const afterValue = diff.after?.[key];
      if (JSON.stringify(value) !== JSON.stringify(afterValue)) {
        changes.push(
          <div
            key={`change-${key}`}
            className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
          >
            <div className="font-medium text-gray-900 mb-1">
              {formatFieldName(key)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-red-600 font-medium mb-1">
                  Before:
                </div>
                <div className="text-sm bg-red-50 p-2 rounded border border-red-100">
                  {renderValue(value)}
                </div>
              </div>
              <div>
                <div className="text-xs text-green-600 font-medium mb-1">
                  After:
                </div>
                <div className="text-sm bg-green-50 p-2 rounded border border-green-100">
                  {renderValue(afterValue)}
                </div>
              </div>
            </div>
          </div>,
        );
      }
    });
  }

  // Handle new fields (only in after)
  if (diff.after) {
    Object.entries(diff.after).forEach(([key, value]) => {
      if (!diff.before?.[key]) {
        changes.push(
          <div
            key={`new-${key}`}
            className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
          >
            <div className="font-medium text-gray-900 mb-1">
              New: {formatFieldName(key)}
            </div>
            <div className="text-sm bg-white p-2 rounded border border-blue-100">
              {renderValue(value)}
            </div>
          </div>,
        );
      }
    });
  }

  if (changes.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <div>No specific field changes detected</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">{changes}</div>
  );
}

function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/Id\b/g, "ID")
    .replace(/Ot\b/g, "OT");
}

function renderValue(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "Empty";
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

// Helper to render metadata in a user-friendly way
function renderMetadata(meta?: Record<string, unknown>) {
  if (!meta || Object.keys(meta).length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <div>No additional metadata</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
      {Object.entries(meta).map(([key, value]) => (
        <div
          key={key}
          className="p-3 rounded-lg bg-gray-50 border border-gray-200"
        >
          <div className="font-medium text-gray-900 mb-1">
            {formatFieldName(key)}
          </div>
          <div className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-100 break-words">
            {key.toLowerCase().includes("route") ? (
              <div className="flex items-center gap-2">
                <Link className="h-3 w-3 text-blue-500" />
                <code className="font-mono text-xs">{String(value)}</code>
              </div>
            ) : key.toLowerCase().includes("ip") ? (
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-green-500" />
                <span>{String(value)}</span>
              </div>
            ) : (
              renderValue(value)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuditLogsPage() {
  const { has } = useAuth();
  const canRead = has("audit.read");

  const [items, setItems] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 20;

  const [entityType, setEntityType] = useState("");
  const [actionType, setActionType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditRow | null>(null);

  async function load() {
    if (!canRead) return;
    setLoading(true);
    try {
      const r = await api.get("/audit", {
        params: {
          page,
          limit,
          entityType: entityType || undefined,
          action: actionType || undefined,
          entityId: entityId.trim() || undefined,
          actorUserId: actor.trim() || undefined,
          from: from || undefined,
          to: to || undefined,
          sort: "-createdAt",
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

  async function exportToExcel() {
    if (!canRead) return;
    setExporting(true);
    try {
      const params = {
        entityType: entityType || undefined,
        action: actionType || undefined,
        entityId: entityId.trim() || undefined,
        actorUserId: actor.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
      };

      const r = await api.get("/audit/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([r.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const cd = r.headers?.["content-disposition"] as string | undefined;
      let filename = `audit_logs_${new Date().toISOString().split("T")[0]}.xlsx`;
      const match = cd?.match(/filename="([^"]+)"/);
      if (match?.[1]) filename = match[1];

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Audit logs exported successfully");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to export logs");
    } finally {
      setExporting(false);
    }
  }

  function openDetailModal(log: AuditRow) {
    setSelectedLog(log);
    setDetailModalOpen(true);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy");
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead, page]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const todayCount = items.filter(
      (item) => new Date(item.createdAt) >= today,
    ).length;

    const last7DaysCount = items.filter(
      (item) => new Date(item.createdAt) >= last7Days,
    ).length;

    const createCount = items.filter((item) =>
      item.action.toUpperCase().includes("CREATE"),
    ).length;

    const updateCount = items.filter((item) =>
      item.action.toUpperCase().includes("UPDATE"),
    ).length;

    const deleteCount = items.filter((item) =>
      item.action.toUpperCase().includes("DELETE"),
    ).length;

    const approveCount = items.filter((item) =>
      item.action.toUpperCase().includes("APPROVE"),
    ).length;

    const rejectCount = items.filter((item) =>
      item.action.toUpperCase().includes("REJECT"),
    ).length;

    return {
      todayCount,
      last7DaysCount,
      createCount,
      updateCount,
      deleteCount,
      approveCount,
      rejectCount,
      total: items.length,
    };
  }, [items]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Audit Logs
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            Track all system activities and changes
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={exportToExcel}
            icon={<Download className="h-4 w-4" />}
            iconPosition="left"
            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            disabled={exporting || items.length === 0}
          >
            {exporting ? "Exporting..." : "Export Excel"}
          </Button>
          <Button
            variant="ghost"
            onClick={load}
            icon={
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            }
            iconPosition="left"
            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Today
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-gray-900">
            {stats.todayCount}
          </div>
          <div className="mt-1 text-xs text-gray-600">Audit logs today</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Last 7 Days
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-gray-900">
            {stats.last7DaysCount}
          </div>
          <div className="mt-1 text-xs text-gray-600">Recent activities</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-500" />
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Creates
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-gray-900">
            {stats.createCount}
          </div>
          <div className="mt-1 text-xs text-gray-600">New records</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-teal-500" />
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Approvals
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-gray-900">
            {stats.approveCount}
          </div>
          <div className="mt-1 text-xs text-gray-600">Approved actions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-2">
            <SelectField
              label="Entity Type"
              value={entityType}
              onValueChange={(v) => setEntityType(v)}
              options={ENTITY_TYPES}
              className="border-gray-300"
            />
          </div>

          <div className="md:col-span-2">
            <SelectField
              label="Action Type"
              value={actionType}
              onValueChange={(v) => setActionType(v)}
              options={ACTION_TYPES}
              className="border-gray-300"
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Entity ID"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="border-gray-300"
              placeholder="Search by ID..."
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Actor"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="border-gray-300"
              placeholder="Username or email"
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="From Date"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border-gray-300"
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="To Date"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border-gray-300"
            />
          </div>

          <div className="md:col-span-12 flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setEntityType("");
                setActionType("");
                setEntityId("");
                setActor("");
                setFrom("");
                setTo("");
                setPage(1);
                setTimeout(load, 100);
              }}
              icon={<Filter className="h-4 w-4" />}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPage(1);
                load();
              }}
              icon={<Search className="h-4 w-4" />}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Search
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
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Details
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Actions
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
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {formatDate(a.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(a.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-purple-100/50">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {a.actorUserId?.username ??
                            a.actorUserId?.email ??
                            "System"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {a.actorUserId?.email || "System User"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${getActionStyle(a.action)}`}
                    >
                      {getActionIcon(a.action)}
                      <span className="uppercase tracking-wide">
                        {formatActionLabel(a.action)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${getEntityStyle(a.entityType)}`}
                      >
                        {getEntityIcon(a.entityType)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">
                          {a.entityType}
                        </div>
                        <div className="text-xs font-mono text-gray-500 truncate">
                          {truncateId(a.entityId, 12)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1 max-w-xs">
                      {a.decisionReason && (
                        <div className="text-xs text-gray-600 truncate">
                          <span className="font-medium">Reason:</span>{" "}
                          {a.decisionReason}
                        </div>
                      )}
                      {a.diff && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Changes:</span>{" "}
                          {Object.keys(a.diff.before || {}).length} fields
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => openDetailModal(a)}
                        icon={<Info className="h-3 w-3" />}
                        iconPosition="left"
                        className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                      >
                        Details
                      </Button>
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
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-400" />
                        <div className="text-sm text-gray-500">
                          No audit logs found.
                        </div>
                        <div className="text-xs text-gray-400">
                          Try adjusting your filters or check back later
                        </div>
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

      {/* Detail Modal */}
      <Modal
        open={detailModalOpen}
        title="Audit Log Details"
        onClose={() => setDetailModalOpen(false)}
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2">
            {/* Header */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white/80 p-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${getEntityStyle(selectedLog.entityType)}`}
                  >
                    {getEntityIcon(selectedLog.entityType)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-gray-900 text-lg truncate">
                      {selectedLog.entityType}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {formatActionLabel(selectedLog.action)}
                    </div>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${getActionStyle(selectedLog.action)} flex-shrink-0`}
                >
                  {getActionIcon(selectedLog.action)}
                  <span className="uppercase tracking-wide truncate">
                    {selectedLog.action}
                  </span>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Timestamps
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(selectedLog.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Updated:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(selectedLog.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Actor Information
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Username:</span>
                      <span className="text-sm font-medium text-gray-900 truncate ml-2">
                        {selectedLog.actorUserId?.username || "System"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium text-gray-900 truncate ml-2">
                        {selectedLog.actorUserId?.email || "N/A"}
                      </span>
                    </div>
                    {selectedLog.actorUserId?._id && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">User ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium text-gray-900">
                            {truncateId(selectedLog.actorUserId._id, 12)}
                          </span>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                selectedLog.actorUserId?._id || "",
                              )
                            }
                            icon={<Copy className="h-3 w-3" />}
                            className="h-5 w-5 p-0 min-h-0"
                            title="Copy User ID"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Database className="h-3 w-3" />
                    Entity Information
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedLog.entityType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Entity ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-gray-900 truncate max-w-[120px]">
                          {selectedLog.entityId}
                        </span>
                        <Button
                          variant="ghost"
                          onClick={() => copyToClipboard(selectedLog.entityId)}
                          icon={<Copy className="h-3 w-3" />}
                          className="h-5 w-5 p-0 min-h-0"
                          title="Copy Entity ID"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Log ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-gray-900 truncate max-w-[120px]">
                          {truncateId(selectedLog._id, 12)}
                        </span>
                        <Button
                          variant="ghost"
                          onClick={() => copyToClipboard(selectedLog._id)}
                          icon={<Copy className="h-3 w-3" />}
                          className="h-5 w-5 p-0 min-h-0"
                          title="Copy Log ID"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLog.decisionReason && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      Decision Reason
                    </div>
                    <div className="text-sm text-gray-900 bg-gray-50 rounded p-3 border border-gray-200">
                      {selectedLog.decisionReason}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Changes Made Section */}
            {selectedLog.diff && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ArrowLeftRight className="h-3 w-3" />
                  Changes Made
                </div>
                {renderChanges(selectedLog.diff)}
              </div>
            )}

            {/* Metadata Section */}
            {selectedLog.meta && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Additional Metadata
                </div>
                {renderMetadata(selectedLog.meta)}
              </div>
            )}

            {/* Footer */}
            <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <Button
                variant="ghost"
                onClick={() =>
                  copyToClipboard(JSON.stringify(selectedLog, null, 2))
                }
                icon={<Copy className="h-4 w-4" />}
                iconPosition="left"
                className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
              >
                Copy JSON
              </Button>
              <Button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
