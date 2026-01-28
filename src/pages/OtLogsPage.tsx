/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SelectField } from "../components/ui/SelectField";
import {
  RefreshCw,
  BarChart3,
  List,
  ChevronLeft,
  ChevronRight,
  Download,
  CalendarDays,
  Users,
  Filter,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";

type EmployeeLite = { _id: string; empId: string; name: string };

type OtRow = {
  _id: string;
  workDate: string;
  employeeId: EmployeeLite;
  shift: string;
  inTime: string;
  outTime: string;
  normalMinutes: number;
  doubleMinutes: number;
  tripleMinutes: number;
  approvedTotalMinutes?: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

type SummaryRow = {
  _id: any;
  count: number;
  normalMinutes: number;
  doubleMinutes: number;
  tripleMinutes: number;
  approvedTotalMinutes: number;
};

type Scope = "daily" | "weekly" | "monthly" | "yearly";
type ViewMode = "records" | "summary";

/* -------------------- date utils -------------------- */

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toYYYYMMDD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseYYYYMMDD(s: string) {
  // local date
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}
function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addWeeks(date: Date, weeks: number) {
  return addDays(date, weeks * 7);
}
function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function addYears(date: Date, years: number) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function yearKey(d: Date) {
  return `${d.getFullYear()}`;
}
function weekLabelFromAnchor(anchorYYYYMMDD: string) {
  const a = parseYYYYMMDD(anchorYYYYMMDD);
  const ws = startOfWeekMonday(a);
  const we = addDays(ws, 6);
  return `${toYYYYMMDD(ws)} → ${toYYYYMMDD(we)}`;
}
function todayYYYYMMDD() {
  return toYYYYMMDD(new Date());
}

/* -------------------- OT formatting -------------------- */

function minutesToOt(min: number) {
  const h = Math.round((min / 60) * 100) / 100;
  return String(h).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
}
function sumMinutes(r: SummaryRow | OtRow) {
  return r.normalMinutes + r.doubleMinutes + r.tripleMinutes;
}

/* -------------------- safe helpers -------------------- */

function normalizeScopeAnchor(scope: Scope, raw: string) {
  // Always return a YYYY-MM-DD string for backend anchor
  // - daily: YYYY-MM-DD
  // - weekly: ANY date inside the week (we will set to Monday)
  // - monthly: raw "YYYY-MM" -> set to first day
  // - yearly: raw "YYYY" -> set to Jan 1
  try {
    if (scope === "daily") {
      return raw.length >= 10 ? raw.slice(0, 10) : todayYYYYMMDD();
    }
    if (scope === "weekly") {
      const d = raw.length >= 10 ? parseYYYYMMDD(raw.slice(0, 10)) : new Date();
      const ws = startOfWeekMonday(d);
      return toYYYYMMDD(ws);
    }
    if (scope === "monthly") {
      // raw might be YYYY-MM or YYYY-MM-DD
      const ym = raw.length >= 7 ? raw.slice(0, 7) : monthKey(new Date());
      return `${ym}-01`;
    }
    // yearly
    const y = raw.length >= 4 ? raw.slice(0, 4) : yearKey(new Date());
    return `${y}-01-01`;
  } catch {
    return todayYYYYMMDD();
  }
}

export default function OtLogsPage() {
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [loadingEmp, setLoadingEmp] = useState(false);

  const [scope, setScope] = useState<Scope>("daily");
  const [view, setView] = useState<ViewMode>("records");

  // anchor always stored as YYYY-MM-DD (safe for backend)
  const [anchor, setAnchor] = useState<string>(() =>
    normalizeScopeAnchor("daily", todayYYYYMMDD()),
  );

  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("");

  const [rows, setRows] = useState<OtRow[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const canReadSummary = true; // if you want, check permission before allowing summary

  async function loadEmployees() {
    setLoadingEmp(true);
    try {
      const r = await api.get("/employees", {
        params: { page: 1, limit: 5000 },
      });
      setEmployees(r.data.items ?? []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load employees");
    } finally {
      setLoadingEmp(false);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const params = {
        scope,
        anchor, // already normalized
        employeeId: employeeId || undefined,
        status: status || undefined,
        page: 1,
        limit: 5000,
      };

      if (view === "records") {
        const r = await api.get("/ot/logs", { params });
        setRows(r.data.items ?? []);
      } else {
        const r = await api.get("/ot/logs/summary", { params });
        setSummary(r.data.items ?? r.data ?? []);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to load logs");
      // keep old data on error (more user-friendly)
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadData();
  }, [scope, view, anchor, employeeId, status]);

  // When scope changes, auto-normalize anchor so user doesn't have to think
  function changeScope(next: Scope) {
    setScope(next);

    const now = new Date();
    const normalized = normalizeScopeAnchor(next, toYYYYMMDD(now));
    setAnchor(normalized);

    // if summary needs permission, fallback to records
    if (next !== "daily" && view === "summary" && !canReadSummary) {
      setView("records");
    }
  }

  /* -------------------- Friendly pickers -------------------- */

  const dailyPicker = (
    <Input
      type="date"
      value={anchor}
      onChange={(e) => setAnchor(normalizeScopeAnchor("daily", e.target.value))}
      className="w-full"
    />
  );

  // ✅ WEEK PICKER: user selects ANY date; we auto snap to Monday
  const weeklyPicker = (
    <div className="space-y-2">
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          className="border border-gray-300 bg-white hover:bg-gray-50 min-w-[40px] sm:min-w-[84px] px-2 sm:px-3"
          icon={<ChevronLeft className="h-3 sm:h-4 w-3 sm:w-4" />}
          iconPosition="left"
          onClick={() =>
            setAnchor((a) => toYYYYMMDD(addWeeks(parseYYYYMMDD(a), -1)))
          }
          title="Previous week"
        >
          <span className="hidden sm:inline">Prev</span>
          <span className="sm:hidden">‹</span>
        </Button>

        <div className="flex-1 min-w-0">
          <Input
            type="date"
            value={anchor}
            onChange={(e) =>
              setAnchor(normalizeScopeAnchor("weekly", e.target.value))
            }
            className="w-full"
          />
        </div>

        <Button
          variant="ghost"
          className="border border-gray-300 bg-white hover:bg-gray-50 min-w-[40px] sm:min-w-[84px] px-2 sm:px-3"
          icon={<ChevronRight className="h-3 sm:h-4 w-3 sm:w-4" />}
          iconPosition="right"
          onClick={() =>
            setAnchor((a) => toYYYYMMDD(addWeeks(parseYYYYMMDD(a), 1)))
          }
          title="Next week"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">›</span>
        </Button>
      </div>

      <div className="text-xs text-gray-600 truncate px-1 flex items-center gap-2">
        <CalendarDays className="h-3.5 w-3.5 text-gray-500 shrink-0" />
        <span className="truncate">
          Week:{" "}
          <span className="font-semibold text-gray-900">
            {weekLabelFromAnchor(anchor)}
          </span>
        </span>
      </div>
    </div>
  );

  const monthlyPicker = (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        variant="ghost"
        className="border border-gray-300 bg-white hover:bg-gray-50 min-w-[40px] sm:min-w-[84px] px-2 sm:px-3"
        icon={<ChevronLeft className="h-3 sm:h-4 w-3 sm:w-4" />}
        iconPosition="left"
        onClick={() => {
          const d = parseYYYYMMDD(anchor);
          const prev = addMonths(d, -1);
          setAnchor(normalizeScopeAnchor("monthly", monthKey(prev)));
        }}
        title="Previous month"
      >
        <span className="hidden sm:inline">Prev</span>
        <span className="sm:hidden">‹</span>
      </Button>

      <div className="flex-1 min-w-0">
        <Input
          type="month"
          value={monthKey(parseYYYYMMDD(anchor))}
          onChange={(e) =>
            setAnchor(normalizeScopeAnchor("monthly", e.target.value))
          }
          className="w-full"
        />
      </div>

      <Button
        variant="ghost"
        className="border border-gray-300 bg-white hover:bg-gray-50 min-w-[40px] sm:min-w-[84px] px-2 sm:px-3"
        icon={<ChevronRight className="h-3 sm:h-4 w-3 sm:w-4" />}
        iconPosition="right"
        onClick={() => {
          const d = parseYYYYMMDD(anchor);
          const next = addMonths(d, 1);
          setAnchor(normalizeScopeAnchor("monthly", monthKey(next)));
        }}
        title="Next month"
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sm:hidden">›</span>
      </Button>
    </div>
  );

  const yearlyPicker = (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        variant="ghost"
        className="border border-gray-300 bg-white hover:bg-gray-50 min-w-[40px] sm:min-w-[84px] px-2 sm:px-3"
        icon={<ChevronLeft className="h-3 sm:h-4 w-3 sm:w-4" />}
        iconPosition="left"
        onClick={() => {
          const d = parseYYYYMMDD(anchor);
          const prev = addYears(d, -1);
          setAnchor(normalizeScopeAnchor("yearly", yearKey(prev)));
        }}
        title="Previous year"
      >
        <span className="hidden sm:inline">Prev</span>
        <span className="sm:hidden">‹</span>
      </Button>

      <div className="flex-1 min-w-0">
        <Input
          type="number"
          min={2000}
          max={2100}
          value={yearKey(parseYYYYMMDD(anchor))}
          onChange={(e) =>
            setAnchor(normalizeScopeAnchor("yearly", e.target.value))
          }
          className="w-full"
        />
      </div>

      <Button
        variant="ghost"
        className="border border-gray-300 bg-white hover:bg-gray-50 min-w-[40px] sm:min-w-[84px] px-2 sm:px-3"
        icon={<ChevronRight className="h-3 sm:h-4 w-3 sm:w-4" />}
        iconPosition="right"
        onClick={() => {
          const d = parseYYYYMMDD(anchor);
          const next = addYears(d, 1);
          setAnchor(normalizeScopeAnchor("yearly", yearKey(next)));
        }}
        title="Next year"
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sm:hidden">›</span>
      </Button>
    </div>
  );

  const anchorInput = useMemo(() => {
    if (scope === "daily") return dailyPicker;
    if (scope === "weekly") return weeklyPicker;
    if (scope === "monthly") return monthlyPicker;
    return yearlyPicker;
  }, [scope, anchor]);

  const totals = useMemo(() => {
    if (view === "records") {
      const totalMin = rows.reduce((acc, r) => acc + sumMinutes(r), 0);
      const approvedMin = rows.reduce(
        (acc, r) => acc + (r.approvedTotalMinutes ?? 0),
        0,
      );
      return {
        count: rows.length,
        totalOt: minutesToOt(totalMin),
        approvedOt: minutesToOt(approvedMin),
      };
    } else {
      const totalMin = summary.reduce((acc, r) => acc + sumMinutes(r), 0);
      const approvedMin = summary.reduce(
        (acc, r) => acc + (r.approvedTotalMinutes ?? 0),
        0,
      );
      const count = summary.reduce((acc, r) => acc + (r.count ?? 0), 0);
      return {
        count,
        totalOt: minutesToOt(totalMin),
        approvedOt: minutesToOt(approvedMin),
      };
    }
  }, [view, rows, summary]);

  async function exportExcel() {
    const t = toast.loading("Preparing Excel...");
    try {
      const params = {
        scope,
        anchor,
        employeeId: employeeId || undefined,
        status: status || undefined,
        mode: view, // "records" or "summary"
      };

      const r = await api.get("/ot/logs/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([r.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Try to read filename from header
      const cd = r.headers?.["content-disposition"] as string | undefined;
      let filename = `ot_${scope}_${anchor}_${view}.xlsx`;
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

      toast.success("Excel downloaded", { id: t });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to export", { id: t });
    }
  }

  const shiftTimeMap: Record<string, string> = {
    "Shift 1": "6:30AM",
    "Shift 2": "8:30AM",
    NO_SHIFT: "No Shift",
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              OT Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Filter and review overtime easily (Daily / Weekly / Monthly /
            Yearly)
          </p>
        </div>

        {/* Quick stats */}
        <div className="w-full sm:w-auto rounded-lg sm:rounded-xl border border-gray-200 bg-white px-3 sm:px-4 py-2 text-sm">
          <div className="flex flex-wrap justify-between sm:justify-start gap-3 sm:gap-4">
            <div className="min-w-[80px] sm:min-w-0">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                Records
              </div>
              <div className="font-black text-gray-900 text-sm sm:text-base">
                {totals.count}
              </div>
            </div>
            <div className="min-w-[80px] sm:min-w-0">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                Total OT
              </div>
              <div className="font-black text-gray-900 text-sm sm:text-base">
                {totals.totalOt}
              </div>
            </div>
            <div className="min-w-[80px] sm:min-w-0">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                Approved OT
              </div>
              <div className="font-black text-gray-900 text-sm sm:text-base">
                {totals.approvedOt}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 max-w-full">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-600" />
          <div className="text-sm font-black text-gray-900">Filters</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
          <div className="lg:col-span-2">
            <SelectField
              label="Scope"
              value={scope}
              onValueChange={(v) => changeScope(v as Scope)}
              options={[
                { label: "Daily", value: "daily" },
                { label: "Weekly", value: "weekly" },
                { label: "Monthly", value: "monthly" },
                { label: "Yearly", value: "yearly" },
              ]}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className="text-xs font-semibold text-gray-600 block mb-1 items-center gap-2">
              Pick period
            </label>
            <div className="w-full">{anchorInput}</div>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <SelectField
              label="Employee"
              value={employeeId}
              onValueChange={setEmployeeId}
              options={[
                {
                  label: loadingEmp ? "Loading..." : "All employees",
                  value: "",
                },
                ...employees.map((e) => ({
                  label: `${e.empId} - ${e.name}`,
                  value: e._id,
                })),
              ]}
            />
            <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {employeeId ? "Filtered employee" : "All employees"}
            </div>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <SelectField
              label="Status"
              value={status}
              onValueChange={setStatus}
              options={[
                { label: "All", value: "" },
                { label: "Pending", value: "PENDING" },
                { label: "Approved", value: "APPROVED" },
                { label: "Rejected", value: "REJECTED" },
              ]}
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-1">
            <div className="flex items-end h-full">
              <div className="flex gap-1 sm:gap-2 w-full">
                <Button
                  variant={view === "records" ? "primary" : "ghost"}
                  icon={<List className="h-4 w-4" />}
                  onClick={() => setView("records")}
                  className="flex-1 min-w-0 p-2 border"
                  title="Records view"
                />
                <Button
                  variant={view === "summary" ? "primary" : "ghost"}
                  icon={<BarChart3 className="h-4 w-4" />}
                  onClick={() => setView("summary")}
                  className="flex-1 min-w-0 p-2 border"
                  title="Summary view"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-gray-500 flex-1 max-w-full overflow-hidden">
            <div className="truncate">
              Tip: In <span className="font-semibold">Weekly</span>, just pick
              any date — it will automatically select the correct week.
            </div>
          </div>

          <div className="flex gap-2 self-end sm:self-auto shrink-0">
            <Button
              variant="ghost"
              className="border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-4"
              onClick={() => {
                setEmployeeId("");
                setStatus("");
                setAnchor(normalizeScopeAnchor(scope, todayYYYYMMDD()));
              }}
            >
              <span className="hidden sm:inline">Reset</span>
              <span className="sm:hidden">Clear</span>
            </Button>
            <Button
              variant="ghost"
              className="border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-4"
              icon={
                <RefreshCw
                  className={`h-3 sm:h-4 w-3 sm:w-4 ${loading ? "animate-spin" : ""}`}
                />
              }
              iconPosition="left"
              onClick={loadData}
              disabled={loading}
            >
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Ref</span>
            </Button>
            <Button
              variant="ghost"
              className="border border-gray-300 bg-white hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-4"
              icon={<Download className="h-3 sm:h-4 w-3 sm:w-4" />}
              iconPosition="left"
              onClick={exportExcel}
              disabled={loading}
            >
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg sm:rounded-xl border border-gray-200 bg-white max-w-full">
        {loading ? (
          <div className="flex items-center gap-2 p-4 sm:p-6 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : view === "records" ? (
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full text-sm max-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left min-w-[90px]">
                    Date
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left min-w-[140px] sm:min-w-[180px]">
                    Employee
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell min-w-[80px]">
                    Shift
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden lg:table-cell min-w-[80px]">
                    In
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden lg:table-cell min-w-[80px]">
                    Out
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left min-w-[80px]">
                    OT
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden xl:table-cell min-w-[100px]">
                    Approved
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left min-w-[100px]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                      <div className="block sm:hidden text-xs text-gray-500 mb-1">
                        Date
                      </div>
                      {r.workDate}
                    </td>
                    <td className="px-3 sm:px-4 py-2">
                      <div className="block sm:hidden text-xs text-gray-500 mb-1">
                        Employee
                      </div>
                      <div className="font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none">
                        {r.employeeId.empId}
                      </div>
                      <div className="text-xs text-gray-600 truncate max-w-[120px] sm:max-w-none">
                        {r.employeeId.name}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 hidden sm:table-cell">
                      {shiftTimeMap[r.shift] ?? "Undefined"}
                    </td>
                    <td className="px-3 sm:px-4 py-2 hidden lg:table-cell">
                      <span className="font-mono text-xs sm:text-sm">
                        {r.inTime || "-"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 hidden lg:table-cell">
                      <span className="font-mono text-xs sm:text-sm">
                        {r.outTime || "-"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2">
                      <span className="text-sm sm:text-base">
                        {minutesToOt(sumMinutes(r))}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 hidden xl:table-cell">
                      <span className="text-sm sm:text-base">
                        {minutesToOt(r.approvedTotalMinutes ?? 0)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          r.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : r.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {r.status === "APPROVED" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : r.status === "REJECTED" ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <Clock3 className="h-3 w-3" />
                        )}
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No records found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full text-sm max-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left min-w-[120px]">
                    Period
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left min-w-[80px]">
                    Count
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left min-w-[100px]">
                    Total OT
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left min-w-[100px]">
                    Approved OT
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-2">
                      <div className="truncate max-w-[150px] sm:max-w-none">
                        {r._id instanceof Date
                          ? new Date(r._id).toISOString().slice(0, 10)
                          : String(r._id)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2">{r.count}</td>
                    <td className="px-3 sm:px-4 py-2">
                      <span className="font-black">
                        {minutesToOt(sumMinutes(r))}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2">
                      {minutesToOt(r.approvedTotalMinutes)}
                    </td>
                  </tr>
                ))}
                {!summary.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No summary data found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
