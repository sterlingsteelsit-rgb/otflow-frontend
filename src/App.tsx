/* eslint-disable react-hooks/set-state-in-effect */
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { useAuth } from "./auth/AuthContext";
import { useEffect, useState, type JSX } from "react";
import Loading from "./components/ui/Loading";

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
import FingerPrintLogFormatter from "./pages/utils/LogsUploader";
import { EmailCenterPage } from "./pages/EmailCenterPage";

function Protected({ children }: { children: JSX.Element }) {
  const { state } = useAuth();

  const [phase, setPhase] = useState<
    "loading" | "success" | "redirect" | "done"
  >("loading");

  useEffect(() => {
    if (state.loading) {
      setPhase("loading");
      return;
    }

    const nextPhase = state.user ? "success" : "redirect";
    setPhase(nextPhase);

    const timeout = setTimeout(() => {
      setPhase("done");
    }, 800);

    return () => clearTimeout(timeout);
  }, [state.loading, state.user]);

  if (state.loading || phase !== "done") {
    const currentPhase = state.loading ? "loading" : phase;

    return (
      <Loading
        center="screen"
        text={
          currentPhase === "loading"
            ? "Connecting you to the server..."
            : currentPhase === "success"
              ? "Connection established."
              : "Redirecting to login..."
        }
        variant={currentPhase === "success" ? "success" : "spinner"}
        typewriter={currentPhase === "loading"}
        repeat={false}
      />
    );
  }

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
        <Route
          path="/fingerprint/process"
          element={<FingerPrintLogFormatter />}
        />
        <Route path="/email-center" element={<EmailCenterPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
