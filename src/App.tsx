import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { useAuth } from "./auth/AuthContext";
import type { JSX } from "react";
import StateLoader from "./components/ui/StateLoader";

// Pages
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { UsersPage } from "./pages/Users";
import { AdminConfigPage } from "./pages/AdminConfig";
import { EmployeesPage } from "./pages/Employees";
import { OtEntryPage } from "./pages/OtEntry";
import AuditLogsPage from "./pages/AuditLogs";
import { TripleOtConfigPage } from "./pages/TripleOtConfig";
import { DecisionReasonsPage } from "./pages/DecisionReasonsPage";
import OtLogsPage from "./pages/OtLogsPage";

function Protected({ children }: { children: JSX.Element }) {
  const { state } = useAuth();
  if (state.loading)
    return (
      <StateLoader
        message="Secure Connection"
        showProgress={true}
        connectionSpeed="medium"
        size="lg"
        showConnectionSteps={true}
      />
    );
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
        <Route path="ot/logs" element={<OtLogsPage />} />
        <Route path="/triple-ot" element={<TripleOtConfigPage />} />
        <Route path="/audit" element={<AuditLogsPage />} />
        <Route path="/ot-reason" element={<DecisionReasonsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
