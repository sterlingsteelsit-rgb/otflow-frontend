import { useMemo, useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Triangle,
  HelpCircle,
  Shield,
  ChevronDown,
  LogOut,
  UserCircle,
  Settings,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { usePendingNotifications } from "../../hooks/usePendingNotifications";
import { Portal } from "./Portal";
import { api } from "../../api/client";
import Loading from "../ui/Loading";

type SidebarMode = "full" | "hidden";

function Item({
  to,
  label,
  Icon,
  mode,
  onClick,
}: {
  to: string;
  label: string;
  Icon: React.ElementType;
  mode: SidebarMode;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:translate-x-0.5 hover:shadow-sm",
          isActive
            ? "bg-gradient-to-r from-brand-blue/90 to-brand-blue text-white shadow-md"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {mode === "full" && <span className="tracking-tight">{label}</span>}
    </NavLink>
  );
}

function CollapsibleGroup({
  label,
  Icon,
  open,
  onToggle,
  mode,
  children,
}: {
  label: string;
  Icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
  mode: SidebarMode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
          "hover:bg-gray-50 hover:shadow-sm",
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0 text-gray-600" />
          {mode === "full" && (
            <span className="tracking-tight text-gray-800">{label}</span>
          )}
        </div>

        {mode === "full" && (
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && mode === "full" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="ml-7 overflow-hidden space-y-1.5 border-l border-gray-200 pl-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell() {
  const { state, logout, has } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<SidebarMode>("full");

  const [managementOpen, setManagementOpen] = useState(false);
  const [otOpen, setOtOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const canSeeNotifs = has("ot.approve");
  const { items, loading, refresh } = usePendingNotifications(
    notifOpen && canSeeNotifs,
  );
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function loadCount() {
      try {
        const r = await api.get("/ot/notifications/count");
        setCount(r.data.pending ?? 0);
      } catch (e) {
        console.error("Failed to load notification count", e);
      }
    }

    loadCount();
  }, []);

  useEffect(() => {
    const path = location.pathname;

    if (path.startsWith("/users") || path.startsWith("/employees")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setManagementOpen(true);
    } else {
      setManagementOpen(false);
    }

    // Only check for /ot paths, not /triple-ot or /ot-reason
    if (path.startsWith("/ot/entry")) {
      setOtOpen(true);
    } else {
      setOtOpen(false);
    }

    // Only check for /audit, not /admin
    if (path.startsWith("/audit")) {
      setAdminOpen(true);
    } else {
      setAdminOpen(false);
    }
  }, [location.pathname]);

  const sidebarWidth = useMemo(() => {
    if (mode === "hidden") return "w-0";
    return "w-60";
  }, [mode]);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-50 to-white text-black">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside
          className={cn(
            "h-full overflow-hidden border-r border-gray-200 bg-white/95 backdrop-blur-sm transition-[width] duration-300",
            "shadow-lg shadow-black/5",
            sidebarWidth,
          )}
        >
          <div
            className={cn(
              "flex h-full flex-col transition-opacity duration-300",
              mode === "hidden" ? "opacity-0" : "opacity-100",
            )}
          >
            {/* Logo with User Info */}
            <div className="border-b border-gray-200/50 px-4 py-4">
              <div className="flex items-center gap-3">
                {mode === "full" ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-blue-600 shadow-md">
                      <span className="text-lg font-black text-white">OT</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black tracking-tight text-gray-900">
                        OT<span className="text-brand-blue">Flow</span>
                      </div>
                      <div className="flex items-center gap-2 truncate text-xs text-gray-600">
                        <UserCircle className="h-3 w-3" />
                        <span className="truncate font-medium">
                          {state.user?.username}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-blue-600 shadow-md mx-auto">
                    <span className="text-lg font-black text-white">OT</span>
                  </div>
                )}
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-2">
              <Item
                to="/dashboard"
                label="Dashboard"
                Icon={LayoutDashboard}
                mode={mode}
              />

              {has("users.read") || has("employees.read") ? (
                <CollapsibleGroup
                  label="Management"
                  Icon={Users}
                  open={managementOpen}
                  onToggle={() => setManagementOpen((o) => !o)}
                  mode={mode}
                >
                  {has("users.read") && (
                    <Item to="/users" label="Users" Icon={Users} mode={mode} />
                  )}
                  {has("employees.read") && (
                    <Item
                      to="/employees"
                      label="Employees"
                      Icon={FileText}
                      mode={mode}
                    />
                  )}
                </CollapsibleGroup>
              ) : null}

              {has("ot.read") ? (
                <CollapsibleGroup
                  label="Overtime"
                  Icon={Clock}
                  open={otOpen}
                  onToggle={() => setOtOpen((o) => !o)}
                  mode={mode}
                >
                  {has("ot.read") && (
                    <Item
                      to="/ot/entry"
                      label="OT Entry"
                      Icon={Clock}
                      mode={mode}
                    />
                  )}
                </CollapsibleGroup>
              ) : null}

              {has("audit.read") ? (
                <CollapsibleGroup
                  label="Administration"
                  Icon={Shield}
                  open={adminOpen}
                  onToggle={() => setAdminOpen((o) => !o)}
                  mode={mode}
                >
                  {has("audit.read") && (
                    <Item
                      to="/audit"
                      label="Audit Logs"
                      Icon={FileText}
                      mode={mode}
                    />
                  )}
                </CollapsibleGroup>
              ) : null}
            </nav>

            {/* Footer with Settings and Logout */}
            <div className="border-t border-gray-200/50 p-4 bg-gradient-to-t from-gray-50 to-white space-y-2">
              {/* Settings Button */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-all duration-200",
                  "bg-gradient-to-r from-gray-50 to-gray-100/80 text-gray-700",
                  "hover:from-gray-100 hover:to-gray-200/80 hover:text-gray-900",
                  "border border-gray-200 hover:border-gray-300 hover:shadow-sm",
                )}
                onClick={() => setSettingsOpen((o) => !o)}
                icon={<Settings className="h-4 w-4" />}
              >
                {mode === "full" && (
                  <span className="font-medium tracking-tight">Settings</span>
                )}
              </Button>

              {/* Settings Menu - Opens vertically to top */}
              <AnimatePresence>
                {settingsOpen && mode === "full" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-7 space-y-1.5 border-l border-gray-200 pl-3 pb-2">
                      {has("tripleOt.read") && (
                        <Item
                          to="/triple-ot"
                          label="Triple OT"
                          Icon={Triangle}
                          mode={mode}
                          onClick={() => setSettingsOpen(false)}
                        />
                      )}
                      {has("reasons.read") && (
                        <Item
                          to="/ot-reason"
                          label="OT Reason"
                          Icon={HelpCircle}
                          mode={mode}
                          onClick={() => setSettingsOpen(false)}
                        />
                      )}
                      {has("roles.read") && (
                        <Item
                          to="/admin/config"
                          label="Role Management"
                          Icon={Settings}
                          mode={mode}
                          onClick={() => setSettingsOpen(false)}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Logout Button */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-all duration-200",
                  "bg-gradient-to-r from-red-50 to-red-100/80 text-red-600",
                  "hover:from-red-100 hover:to-red-200/80 hover:text-red-700",
                  "border border-red-200 hover:border-red-300 hover:shadow-sm",
                )}
                onClick={logout}
                icon={<LogOut className="h-4 w-4" />}
              >
                {mode === "full" && (
                  <span className="font-medium tracking-tight">Logout</span>
                )}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-gray-50/30 to-white">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 py-3.5 shadow-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() =>
                  setMode((m) => (m === "full" ? "hidden" : "full"))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow"
                icon={
                  mode === "full" ? (
                    <Menu className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )
                }
              >
                {mode === "full" ? "" : ""}
              </Button>

              <div className="flex items-center gap-3 border px-4 py-2 rounded-lg border-gray-300 bg-white shadow-sm">
                <div className="text-sm text-gray-600">
                  Role:{" "}
                  <span className="font-semibold text-gray-900 px-2 py-1 bg-gray-100 rounded-md flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    {state.user?.role.name}
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="text-sm text-gray-600">
                  Status:{" "}
                  <span className="font-semibold text-green-600 px-2 py-1 bg-green-50 rounded-md flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Online
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  animate={{ rotate: [-4, 4, -4] }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                >
                  <Button
                    variant="ghost"
                    className="rounded-full p-2 hover:bg-gray-100 relative"
                    onClick={() => {
                      if (!canSeeNotifs) return;
                      setNotifOpen((v) => !v);
                    }}
                    icon={<Bell className="h-5 w-5 text-gray-600" />}
                  />
                </motion.div>

                {canSeeNotifs && count > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-blue text-white text-[10px] font-bold flex items-center justify-center">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}

                <AnimatePresence>
                  {notifOpen && canSeeNotifs ? (
                    <Portal>
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="fixed right-6 top-[100px] w-[360px] max-w-[90vw] rounded-xl border border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg shadow-black/5 overflow-hidden z-[9999]"
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white/80">
                          <div>
                            <div className="text-sm font-black text-gray-900 tracking-tight">
                              Pending approvals
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {loading ? (
                                <Loading variant="dots" />
                              ) : (
                                `${count} pending`
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow"
                            onClick={refresh}
                          >
                            Refresh
                          </Button>
                        </div>

                        <div className="max-h-[360px] overflow-auto">
                          {items.length === 0 && !loading ? (
                            <div className="px-4 py-8 text-center">
                              <div className="text-sm text-gray-500">
                                No pending approvals 🎉
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                All caught up!
                              </div>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {items.map((x) => (
                                <div
                                  key={x.id}
                                  className="block px-4 py-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-150"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue/20 to-blue-100/50">
                                          <div className="text-xs font-bold text-brand-blue">
                                            {x.employee?.empId?.charAt(0) ||
                                              "?"}
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-semibold text-gray-900 truncate">
                                            {x.employee?.empId ?? "Unknown"}
                                          </div>
                                          <div className="text-xs text-gray-600 truncate">
                                            {x.employee?.name ?? ""}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-2 text-xs text-gray-600">
                                        <div className="flex items-center gap-3">
                                          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-800">
                                            {x.workDate}
                                          </span>
                                          <span className="text-gray-400">
                                            •
                                          </span>
                                          <span className="font-medium">
                                            {x.shift}
                                          </span>
                                          <span className="text-gray-400">
                                            •
                                          </span>
                                          <span className="font-mono">
                                            {x.inTime}–{x.outTime}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-[11px] text-gray-500 whitespace-nowrap rounded-lg bg-gray-100/80 px-2 py-1">
                                      {new Date(x.createdAt).toLocaleTimeString(
                                        [],
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        },
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {items.length > 0 && (
                          <div className="border-t border-gray-200/50 px-4 py-2.5 bg-gradient-to-t from-gray-50 to-white/80">
                            <div className="text-xs text-gray-600 text-center">
                              Click on any item to review
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </Portal>
                  ) : null}
                </AnimatePresence>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-blue to-blue-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {state.user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                {mode === "hidden" ? (
                  <div className="text-sm font-medium text-gray-700">
                    {state.user?.username}
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
