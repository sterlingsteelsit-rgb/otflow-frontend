import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { useAuth } from "./auth/AuthContext";
import type { JSX } from "react";
import Loading from "./components/ui/Loading";

// Pages
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { UsersPage } from "./pages/Users";
import { AdminConfigPage } from "./pages/AdminConfig";
import { EmployeesPage } from "./pages/Employees";
import { OtEntryPage } from "./pages/OtEntry";
import { AuditLogsPage } from "./pages/AuditLogs";
import { TripleOtConfigPage } from "./pages/TripleOtConfig";
import { DecisionReasonsPage } from "./pages/DecisionReasonsPage";

function Protected({ children }: { children: JSX.Element }) {
  const { state } = useAuth();
  if (state.loading) return <Loading variant="spinner" center="screen" text="Loading State.." />;
  if (!state.user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="admin/config" element={<AdminConfigPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="ot/entry" element={<OtEntryPage />} />
        <Route path="/triple-ot" element={<TripleOtConfigPage />} />
        <Route path="/audit" element={<AuditLogsPage />} />
        <Route path="/ot-reason" element={<DecisionReasonsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
