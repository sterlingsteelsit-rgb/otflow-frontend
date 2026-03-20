/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
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
  Clock,
  Eye,
  RefreshCw,
} from "lucide-react";
import StatsModal from "../components/modals/StatsModal";
import {
  calcOtMinutesUI,
  dayTypeFromDate,
  minsToHours,
} from "../utils/otCalcPreview";
import { WeekDayCard } from "./WeekDayCard";
import { OtEntryRow } from "./OtEntryRow";
import { CreateOtRow } from "./CreateOtRow";
import type {
  AuditRow,
  BulkApproveRow,
  CreateRow,
  DayStats,
  EmployeeLite,
  OtRow,
  ReasonOpt,
} from "../utils/otTypes";
import {
  addDays,
  makeCreateRow,
  startOfWeekMonday,
  toYYYYMMDD,
} from "../utils/otFuncs";

const SHIFTS = [
  { label: "NO Shift", value: "NO_SHIFT" },
  { label: "Shift 1", value: "Shift 1" },
  { label: "Shift 2", value: "Shift 2" },
];

export function OtEntryPage() {
  const { has, state } = useAuth();

  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(today));
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const [selectedDate, setSelectedDate] = useState(() => toYYYYMMDD(today));
  const [isTripleDay, setIsTripleDay] = useState(false);

  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [loadingEmp, setLoadingEmp] = useState(false);

  const [dayItems, setDayItems] = useState<OtRow[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  const [weekStats, setWeekStats] = useState<Record<string, DayStats>>({});

  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<DayStats | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createRows, setCreateRows] = useState<CreateRow[]>([makeCreateRow()]);

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
  const canUpdate = has("ot.update");

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

  const [editNormalHours, setEditNormalHours] = useState("0");
  const [editDoubleHours, setEditDoubleHours] = useState("0");
  const [editTripleHours, setEditTripleHours] = useState("0");
  const [editIsNight, setEditIsNight] = useState(false);
  const [editManualOverride, setEditManualOverride] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkApproveReasonId, setBulkApproveReasonId] = useState("");
  const [bulkApproveReasonText, setBulkApproveReasonText] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkApproveRow[]>([]);

  const [dayReq, setDayReq] = useState<AbortController | null>(null);
  const weekRange = useMemo(() => {
    return {
      from: toYYYYMMDD(weekDates[0]),
      to: toYYYYMMDD(weekDates[6]),
    };
  }, [weekDates]);

  type DayStatus = "full" | "pending" | "empty";
  const [weekStatus, setWeekStatus] = useState<Record<string, DayStatus>>({});

  const dayType = useMemo(() => dayTypeFromDate(selectedDate), [selectedDate]);
  const dayPayLabel = useMemo(() => {
    if (isTripleDay)
      return { label: "TRIPLE OT Day", pill: "bg-orange-50 text-orange-700" };
    if (dayType === "SUNDAY")
      return {
        label: "DOUBLE OT Day (Sunday)",
        pill: "bg-green-50 text-green-700",
      };
    if (dayType === "SATURDAY")
      return {
        label: "NORMAL OT (Saturday rules)",
        pill: "bg-yellow-50 text-yellow-700",
      };
    return {
      label: "NORMAL OT (Weekday rules)",
      pill: "bg-blue-50 text-blue-700",
    };
  }, [isTripleDay, dayType]);

  const editPreview = useMemo(() => {
    if (editShift === "NO_SHIFT") {
      return {
        normalMinutes: 0,
        doubleMinutes: 0,
        tripleMinutes: 0,
        isNight: false,
      };
    }

    return calcOtMinutesUI({
      workDate: selectedDate,
      shift: editShift,
      inTime: editInTime,
      outTime: editOutTime,
      isTripleDay,
    });
  }, [selectedDate, editShift, editInTime, editOutTime, isTripleDay]);

  function getApiErrorMessage(e: any, fallback = "Something went wrong") {
    const data = e?.response?.data;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (Array.isArray(data?.errors) && data.errors.length)
      return String(data.errors[0]);
    if (Array.isArray(data?.issues) && data.issues.length)
      return data.issues[0]?.message ?? fallback;
    return e?.message ?? fallback;
  }

  useEffect(() => {
    if (!authReady) return;
    if (!employees.length) return;

    const c = new AbortController();
    loadWeekCompleteness(c.signal);
    return () => c.abort();
  }, [authReady, weekStart, employees.length]);

  async function loadWeekCompleteness(signal?: AbortSignal) {
    const { from, to } = weekRange;

    try {
      const r = await api.get("/ot/week-completeness", {
        params: { from, to },
        signal,
      });

      const items = (r.data.items ?? []) as Array<{
        date: string;
        filledCount: number;
        pendingCount: number;
      }>;

      const mapByDate = new Map(items.map((x) => [x.date, x]));
      const total = employees.length;
      const map: Record<string, DayStatus> = {};

      for (const d of weekDates.map(toYYYYMMDD)) {
        const it = mapByDate.get(d);
        const filledCount = it?.filledCount ?? 0;
        const pendingCount = it?.pendingCount ?? 0;

        if (total === 0 || filledCount === 0) map[d] = "empty";
        else if (filledCount < total) map[d] = "pending";
        else map[d] = pendingCount > 0 ? "pending" : "full";
      }

      setWeekStatus(map);
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      setWeekStatus({});
    }
  }

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
    dayReq?.abort();
    const c = new AbortController();
    setDayReq(c);

    setDayLoading(true);
    try {
      const r = await api.get("/ot", {
        params: {
          from: date,
          to: date,
          page: 1,
          limit: 200,
        },
        signal: c.signal,
      });

      setDayItems(r.data.items);
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
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

  async function openBulkApprove() {
    if (!canApprove) return toast.error("No permission to approve");
    if (!selectedRows.length) return toast.error("Select at least one row");

    const rows: BulkApproveRow[] = selectedRows.map((row) => {
      const total =
        (row.normalMinutes ?? 0) +
        (row.doubleMinutes ?? 0) +
        (row.tripleMinutes ?? 0);

      const isNoShiftBlocked = row.shift === "NO_SHIFT" && total === 0;

      return {
        id: row._id,
        employeeLabel: `${row.employeeId.empId} - ${row.employeeId.name}`,
        shift: row.shift,
        inTime: row.inTime || "-",
        outTime: row.outTime || "-",
        normalMinutes: row.normalMinutes ?? 0,
        doubleMinutes: row.doubleMinutes ?? 0,
        tripleMinutes: row.tripleMinutes ?? 0,
        approvedNormalMinutes: row.normalMinutes ?? 0,
        approvedDoubleMinutes: row.doubleMinutes ?? 0,
        approvedTripleMinutes: row.tripleMinutes ?? 0,
        canApprove: row.status === "PENDING" && !isNoShiftBlocked,
        warning: isNoShiftBlocked
          ? "NO_SHIFT with zero OT. Review manually."
          : row.shift === "NO_SHIFT"
            ? "NO_SHIFT entry. Please verify carefully."
            : "",
      };
    });

    setBulkRows(rows);
    setBulkApproveReasonId("");
    setBulkApproveReasonText("");
    setBulkApproveOpen(true);

    try {
      const items = await fetchReasons("APPROVE");
      setApproveReasons(items);
    } catch {
      //
    }
  }

  const fetchReasons = useCallback(async (type: "APPROVE" | "REJECT") => {
    const r = await api.get("/decision-reasons", {
      params: { type, active: "true" },
    });
    return (r.data.items ?? []) as ReasonOpt[];
  }, []);

  const openApprove = useCallback(
    async (row: OtRow) => {
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
    },
    [canApprove],
  );

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

      const newApprovedTotal = approvedN + approvedD + approvedT;

      setDayItems((prev) =>
        prev.map((x) =>
          x._id === actingId
            ? {
                ...x,
                status: "APPROVED",
                approvedNormalMinutes: approvedN,
                approvedDoubleMinutes: approvedD,
                approvedTripleMinutes: approvedT,
                approvedTotalMinutes: newApprovedTotal,
              }
            : x,
        ),
      );

      setApproveOpen(false);
      setActingId(null);
      await loadWeekStats();
      loadWeekCompleteness();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  async function confirmBulkApprove() {
    const rowsToApprove = bulkRows.filter((x) => x.canApprove);

    if (!rowsToApprove.length) {
      return toast.error("No valid rows to approve");
    }

    const selectedLabel =
      approveReasons.find((x) => x._id === bulkApproveReasonId)?.label ?? "";

    const finalReason = (
      bulkApproveReasonText.trim() ||
      selectedLabel ||
      ""
    ).trim();

    const t = toast.loading("Bulk approving...");

    try {
      await Promise.all(
        rowsToApprove.map((row) =>
          api.patch(`/ot/${row.id}/approve`, {
            reason: finalReason || undefined,
            approvedNormalMinutes: row.approvedNormalMinutes,
            approvedDoubleMinutes: row.approvedDoubleMinutes,
            approvedTripleMinutes: row.approvedTripleMinutes,
          }),
        ),
      );

      toast.success(`Approved ${rowsToApprove.length} entries`, { id: t });

      setBulkApproveOpen(false);
      setSelectedIds([]);
      await loadDay(selectedDate);
      await loadWeekStats();
      loadWeekCompleteness();
    } catch (e: any) {
      toast.error(getApiErrorMessage(e, "Bulk approve failed"), { id: t });
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
  }, [authReady, weekStart, canReadStats]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedDate]);

  const prevWeek = useCallback(() => {
    setWeekStart((d) => addDays(d, -7));
  }, []);

  const nextWeek = useCallback(() => {
    setWeekStart((d) => addDays(d, 7));
  }, []);

  const pickDate = useCallback((d: Date) => {
    setSelectedDate(toYYYYMMDD(d));
  }, []);

  const openEdit = useCallback((row: OtRow) => {
    setEditId(row._id);
    setEditShift(row.shift);
    setEditInTime(row.inTime);
    setEditOutTime(row.outTime);
    setEditReason(row.reason || "");

    setEditNormalHours(minsToHours(row.normalMinutes));
    setEditDoubleHours(minsToHours(row.doubleMinutes));
    setEditTripleHours(minsToHours(row.tripleMinutes));
    setEditIsNight(row.isNight);

    setEditManualOverride(false);
    setEditOpen(true);
  }, []);

  const openStats = useCallback(
    async (date: string) => {
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
    },
    [canReadStats],
  );

  const resetCreate = useCallback(() => {
    setCreateRows([makeCreateRow()]);
  }, []);

  const addCreateRow = useCallback(() => {
    setCreateRows((rows) => [...rows, makeCreateRow()]);
  }, []);

  const removeCreateRow = useCallback((i: number) => {
    setCreateRows((rows) => rows.filter((_, idx) => idx !== i));
  }, []);

  const setRow = useCallback((i: number, patch: Partial<CreateRow>) => {
    setCreateRows((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }, []);

  const toggleRowSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    const approvableIds = dayItems
      .filter((x) => x.status === "PENDING")
      .map((x) => x._id);

    setSelectedIds((prev) =>
      prev.length === approvableIds.length ? [] : approvableIds,
    );
  }, [dayItems]);

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
      const resp = await api.post("/ot/bulk", payload);

      const inserted = resp.data.insertedCount ?? 0;
      const duplicates = resp.data.duplicates ?? 0;

      if (inserted === 0 && duplicates > 0) {
        toast.error(
          `No new entries saved. ${duplicates} duplicate(s) were skipped.`,
          {
            id: t,
          },
        );
        return;
      }

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
      if (e?.response?.status === 409) {
        const data = e?.response?.data;
        const msg =
          data?.message ||
          (Array.isArray(data?.errors) ? data.errors.join(", ") : "") ||
          "Duplicate OT entry detected.";
        toast.error(msg, { id: t });
        return;
      }

      toast.error(getApiErrorMessage(e, "Failed to save OT"), { id: t });
    }
  }

  async function confirmEdit() {
    if (!editId) return;

    if (editShift !== "NO_SHIFT") {
      if (!editInTime) return toast.error("In time required");
      if (!editOutTime) return toast.error("Out time required");
    }

    const normalMinutes =
      editShift === "NO_SHIFT"
        ? 0
        : editManualOverride
          ? Math.round(Number(editNormalHours || 0) * 60)
          : editPreview.normalMinutes;

    const doubleMinutes =
      editShift === "NO_SHIFT"
        ? 0
        : editManualOverride
          ? Math.round(Number(editDoubleHours || 0) * 60)
          : editPreview.doubleMinutes;

    const tripleMinutes =
      editShift === "NO_SHIFT"
        ? 0
        : editManualOverride
          ? Math.round(Number(editTripleHours || 0) * 60)
          : editPreview.tripleMinutes;

    const isNight =
      editShift === "NO_SHIFT"
        ? false
        : editManualOverride
          ? editIsNight
          : editPreview.isNight;

    const t = toast.loading("Updating...");

    try {
      await api.patch(`/ot/${editId}`, {
        shift: editShift,
        inTime: editShift === "NO_SHIFT" ? "" : editInTime,
        outTime: editShift === "NO_SHIFT" ? "" : editOutTime,
        reason: editReason?.trim() ? editReason.trim() : undefined,
        normalMinutes,
        doubleMinutes,
        tripleMinutes,
        isNight,
      });

      toast.success("Updated", { id: t });

      setDayItems((prev) =>
        prev.map((x) =>
          x._id === editId
            ? {
                ...x,
                shift: editShift,
                inTime: editShift === "NO_SHIFT" ? "" : editInTime,
                outTime: editShift === "NO_SHIFT" ? "" : editOutTime,
                reason: editReason?.trim() ? editReason.trim() : undefined,
                normalMinutes,
                doubleMinutes,
                tripleMinutes,
                isNight,
              }
            : x,
        ),
      );

      setEditOpen(false);
      setEditId(null);
      await loadWeekStats();
      loadWeekCompleteness();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to update", { id: t });
    }
  }

  const openReject = useCallback(
    async (row: OtRow) => {
      if (!canReject) return toast.error("No permission to reject");

      setActingId(row._id);
      setRejectReasonId("");
      setRejectReason("");
      setRejectOpen(true);

      try {
        const items = await fetchReasons("REJECT");
        setRejectReasons(items);
      } catch {
        // ignore, still allow manual typing
      }
    },
    [canReject],
  );

  async function confirmReject() {
    if (!actingId) return;
    if (!canReject) return toast.error("No permission to reject");

    const selectedLabel =
      rejectReasons.find((x) => x._id === rejectReasonId)?.label ?? "";

    const finalReason = (rejectReason.trim() || selectedLabel || "").trim();

    if (!finalReason) return toast.error("Reject reason is required");

    const t = toast.loading("Rejecting...");
    try {
      await api.patch(`/ot/${actingId}/reject`, { reason: finalReason });
      toast.success("Rejected", { id: t });

      setDayItems((prev) =>
        prev.map((x) =>
          x._id === actingId
            ? {
                ...x,
                status: "REJECTED",
              }
            : x,
        ),
      );

      setRejectOpen(false);
      setActingId(null);
      await loadWeekStats();
      loadWeekCompleteness();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed", { id: t });
    }
  }

  const openAuditForOt = useCallback(
    async (row: OtRow) => {
      if (!canReadAudit) return toast.error("No permission to view audit logs");

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
    },
    [canReadAudit],
  );

  const selectedDayLabel = useMemo(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate]);

  const employeeOptions = useMemo(
    () => [
      {
        label: "Select employee",
        value: "",
        disabled: true,
      },
      ...employees.map((e) => ({
        label: `${e.empId} - ${e.name}`,
        value: e._id,
      })),
    ],
    [employees],
  );

  const shiftOptions = useMemo(
    () => SHIFTS.map((s) => ({ label: s.label, value: s.value })),
    [],
  );

  const selectedRows = useMemo(
    () => dayItems.filter((x) => selectedIds.includes(x._id)),
    [dayItems, selectedIds],
  );

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

          {canApprove ? (
            <div>
              <Button
                onClick={openBulkApprove}
                variant="ghost"
                className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
              >
                Bulk Approve ({selectedRows.length})
              </Button>
            </div>
          ) : null}

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

          return (
            <WeekDayCard
              key={date}
              date={d}
              dateKey={date}
              isSelected={date === selectedDate}
              stat={weekStats[date]}
              status={weekStatus[date] ?? "empty"}
              canReadStats={canReadStats}
              onPick={pickDate}
              onOpenStats={openStats}
            />
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
                  <input
                    type="checkbox"
                    checked={
                      dayItems.filter((x) => x.status === "PENDING").length >
                        0 &&
                      selectedIds.length ===
                        dayItems.filter((x) => x.status === "PENDING").length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
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
              {dayItems.map((it) => (
                <OtEntryRow
                  key={it._id}
                  item={it}
                  canApprove={canApprove}
                  canReject={canReject}
                  canReadAudit={canReadAudit}
                  canUpdate={canUpdate}
                  onApprove={openApprove}
                  onReject={openReject}
                  onEdit={openEdit}
                  onAudit={openAuditForOt}
                  isSelected={selectedIds.includes(it._id)}
                  onToggleSelect={() => toggleRowSelection(it._id)}
                />
              ))}

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

      {/* Bulk Approve Modal */}
      <Modal
        open={bulkApproveOpen}
        title={`Bulk Approve OT (${bulkRows.length})`}
        onClose={() => setBulkApproveOpen(false)}
        className="w-[95vw] max-w-[1280px]"
        closeOnBackdropClick={false}
        size="xl"
      >
        <div className="flex h-[85vh] min-h-0 flex-col">
          {" "}
          {/* Top summary */}
          <div className="shrink-0 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-black text-gray-900">
                    Review before final approval
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Adjust approved OT values if needed, especially for NO_SHIFT
                    or manually reviewed rows.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    Selected: {bulkRows.length}
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    Valid: {bulkRows.filter((r) => r.canApprove).length}
                  </div>
                  <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                    Review:{" "}
                    {bulkRows.filter((r) => !r.canApprove || r.warning).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Scrollable center */}
          <div className="mt-4 min-h-0 flex-1 overflow-hidden">
            {" "}
            <div className="flex h-full min-h-0 flex-col gap-4">
              {" "}
              {/* Table card */}
              <div className="min-h-0 flex-1 overflow-hidden flex flex-col rounded-xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm">
                <div className="shrink-0 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-white/80 px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black text-gray-900">
                      Selected OT Entries
                    </div>
                    <div className="text-xs text-gray-500">
                      Edit approved hours before confirming
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                  {" "}
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 border-b border-gray-200/70 bg-gradient-to-r from-gray-50 to-white/95 backdrop-blur-sm">
                      <tr className="text-left">
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-gray-700">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-gray-700">
                          Shift
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-gray-700">
                          In
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-gray-700">
                          Out
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-blue-700">
                          Approved Normal
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-green-700">
                          Approved Double
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-orange-700">
                          Approved Triple
                        </th>
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-gray-700">
                          Review Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {bulkRows.map((r, index) => {
                        const hasWarning = !!r.warning;
                        const disabled = !r.canApprove;

                        return (
                          <tr
                            key={r.id}
                            className={`align-top transition-colors ${
                              disabled
                                ? "bg-red-50/40"
                                : hasWarning
                                  ? "bg-amber-50/40"
                                  : "bg-white hover:bg-gray-50/60"
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <div className="font-black text-gray-900">
                                {r.employeeLabel}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                Original:{" "}
                                {[
                                  r.normalMinutes > 0
                                    ? `N ${r.normalMinutes / 60}h`
                                    : null,
                                  r.doubleMinutes > 0
                                    ? `D ${r.doubleMinutes / 60}h`
                                    : null,
                                  r.tripleMinutes > 0
                                    ? `T ${r.tripleMinutes / 60}h`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" • ") || "0h"}
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${
                                  r.shift === "NO_SHIFT"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {r.shift}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 font-medium text-gray-700">
                              {r.inTime || "-"}
                            </td>

                            <td className="px-4 py-3.5 font-medium text-gray-700">
                              {r.outTime || "-"}
                            </td>

                            <td className="px-4 py-3.5">
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                disabled={disabled}
                                value={r.approvedNormalMinutes / 60}
                                onChange={(e) => {
                                  const val = Math.round(
                                    Number(e.target.value || 0) * 60,
                                  );
                                  setBulkRows((prev) =>
                                    prev.map((x, i) =>
                                      i === index
                                        ? { ...x, approvedNormalMinutes: val }
                                        : x,
                                    ),
                                  );
                                }}
                                className="h-10 w-24 rounded-lg border border-blue-200 bg-white px-3 text-sm font-black text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                              />
                            </td>

                            <td className="px-4 py-3.5">
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                disabled={disabled}
                                value={r.approvedDoubleMinutes / 60}
                                onChange={(e) => {
                                  const val = Math.round(
                                    Number(e.target.value || 0) * 60,
                                  );
                                  setBulkRows((prev) =>
                                    prev.map((x, i) =>
                                      i === index
                                        ? { ...x, approvedDoubleMinutes: val }
                                        : x,
                                    ),
                                  );
                                }}
                                className="h-10 w-24 rounded-lg border border-green-200 bg-white px-3 text-sm font-black text-gray-900 shadow-sm outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                              />
                            </td>

                            <td className="px-4 py-3.5">
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                disabled={disabled}
                                value={r.approvedTripleMinutes / 60}
                                onChange={(e) => {
                                  const val = Math.round(
                                    Number(e.target.value || 0) * 60,
                                  );
                                  setBulkRows((prev) =>
                                    prev.map((x, i) =>
                                      i === index
                                        ? { ...x, approvedTripleMinutes: val }
                                        : x,
                                    ),
                                  );
                                }}
                                className="h-10 w-24 rounded-lg border border-orange-200 bg-white px-3 text-sm font-black text-gray-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                              />
                            </td>

                            <td className="px-4 py-3.5">
                              {disabled ? (
                                <div className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-700">
                                  Manual review required
                                </div>
                              ) : hasWarning ? (
                                <div className="space-y-1">
                                  <div className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700">
                                    Warning
                                  </div>
                                  <div className="text-xs font-medium text-amber-800">
                                    {r.warning}
                                  </div>
                                </div>
                              ) : (
                                <div className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                                  Ready to approve
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {bulkRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center">
                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-8">
                              <div className="text-sm font-medium text-gray-500">
                                No rows selected for bulk approval.
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Reason section */}
              <div className="shrink-0 rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <div className="mb-3">
                  <div className="text-sm font-black text-gray-900">
                    Approval Reason
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Optional, but useful for audit tracking when approving in
                    bulk.
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField
                    label="Select reason"
                    value={bulkApproveReasonId}
                    onValueChange={setBulkApproveReasonId}
                    options={[
                      { label: "Select reason", value: "" },
                      ...approveReasons.map((r) => ({
                        label: r.label,
                        value: r._id,
                      })),
                    ]}
                  />

                  <Input
                    label="Or type custom reason"
                    value={bulkApproveReasonText}
                    onChange={(e) => setBulkApproveReasonText(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Fixed footer */}
          <div className="mt-4 shrink-0 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                Rows marked with warnings should be checked carefully before
                approval.
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setBulkApproveOpen(false)}
                  className="border border-gray-300 bg-white font-black text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>

                <Button
                  onClick={confirmBulkApprove}
                  className="rounded-lg border border-brand-blue bg-gradient-to-r from-brand-blue to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow"
                >
                  Confirm Bulk Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

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
          {/* Top bar: day type + triple toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/70 p-3">
            <div
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${dayPayLabel.pill}`}
            >
              {dayPayLabel.label}
            </div>

            <label className="flex items-center gap-2 text-xs font-black text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isTripleDay}
                onChange={(e) => setIsTripleDay(e.target.checked)}
              />
              Mark as Triple OT day
            </label>
          </div>

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
            {createRows.map((r, i) => (
              <CreateOtRow
                key={r.id}
                index={i}
                row={r}
                selectedDate={selectedDate}
                isTripleDay={isTripleDay}
                employeeOptions={employeeOptions}
                shiftOptions={shiftOptions}
                canRemove={createRows.length > 1}
                onChangeRow={setRow}
                onRemoveRow={removeCreateRow}
              />
            ))}
          </div>

          {/* Footer */}
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
      <Modal
        open={editOpen}
        title="Edit OT"
        onClose={() => setEditOpen(false)}
        className="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Basic details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Shift"
              value={editShift}
              onValueChange={(v) => {
                setEditShift(v);

                if (v === "NO_SHIFT") {
                  setEditInTime("");
                  setEditOutTime("");
                  setEditManualOverride(false);
                  setEditNormalHours("0");
                  setEditDoubleHours("0");
                  setEditTripleHours("0");
                  setEditIsNight(false);
                }
              }}
              options={SHIFTS.map((s) => ({ label: s.label, value: s.value }))}
            />

            <Input
              label="Reason"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
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
          </div>

          {/* Auto preview */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-gray-900">
                  Auto Calculated Preview
                </div>
                <div className="text-xs text-gray-500">
                  Based on shift and in/out time
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={editManualOverride}
                  disabled={editShift === "NO_SHIFT"}
                  onChange={(e) => setEditManualOverride(e.target.checked)}
                />
                Manual Override
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="text-[11px] font-black uppercase tracking-wide text-blue-700">
                  Normal
                </div>
                <div className="mt-1 text-base font-black text-blue-900">
                  {minsToHours(editPreview.normalMinutes)}h
                </div>
              </div>

              <div className="rounded-lg bg-green-50 p-3">
                <div className="text-[11px] font-black uppercase tracking-wide text-green-700">
                  Double
                </div>
                <div className="mt-1 text-base font-black text-green-900">
                  {minsToHours(editPreview.doubleMinutes)}h
                </div>
              </div>

              <div className="rounded-lg bg-orange-50 p-3">
                <div className="text-[11px] font-black uppercase tracking-wide text-orange-700">
                  Triple
                </div>
                <div className="mt-1 text-base font-black text-orange-900">
                  {minsToHours(editPreview.tripleMinutes)}h
                </div>
              </div>

              <div className="rounded-lg bg-gray-100 p-3">
                <div className="text-[11px] font-black uppercase tracking-wide text-gray-700">
                  Night
                </div>
                <div className="mt-1 text-base font-black text-gray-900">
                  {editPreview.isNight ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>

          {/* Manual override section */}
          {editManualOverride && editShift !== "NO_SHIFT" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="mb-3">
                <div className="text-sm font-black text-amber-900">
                  Manual OT Override
                </div>
                <div className="text-xs text-amber-700">
                  These values will be saved instead of the auto-calculated
                  preview
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Normal OT Hours"
                  type="number"
                  step="0.25"
                  min="0"
                  value={editNormalHours}
                  onChange={(e) => setEditNormalHours(e.target.value)}
                />

                <Input
                  label="Double OT Hours"
                  type="number"
                  step="0.25"
                  min="0"
                  value={editDoubleHours}
                  onChange={(e) => setEditDoubleHours(e.target.value)}
                />

                <Input
                  label="Triple OT Hours"
                  type="number"
                  step="0.25"
                  min="0"
                  value={editTripleHours}
                  onChange={(e) => setEditTripleHours(e.target.value)}
                />

                <label className="flex h-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={editIsNight}
                    onChange={(e) => setEditIsNight(e.target.checked)}
                  />
                  Night OT
                </label>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button
              variant="ghost"
              onClick={() => setEditOpen(false)}
              className="border border-gray-300 bg-white font-black text-gray-700 hover:bg-gray-50"
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
            Select a reason or type a custom reason (required).
          </div>

          <SelectField
            label="Reason"
            value={rejectReasonId}
            onValueChange={setRejectReasonId}
            options={[
              { label: "Select reason", value: "" },
              ...rejectReasons.map((r) => ({ label: r.label, value: r._id })),
            ]}
          />

          <Input
            label="Or type custom reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="border-gray-300"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setRejectOpen(false)}
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
          label="Approved Normal"
          type="number"
          value={approvedN / 60}
          onChange={(e) =>
            setApprovedN(Math.round(Number(e.target.value || 0) * 60))
          }
        />

        <Input
          label="Approved Double"
          type="number"
          value={approvedD / 60}
          onChange={(e) =>
            setApprovedD(Math.round(Number(e.target.value || 0) * 60))
          }
        />

        <Input
          label="Approved Triple"
          type="number"
          value={approvedT / 60}
          onChange={(e) =>
            setApprovedT(Math.round(Number(e.target.value || 0) * 60))
          }
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
      <StatsModal
        stats={stats}
        statsOpen={statsOpen}
        setStatsOpen={setStatsOpen}
        statsLoading={statsLoading}
      />

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
