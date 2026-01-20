/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { RefreshCw, Users, User, Clock, Calendar } from "lucide-react";
import Loading from "../components/ui/Loading";

type DayStats = {
  date: string; // YYYY-MM-DD
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hours: { normal: number; double: number; triple: number };
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
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function sumWeek(items: DayStats[]) {
  return items.reduce(
    (acc, it) => {
      acc.total += it.total || 0;
      acc.pending += it.pending || 0;
      acc.approved += it.approved || 0;
      acc.rejected += it.rejected || 0;
      acc.hours.normal += it.hours?.normal || 0;
      acc.hours.double += it.hours?.double || 0;
      acc.hours.triple += it.hours?.triple || 0;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      hours: { normal: 0, double: 0, triple: 0 },
    },
  );
}

function StatCard(props: {
  title: string;
  value: string;
  sub?: string;
  right?: string;
  footer?: string;
  icon?: React.ElementType;
}) {
  const Icon = props.icon;
  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-gray-500" />}
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {props.title}
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-gray-900">
            {props.value}
          </div>
          {props.sub ? (
            <div className="mt-1 text-sm text-gray-600">{props.sub}</div>
          ) : null}
        </div>
        {props.right ? (
          <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/80 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200">
            {props.right}
          </div>
        ) : null}
      </div>

      {props.footer ? (
        <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
          {props.footer}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardPage() {
  const { state, has } = useAuth();
  const authReady = !state.loading && !!state.accessToken;

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toYYYYMMDD(today), [today]);

  const weekStart = useMemo(() => startOfWeekMonday(today), [today]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekFrom = useMemo(() => toYYYYMMDD(weekStart), [weekStart]);
  const weekTo = useMemo(() => toYYYYMMDD(weekEnd), [weekEnd]);

  const canUsers = has("users.read");
  const canEmployees = has("employees.read");
  const canStats = has("ot.stats.read");
  const canAudit = has("audit.read");

  const [loading, setLoading] = useState(false);

  const [employeesTotal, setEmployeesTotal] = useState<number | null>(null);
  const [usersTotal, setUsersTotal] = useState<number | null>(null);

  const [todayStats, setTodayStats] = useState<DayStats | null>(null);
  const [weekStats, setWeekStats] = useState<DayStats[]>([]);
  const weekSum = useMemo(() => sumWeek(weekStats), [weekStats]);

  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);

  async function loadDashboard() {
    if (!authReady) return;

    setLoading(true);
    try {
      const jobs: Promise<any>[] = [];

      // Employees total
      if (canEmployees) {
        jobs.push(
          api
            .get("/employees", { params: { page: 1, limit: 1 } })
            .then((r) => setEmployeesTotal(r.data?.total ?? r.data?.count ?? 0))
            .catch((e) => {
              setEmployeesTotal(null);
              toast.error(
                e?.response?.data?.message ?? "Failed to load employees total",
              );
            }),
        );
      }

      // Users total
      if (canUsers) {
        jobs.push(
          api
            .get("/users", { params: { page: 1, limit: 1 } })
            .then((r) => setUsersTotal(r.data?.total ?? r.data?.count ?? 0))
            .catch((e) => {
              setUsersTotal(null);
              toast.error(e?.response?.data?.message ?? "Failed to load users");
            }),
        );
      }

      // Today stats + week stats
      if (canStats) {
        jobs.push(
          api
            .get("/ot/stats/day", { params: { date: todayStr } })
            .then((r) => setTodayStats(r.data))
            .catch((e) => {
              setTodayStats(null);
              toast.error(
                e?.response?.data?.message ?? "Failed to load today stats",
              );
            }),
        );

        jobs.push(
          api
            .get("/ot/stats/week", { params: { from: weekFrom, to: weekTo } })
            .then((r) => setWeekStats(r.data?.items ?? []))
            .catch((e) => {
              setWeekStats([]);
              toast.error(
                e?.response?.data?.message ?? "Failed to load week stats",
              );
            }),
        );
      }

      // Recent audit
      if (canAudit) {
        jobs.push(
          api
            .get("/audit", { params: { page: 1, limit: 6 } })
            .then((r) => setAuditRows(r.data?.items ?? []))
            .catch((e) => {
              setAuditRows([]);
              toast.error(
                e?.response?.data?.message ?? "Failed to load audit logs",
              );
            }),
        );
      }

      await Promise.all(jobs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, canEmployees, canUsers, canStats, canAudit]);

  const weekChartData = useMemo(() => {
    // normalize to 7 days (Mon..Sun)
    const days = Array.from({ length: 7 }, (_, i) =>
      toYYYYMMDD(addDays(weekStart, i)),
    );
    const map = new Map<string, DayStats>();
    for (const it of weekStats) map.set(it.date, it);

    return days.map((d) => {
      const it = map.get(d);
      const label = new Date(d + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "short",
      });
      return {
        date: d,
        day: label,
        total: it?.total ?? 0,
        pending: it?.pending ?? 0,
        approved: it?.approved ?? 0,
        rejected: it?.rejected ?? 0,
        normal: it?.hours?.normal ?? 0,
        double: it?.hours?.double ?? 0,
        triple: it?.hours?.triple ?? 0,
      };
    });
  }, [weekStats, weekStart]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border rounded-xl border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
        <div>
          <div className="mt-1 text-sm text-gray-600">
            Week:{" "}
            <span className="font-medium text-gray-800">
              {weekFrom} → {weekTo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
              <Loading variant="dots" />
            </div>
          ) : null}
          <Button
            variant="ghost"
            onClick={loadDashboard}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow"
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Employees"
          value={
            canEmployees
              ? employeesTotal === null
                ? "—"
                : String(employeesTotal)
              : "Hidden"
          }
          sub={canEmployees ? "Total active employees" : "No permission"}
          right={canEmployees ? "employees.read" : undefined}
          icon={Users}
        />

        <StatCard
          title="Users"
          value={
            canUsers
              ? usersTotal === null
                ? "—"
                : String(usersTotal)
              : "Hidden"
          }
          sub={canUsers ? "System users" : "No permission"}
          right={canUsers ? "users.read" : undefined}
          icon={User}
        />

        <StatCard
          title="OT Today"
          value={canStats ? String(todayStats?.total ?? 0) : "Hidden"}
          sub={
            canStats
              ? `Pending ${todayStats?.pending ?? 0} • Approved ${
                  todayStats?.approved ?? 0
                } • Rejected ${todayStats?.rejected ?? 0}`
              : "No permission"
          }
          footer={
            canStats
              ? `Hours: N ${todayStats?.hours?.normal ?? 0} • D ${
                  todayStats?.hours?.double ?? 0
                } • T ${todayStats?.hours?.triple ?? 0}`
              : undefined
          }
          right={canStats ? "ot.stats.read" : undefined}
          icon={Clock}
        />

        <StatCard
          title="This Week"
          value={canStats ? String(weekSum.total) : "Hidden"}
          sub={
            canStats
              ? `Pending ${weekSum.pending} • Approved ${weekSum.approved} • Rejected ${weekSum.rejected}`
              : "No permission"
          }
          footer={
            canStats
              ? `Hours: N ${weekSum.hours.normal} • D ${weekSum.hours.double} • T ${weekSum.hours.triple}`
              : undefined
          }
          right={canStats ? "ot.stats.read" : undefined}
          icon={Calendar}
        />
      </div>

      {/* Charts */}
      {canStats ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-gray-900">
                  Weekly OT Entries
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Total entries per day
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-brand-blue/10 to-blue-100/50 px-3 py-1 text-xs font-semibold text-brand-blue">
                {weekSum.total} total
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      background: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(4px)",
                    }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-gray-900">
                  Weekly Hours
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Normal / Double / Triple hours
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-brand-blue/10 to-blue-100/50 px-3 py-1 text-xs font-semibold text-brand-blue">
                Total hours
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      background: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(4px)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="normal"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="double"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="triple"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Charts are hidden (no{" "}
              <span className="font-semibold text-gray-900">ot.stats.read</span>{" "}
              permission).
            </div>
            <div className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              Restricted
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-black text-gray-900">
              Recent Activity
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Latest system audit logs
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/80 px-3 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
            {canAudit ? "audit.read" : "Hidden"}
          </div>
        </div>

        {canAudit ? (
          auditRows.length ? (
            <div className="space-y-3">
              {auditRows.map((a) => (
                <div
                  key={a._id}
                  className="rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-gray-900">
                          {a.action}
                        </div>
                        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                        <div className="text-xs text-gray-600">
                          {a.entityType}
                        </div>
                        <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                        <div className="text-xs font-mono text-gray-500">
                          {a.entityId.substring(0, 8)}...
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <div className="font-medium">By:</div>
                        <div className="rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-800">
                          {a.actorUserId?.username ??
                            a.actorUserId?.email ??
                            "System"}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {new Date(a.createdAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
              <div className="text-sm text-gray-500">
                No audit logs available
              </div>
            </div>
          )
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
            <div className="text-sm text-gray-500">
              Activity is hidden (no permission)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
