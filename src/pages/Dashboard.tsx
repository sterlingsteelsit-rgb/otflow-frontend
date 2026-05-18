/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
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
import type { DayStats, AuditRow } from "../types/dashboard.types";
import {
  toYYYYMMDD,
  addDays,
  startOfWeekMonday,
  sumWeek,
} from "../utils/dashboard.func";

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
    <div className="stat-card rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/40">
      {" "}
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

  const abortRef = useRef<AbortController | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  async function loadDashboard() {
    if (!authReady) return;
    if (loading) return;

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const next = {
        employeesTotal: null as number | null,
        usersTotal: null as number | null,
        todayStats: null as DayStats | null,
        weekStats: [] as DayStats[],
        auditRows: [] as AuditRow[],
      };

      const jobs: Promise<any>[] = [];

      if (canEmployees) {
        jobs.push(
          api
            .get("/employees", {
              params: { page: 1, limit: 1 },
              signal: controller.signal,
            })
            .then((r) => {
              next.employeesTotal = r.data?.total ?? r.data?.count ?? 0;
            }),
        );
      }

      if (canUsers) {
        jobs.push(
          api
            .get("/users", {
              params: { page: 1, limit: 1 },
              signal: controller.signal,
            })
            .then((r) => {
              next.usersTotal = r.data?.total ?? r.data?.count ?? 0;
            }),
        );
      }

      if (canStats) {
        jobs.push(
          api
            .get("/ot/stats/day", {
              params: { date: todayStr },
              signal: controller.signal,
            })
            .then((r) => {
              next.todayStats = r.data;
            }),
        );

        jobs.push(
          api
            .get("/ot/stats/week", {
              params: { from: weekFrom, to: weekTo },
              signal: controller.signal,
            })
            .then((r) => {
              next.weekStats = r.data?.items ?? [];
            }),
        );
      }

      if (canAudit) {
        jobs.push(
          api
            .get("/audit", {
              params: { page: 1, limit: 6 },
              signal: controller.signal,
            })
            .then((r) => {
              next.auditRows = r.data?.items ?? [];
            }),
        );
      }

      await Promise.all(
        jobs.map((p) =>
          p.catch((e) => {
            if (controller.signal.aborted) return;
            toast.error(
              e?.response?.data?.message ?? "Failed to load dashboard data.",
            );
          }),
        ),
      );
      setEmployeesTotal(next.employeesTotal);
      setUsersTotal(next.usersTotal);
      setTodayStats(next.todayStats);
      setWeekStats(next.weekStats);
      setAuditRows(next.auditRows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, canEmployees, canUsers, canStats, canAudit]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Page fade
      gsap.fromTo(
        pageRef.current,
        {
          opacity: 0,
        },
        {
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
        },
      );

      // Header slide
      gsap.fromTo(
        headerRef.current,
        {
          y: -20,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
        },
      );

      // KPI cards stagger
      const cards = cardsRef.current?.querySelectorAll(".stat-card");

      gsap.fromTo(
        cards || [],
        {
          y: 30,
          opacity: 0,
          scale: 0.96,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.1,
          duration: 0.7,
          ease: "back.out(1.4)",
          delay: 0.15,
        },
      );

      // Charts animation
      gsap.fromTo(
        chartsRef.current?.children || [],
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.9,
          ease: "power4.out",
          delay: 0.35,
        },
      );

      // Activity section
      gsap.fromTo(
        activityRef.current,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.5,
        },
      );
    });

    return () => ctx.revert();
  }, []);

  const weekMap = useMemo(() => {
    return new Map(weekStats.map((i) => [i.date, i]));
  }, [weekStats]);

  const weekChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dateObj = addDays(weekStart, i);
      const d = toYYYYMMDD(dateObj);
      const it = weekMap.get(d);

      return {
        date: d,
        day: dateObj.toLocaleDateString(undefined, { weekday: "short" }),
        total: it?.total ?? 0,
        pending: it?.pending ?? 0,
        approved: it?.approved ?? 0,
        rejected: it?.rejected ?? 0,
        normal: it?.hours?.normal ?? 0,
        double: it?.hours?.double ?? 0,
        triple: it?.hours?.triple ?? 0,
      };
    });
  }, [weekStart, weekMap]);

  const axisTick = useMemo(() => ({ fill: "#6b7280" }), []);
  const tooltipStyle = useMemo(
    () => ({
      borderRadius: "8px",
      border: "1px solid #e5e7eb",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(4px)",
    }),
    [],
  );

  return (
    <div ref={pageRef} className="space-y-6">
      <div
        ref={headerRef}
        className="flex flex-wrap items-center justify-between gap-3 border rounded-xl border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm"
      >
        {" "}
        <div>
          <div className="mt-1 text-sm text-gray-600">
            Week:{" "}
            <span className="font-medium text-gray-800">
              {weekFrom} → {weekTo}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 shadow-sm">
          {loading && (
            <>
              <Loading variant="dots" />
              <div className="mx-1 h-4 w-px bg-gray-200" />
            </>
          )}

          <button
            onClick={loadDashboard}
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        ref={cardsRef}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
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
        <div ref={chartsRef} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {" "}
          <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/30">
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

            {canStats && weekChartData.length > 0 && (
              <div className="h-72 min-h-[18rem] w-full flex items-center justify-center">
                <div className="w-full">
                  <ResponsiveContainer width="100%" aspect={2.8}>
                    <BarChart data={weekChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={axisTick}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={axisTick}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar
                        dataKey="total"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/30">
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

            <div className="h-72 w-full flex items-center justify-center">
              <div className="w-full">
                <ResponsiveContainer width="100%" aspect={2.8}>
                  <LineChart data={weekChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={axisTick}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                    <Tooltip contentStyle={tooltipStyle} />
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
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/30">
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
      <div
        ref={activityRef}
        className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 shadow-sm"
      >
        {" "}
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
                  className="rounded-lg border border-gray-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/60"
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
