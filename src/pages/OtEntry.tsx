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
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Moon,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  BarChart3,
  Pencil,
} from "lucide-react";

type EmployeeLite = { _id: string; empId: string; name: string };

type OtRow = {
  _id: string;
  employeeId: EmployeeLite;
  workDate: string;
  shift: string;
  inTime: string;
  outTime: string;
  reason?: string;
  normalMinutes: number;
  doubleMinutes: number;
  tripleMinutes: number;
  isNight: boolean;
  approvedNormalMinutes?: number;
  approvedDoubleMinutes?: number;
  approvedTripleMinutes?: number;
  approvedTotalMinutes?: number;
  isApprovedOverride?: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

type DayStats = {
  date: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hours: { normal: number; double: number; triple: number };
};

type CreateRow = {
  employeeId: string;
  shift: string;
  inTime: string;
  outTime: string;
  reason: string;
};

type AuditRow = {
  _id: string;
  createdAt: string;
  actorUserId?: { username?: string; email?: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, unknown>;
};

type ReasonOpt = { _id: string; label: string };

const SHIFTS = [
  { label: "NO Shift", value: "NO_SHIFT" },
  { label: "Shift 1", value: "Shift 1" },
  { label: "Shift 2", value: "Shift 2" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toYYYYMMDD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function startOfWeekMonday(today: Date) {
  const d = new Date(today);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function minutesToHuman(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}
function sumMinutes(
  r: Pick<OtRow, "normalMinutes" | "doubleMinutes" | "tripleMinutes">,
) {
  return r.normalMinutes + r.doubleMinutes + r.tripleMinutes;
}

export function OtEntryPage() {
  const { has, state } = useAuth();

  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(today));
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const [selectedDate, setSelectedDate] = useState(() => toYYYYMMDD(today));

  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [loadingEmp, setLoadingEmp] = useState(false);

  const [dayItems, setDayItems] = useState<OtRow[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  const [weekStats, setWeekStats] = useState<Record<string, DayStats>>({});

  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<DayStats | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createRows, setCreateRows] = useState<CreateRow[]>([
    { employeeId: "", shift: "Shift 1", inTime: "", outTime: "", reason: "" },
  ]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditTitle, setAuditTitle] = useState("");

  const canReadStats = has("ot.stats.read");
  const canCreate = has("ot.create");
  const canApprove = has("ot.approve");
  const canReject = has("ot.reject");
  const canReadAudit = has("audit.read");

  const authReady = !state.loading && !!state.accessToken;

  const [approveReasons, setApproveReasons] = useState<ReasonOpt[]>([]);
  const [rejectReasons, setRejectReasons] = useState<ReasonOpt[]>([]);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveReasonId, setApproveReasonId] = useState("");
  const [approveReasonText, setApproveReasonText] = useState("");
  const [rejectReasonId, setRejectReasonId] = useState("");

  const [approvedN, setApprovedN] = useState(0);
  const [approvedD, setApprovedD] = useState(0);
  const [approvedT, setApprovedT] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [editShift, setEditShift] = useState("Shift 1");
  const [editInTime, setEditInTime] = useState("");
  const [editOutTime, setEditOutTime] = useState("");
  const [editReason, setEditReason] = useState("");

  async function loadEmployees() {
    setLoadingEmp(true);
    try {
      const r = await api.get("/employees", {
        params: { page: 1, limit: 5000 },
      });
      setEmployees(r.data.items);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load employees");
    } finally {
      setLoadingEmp(false);
    }
  }

  async function loadDay(date: string) {
    setDayLoading(true);
    try {
      const r = await api.get("/ot", {
        params: { from: date, to: date, page: 1, limit: 2000 },
      });
      setDayItems(r.data.items);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load OT entries");
    } finally {
      setDayLoading(false);
    }
  }

  async function loadWeekStats() {
    if (!canReadStats) return;
    const from = toYYYYMMDD(weekDates[0]);
    const to = toYYYYMMDD(weekDates[6]);

    try {
      const r = await api.get("/ot/stats/week", { params: { from, to } });
      const map: Record<string, DayStats> = {};
      for (const it of r.data.items as DayStats[]) map[it.date] = it;
      setWeekStats(map);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load week stats");
    }
  }

  async function fetchReasons(type: "APPROVE" | "REJECT") {
    const r = await api.get("/decision-reasons", {
      params: { type, active: "true" },
    });
    return (r.data.items ?? []) as ReasonOpt[];
  }

  async function openApprove(row: OtRow) {
    if (!canApprove) return toast.error("No permission to approve");
    setActingId(row._id);
    setApproveReasonId("");
    setApproveReasonText("");
    setApprovedN(row.normalMinutes);
    setApprovedD(row.doubleMinutes);
    setApprovedT(row.tripleMinutes);
    setApproveOpen(true);

    try {
      const items = await fetchReasons("APPROVE");
      setApproveReasons(items);
    } catch {
      // ignore, still allow custom text
    }
  }

  async function confirmApprove() {
    if (!actingId) return;
    const selectedLabel =
      approveReasons.find((x) => x._id === approveReasonId)?.label ?? "";

    const finalReason = (
      approveReasonText.trim() ||
      selectedLabel ||
      ""
    ).trim();

    const t = toast.loading("Approving...");
    try {
      await api.patch(`/ot/${actingId}/approve`, {
        reason: finalReason || undefined,
        approvedNormalMinutes: approvedN,
        approvedDoubleMinutes: approvedD,
        approvedTripleMinutes: approvedT,
      });
      toast.success("Approved", { id: t });
      setApproveOpen(false);
      setActingId(null);
      await loadDay(selectedDate);
      await loadWeekStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  useEffect(() => {
    if (!authReady) return;
    loadEmployees();
  }, [authReady]);

  useEffect(() => {
    if (!authReady) return;
    loadDay(selectedDate);
  }, [authReady, selectedDate]);

  useEffect(() => {
    if (!authReady) return;
    loadWeekStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, weekStart, canReadStats]);

  function prevWeek() {
    setWeekStart((d) => addDays(d, -7));
  }
  function nextWeek() {
    setWeekStart((d) => addDays(d, 7));
  }
  function pickDate(d: Date) {
    setSelectedDate(toYYYYMMDD(d));
  }

  function openEdit(row: OtRow) {
    setEditId(row._id);
    setEditShift(row.shift);
    setEditInTime(row.inTime);
    setEditOutTime(row.outTime);
    setEditReason(row.reason || "");
    setEditOpen(true);
  }

  async function openStats(date: string) {
    if (!canReadStats) return;
    setStatsOpen(true);
    setStatsLoading(true);
    try {
      const r = await api.get("/ot/stats/day", { params: { date } });
      setStats(r.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load stats");
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }

  function resetCreate() {
    setCreateRows([
      { employeeId: "", shift: "Shift 1", inTime: "", outTime: "", reason: "" },
    ]);
  }
  function addCreateRow() {
    setCreateRows((rows) => [
      ...rows,
      { employeeId: "", shift: "Shift 1", inTime: "", outTime: "", reason: "" },
    ]);
  }
  function removeCreateRow(i: number) {
    setCreateRows((rows) => rows.filter((_, idx) => idx !== i));
  }
  function setRow(i: number, patch: Partial<CreateRow>) {
    setCreateRows((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }

  async function saveBulk() {
    if (!canCreate) return toast.error("No permission to create OT");

    for (const [idx, r] of createRows.entries()) {
      if (!r.employeeId?.trim())
        return toast.error(`Row ${idx + 1}: select employee`);
      if (!r.shift?.trim()) return toast.error(`Row ${idx + 1}: select shift`);
      if (r.shift !== "NO_SHIFT") {
        if (!r.inTime) return toast.error(`Row ${idx + 1}: in time required`);
        if (!r.outTime) return toast.error(`Row ${idx + 1}: out time required`);
      }
    }

    const t = toast.loading("Saving OT entries...");
    try {
      const payload = {
        workDate: selectedDate,
        rows: createRows.map((r) => ({
          employeeId: r.employeeId,
          shift: r.shift,
          inTime: r.shift === "NO_SHIFT" ? "" : r.inTime,
          outTime: r.shift === "NO_SHIFT" ? "" : r.outTime,
          reason: r.reason?.trim() ? r.reason.trim() : undefined,
        })),
      };

      console.log("Payload:", payload);
      const resp = await api.post("/ot/bulk", payload);
      console.log(resp.data);

      if ((resp.data.insertedCount ?? 0) === 0 && resp.data.errors?.length) {
        toast.error(resp.data.errors[0], { id: t });
        return;
      }
      const inserted = resp.data.insertedCount ?? 0;
      const duplicates = resp.data.duplicates ?? 0;

      toast.success(
        duplicates > 0
          ? `Saved ${inserted}. Skipped ${duplicates} duplicates.`
          : `Saved ${inserted} entries`,
        { id: t },
      );

      setCreateOpen(false);
      resetCreate();
      await loadDay(selectedDate);
      await loadWeekStats();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Failed to save";
      toast.error(msg, { id: t });
    }
  }

  async function confirmEdit() {
    if (!editId) return;

    // Frontend validation to match backend rules
    if (editShift !== "NO_SHIFT") {
      if (!editInTime) return toast.error("In time required");
      if (!editOutTime) return toast.error("Out time required");
    }

    const t = toast.loading("Updating...");
    try {
      await api.patch(`/ot/${editId}`, {
        shift: editShift,
        inTime: editShift === "NO_SHIFT" ? "" : editInTime,
        outTime: editShift === "NO_SHIFT" ? "" : editOutTime,
        reason: editReason?.trim() ? editReason.trim() : undefined,
      });

      toast.success("Updated", { id: t });
      setEditOpen(false);
      setEditId(null);

      await loadDay(selectedDate);
      await loadWeekStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to update", { id: t });
    }
  }

  async function openReject(row: OtRow) {
    if (!has("ot.reject")) return toast.error("No permission to reject");
    setActingId(row._id);
    setRejectReason("");
    setRejectOpen(true);
    setRejectReasonId("");
    setRejectReason("");
    setRejectOpen(true);
    try {
      const items = await fetchReasons("REJECT");
      setRejectReasons(items);
    } catch {
      console.error("Failed to load reject reasons");
    }
  }

  async function confirmReject() {
    if (!actingId) return;
    if (!canReject) return toast.error("No permission to reject");

    const t = toast.loading("Rejecting...");

    const selectedLabel =
      rejectReasons.find((x) => x._id === rejectReasonId)?.label ?? "";

    const finalReason = (rejectReason.trim() || selectedLabel || "").trim();
    try {
      await api.patch(`/ot/${actingId}/reject`, {
        reason: finalReason || undefined,
      });
      toast.success("Rejected", { id: t });
      setRejectOpen(false);
      setActingId(null);
      await loadDay(selectedDate);
      await loadWeekStats();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  // ---- Audit (per record) - do NOT force entityType, use entityId only
  async function openAuditForOt(row: OtRow) {
    if (!has("audit.read"))
      return toast.error("No permission to view audit logs");

    setAuditTitle(`Audit - ${row.employeeId.empId} (${row.workDate})`);
    setAuditOpen(true);
    setAuditLoading(true);
    setAuditRows([]);

    try {
      const r = await api.get("/audit", {
        params: { entityId: row._id, page: 1, limit: 50 },
      });
      setAuditRows(r.data.items ?? []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load audit");
    } finally {
      setAuditLoading(false);
    }
  }

  const selectedDayLabel = useMemo(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            OT Entry
          </h1>
          <div className="mt-1 text-sm text-gray-600">{selectedDayLabel}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={prevWeek}
            icon={<ChevronLeft className="h-4 w-4" />}
            iconPosition="left"
            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
          >
            Prev Week
          </Button>
          <Button
            variant="ghost"
            onClick={nextWeek}
            icon={<ChevronRight className="h-4 w-4" />}
            iconPosition="right"
            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
          >
            Next Week
          </Button>

          {canCreate ? (
            <Button
              onClick={() => {
                resetCreate();
                setCreateOpen(true);
              }}
              variant="ghost"
              icon={<Plus className="h-4 w-4" />}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Add OT
            </Button>
          ) : null}
        </div>
      </div>

      {/* Weekday cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
        {weekDates.map((d) => {
          const date = toYYYYMMDD(d);
          const isSelected = date === selectedDate;
          const stat = weekStats[date];

          return (
            <div
              key={date}
              className={[
                "rounded-xl border p-4 transition-all duration-200",
                isSelected
                  ? "border-brand-blue bg-gradient-to-br from-brand-blue/10 to-blue-100/30 shadow-sm"
                  : "border-gray-200 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:shadow-sm",
              ].join(" ")}
            >
              <button className="w-full text-left" onClick={() => pickDate(d)}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                  </div>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-2 text-2xl font-black text-gray-900">
                  {d.getDate()}
                </div>

                {canReadStats ? (
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">Total:</span>
                      <span className="font-black text-gray-900">
                        {stat?.total ?? 0}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="text-center rounded bg-blue-50 px-1.5 py-0.5">
                        <div className="text-[10px] text-blue-700">P</div>
                        <div className="font-bold text-blue-800">
                          {stat?.pending ?? 0}
                        </div>
                      </div>
                      <div className="text-center rounded bg-green-50 px-1.5 py-0.5">
                        <div className="text-[10px] text-green-700">A</div>
                        <div className="font-bold text-green-800">
                          {stat?.approved ?? 0}
                        </div>
                      </div>
                      <div className="text-center rounded bg-red-50 px-1.5 py-0.5">
                        <div className="text-[10px] text-red-700">R</div>
                        <div className="font-bold text-red-800">
                          {stat?.rejected ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-gray-500">
                    Stats (No permission)
                  </div>
                )}
              </button>

              {canReadStats ? (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    icon={<BarChart3 className="h-3 w-3" />}
                    iconPosition="left"
                    className="px-2 py-1 text-xs text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                    onClick={() => openStats(date)}
                    title="Day stats"
                  >
                    Info
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Day table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200/50 px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white/80">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-brand-blue" />
            <div className="font-black text-gray-900">
              Entries for {selectedDate}
            </div>
          </div>
          <div className="text-xs text-gray-600">
            {dayLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : (
              `${dayItems.length} record(s)`
            )}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white/80">
              <tr className="text-left">
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Employee
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Shift
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  In Time
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Out Time
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  OT Hours
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Night
                </th>
                <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-gray-700">
                  Approved OT
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
              {dayItems.map((it) => {
                const shiftLabel =
                  it.shift === "NO_SHIFT"
                    ? "No Shift"
                    : it.shift === "Shift 1"
                      ? "6:30AM"
                      : it.shift === "Shift 2"
                        ? "8:30AM"
                        : it.shift || "";
                return (
                  <tr
                    key={it._id}
                    className="transition-all duration-150 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/30"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue/20 to-blue-100/50">
                          <User className="h-4 w-4 text-brand-blue" />
                        </div>
                        <div>
                          <div className="font-black text-gray-900">
                            {it.employeeId?.empId}
                          </div>
                          <div className="text-xs text-gray-600">
                            {it.employeeId?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {shiftLabel}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono font-medium text-gray-900">
                        {it.inTime?.trim() ? it.inTime : "-"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono font-medium text-gray-900">
                        {it.outTime?.trim() ? it.outTime : "-"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <span>N {minutesToHuman(it.normalMinutes)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span>D {minutesToHuman(it.doubleMinutes)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                          <span>T {minutesToHuman(it.tripleMinutes)}</span>
                        </div>
                      </div>
                      <div className="mt-1 font-black text-gray-900">
                        {minutesToHuman(sumMinutes(it))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${it.isNight ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                      >
                        <Moon className="h-3 w-3" />
                        {it.isNight ? "Yes" : "No"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {it.status === "APPROVED" ? (
                        <div className="font-black text-gray-900">
                          {minutesToHuman(it.approvedTotalMinutes ?? 0)}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">-</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div
                        className={[
                          "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black",
                          it.status === "PENDING"
                            ? "bg-blue-50 text-blue-700"
                            : "",
                          it.status === "APPROVED"
                            ? "bg-green-50 text-green-700"
                            : "",
                          it.status === "REJECTED"
                            ? "bg-red-50 text-red-700"
                            : "",
                        ].join(" ")}
                      >
                        {it.status === "PENDING" && (
                          <Clock className="h-3 w-3" />
                        )}
                        {it.status === "APPROVED" && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        {it.status === "REJECTED" && (
                          <XCircle className="h-3 w-3" />
                        )}
                        {it.status}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {it.status === "PENDING" && canApprove ? (
                          <Button
                            variant="ghost"
                            onClick={() => openApprove(it)}
                            icon={<CheckCircle className="h-3 w-3" />}
                            iconPosition="left"
                            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                          >
                            Approve
                          </Button>
                        ) : null}

                        {it.status === "PENDING" && canReject ? (
                          <Button
                            variant="ghost"
                            onClick={() => openReject(it)}
                            icon={<XCircle className="h-3 w-3" />}
                            iconPosition="left"
                            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                          >
                            Reject
                          </Button>
                        ) : null}

                        {it.status === "PENDING" && has("ot.update") ? (
                          <Button
                            variant="ghost"
                            onClick={() => openEdit(it)}
                            icon={<Pencil className="h-3 w-3" />}
                            iconPosition="left"
                            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                          >
                            Edit
                          </Button>
                        ) : null}

                        {canReadAudit ? (
                          <Button
                            variant="ghost"
                            onClick={() => openAuditForOt(it)}
                            icon={<Eye className="h-3 w-3" />}
                            iconPosition="left"
                            className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                          >
                            Audit
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!dayLoading && dayItems.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-8 text-center text-gray-500"
                    colSpan={9}
                  >
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8">
                      <div className="text-sm text-gray-500">
                        No OT entries for this day.
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Click "Add OT" to create new entries
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create bulk modal */}
      <Modal
        open={createOpen}
        title={`Add OT - ${selectedDate}`}
        onClose={() => setCreateOpen(false)}
        className="max-w-[95vw] w-[1200px]"
        closeOnBackdropClick={false}
        size="xl"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Create multiple OT rows quickly. Duplicates (same employee + date)
            will be skipped by backend.
          </div>

          {loadingEmp ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading employees...
            </div>
          ) : null}

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {createRows.map((r, i) => {
              const isNoShift = r.shift === "NO_SHIFT";
              return (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <SelectField
                        label="Employee"
                        value={r.employeeId}
                        onValueChange={(v) => setRow(i, { employeeId: v })}
                        options={[
                          {
                            label: "Select employee",
                            value: "",
                            disabled: true,
                          },
                          ...employees.map((e) => ({
                            label: `${e.empId} - ${e.name}`,
                            value: e._id,
                          })),
                        ]}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <SelectField
                        label="Shift"
                        value={r.shift}
                        onValueChange={(v) => {
                          if (v === "NO_SHIFT")
                            setRow(i, { shift: v, inTime: "", outTime: "" });
                          else setRow(i, { shift: v });
                        }}
                        options={SHIFTS.map((s) => ({
                          label: s.label,
                          value: s.value,
                        }))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="In Time"
                        type="time"
                        value={r.inTime}
                        disabled={isNoShift}
                        onChange={(e) => setRow(i, { inTime: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Out Time"
                        type="time"
                        value={r.outTime}
                        disabled={isNoShift}
                        onChange={(e) => setRow(i, { outTime: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Reason"
                        value={r.reason || "-"}
                        onChange={(e) => setRow(i, { reason: e.target.value })}
                        className="border-gray-300"
                      />
                    </div>

                    <div className="md:col-span-12 flex justify-end gap-2">
                      {createRows.length > 1 && (
                        <Button
                          variant="ghost"
                          onClick={() => removeCreateRow(i)}
                          icon={<Trash2 className="h-3 w-3" />}
                          iconPosition="left"
                          className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={addCreateRow}
              icon={<Plus className="h-4 w-4" />}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Add Row
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                iconPosition="left"
                className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={saveBulk}
                className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={editOpen} title="Edit OT" onClose={() => setEditOpen(false)}>
        <div className="space-y-4">
          <SelectField
            label="Shift"
            value={editShift}
            onValueChange={(v) => {
              setEditShift(v);
              if (v === "NO_SHIFT") {
                setEditInTime("");
                setEditOutTime("");
              }
            }}
            options={SHIFTS.map((s) => ({ label: s.label, value: s.value }))}
          />

          <Input
            label="In Time"
            type="time"
            value={editInTime}
            disabled={editShift === "NO_SHIFT"}
            onChange={(e) => setEditInTime(e.target.value)}
          />

          <Input
            label="Out Time"
            type="time"
            value={editOutTime}
            disabled={editShift === "NO_SHIFT"}
            onChange={(e) => setEditOutTime(e.target.value)}
          />

          <Input
            label="Reason"
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setEditOpen(false)}
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>

            <Button
              onClick={confirmEdit}
              className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow"
            >
              Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal
        open={rejectOpen}
        title="Reject OT"
        onClose={() => setRejectOpen(false)}
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Optional: add a reject reason (future use in audit / reports).
          </div>
          <Input
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="border-gray-300"
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setRejectOpen(false)}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow"
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve modal */}
      <Modal
        open={approveOpen}
        title="Approve OT"
        onClose={() => setApproveOpen(false)}
      >
        <Input
          label="Approved Normal (minutes)"
          type="number"
          value={approvedN}
          onChange={(e) => setApprovedN(Number(e.target.value))}
        />

        <Input
          label="Approved Double (minutes)"
          type="number"
          value={approvedD}
          onChange={(e) => setApprovedD(Number(e.target.value))}
        />

        <Input
          label="Approved Triple (minutes)"
          type="number"
          value={approvedT}
          onChange={(e) => setApprovedT(Number(e.target.value))}
        />
        <div className="space-y-4">
          <SelectField
            label="Reason (optional)"
            value={approveReasonId}
            onValueChange={setApproveReasonId}
            options={[
              { label: "Select reason", value: "" },
              ...approveReasons.map((r) => ({ label: r.label, value: r._id })),
            ]}
          />
          <Input
            label="Or type custom reason"
            value={approveReasonText}
            onChange={(e) => setApproveReasonText(e.target.value)}
            className="border-gray-300"
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setApproveOpen(false)}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow"
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stats modal */}
      <Modal
        open={statsOpen}
        title={`Day Stats - ${stats?.date ?? ""}`}
        onClose={() => setStatsOpen(false)}
      >
        <div className="space-y-4">
          {statsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading stats...
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                  Total
                </div>
                <div className="text-right font-black text-gray-900">
                  {stats.total}
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  Pending
                </div>
                <div className="text-right font-black text-gray-900">
                  {stats.pending}
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Approved
                </div>
                <div className="text-right font-black text-gray-900">
                  {stats.approved}
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  Rejected
                </div>
                <div className="text-right font-black text-gray-900">
                  {stats.rejected}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4 text-sm">
                <div className="mb-3 flex items-center gap-2 font-black text-gray-900">
                  <BarChart3 className="h-4 w-4" />
                  Hours Summary
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    Normal Hours
                  </div>
                  <div className="text-right font-black text-gray-900">
                    {stats.hours.normal}
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Double Hours
                  </div>
                  <div className="text-right font-black text-gray-900">
                    {stats.hours.double}
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    Triple Hours
                  </div>
                  <div className="text-right font-black text-gray-900">
                    {stats.hours.triple}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">No stats</div>
          )}
        </div>
      </Modal>

      {/* Audit modal */}
      <Modal
        open={auditOpen}
        title={auditTitle || "Audit"}
        onClose={() => setAuditOpen(false)}
      >
        <div className="space-y-4">
          {auditLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading audit...
            </div>
          ) : auditRows.length ? (
            <div className="space-y-3">
              {auditRows.map((a) => (
                <div
                  key={a._id}
                  className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue/20 to-blue-100/50">
                        <Eye className="h-3 w-3 text-brand-blue" />
                      </div>
                      <div className="text-sm font-black text-gray-900">
                        {a.action}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">By:</span>{" "}
                      <span className="font-semibold text-gray-900">
                        {a.actorUserId?.username ?? "System"}
                      </span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">Email:</span>{" "}
                      <span className="font-semibold text-gray-900">
                        {a.actorUserId?.email ?? "System"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No audit logs.</div>
          )}
        </div>
      </Modal>
    </div>
  );
}
