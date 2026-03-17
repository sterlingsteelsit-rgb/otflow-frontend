/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "./Button";
import { useAuth } from "../../auth/AuthContext";

const WARNING_AT = 50;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function SessionExpiryWarning() {
  const { state } = useAuth();
  const remaining = state.remainingSec ?? 0;
  const [dismissed, setDismissed] = useState(false);
  const [lastCycleKey, setLastCycleKey] = useState<string>("");

  const cycleKey = String(state.expiresAt ?? "noexp");

  useEffect(() => {
    if (cycleKey !== lastCycleKey) {
      setDismissed(false);
      setLastCycleKey(cycleKey);
    }
  }, [cycleKey, lastCycleKey]);

  const shouldShow =
    !!state.accessToken &&
    !state.loading &&
    remaining > 0 &&
    remaining <= WARNING_AT &&
    !dismissed;

  const percent = useMemo(() => {
    return clamp(((WARNING_AT - remaining) / WARNING_AT) * 100, 0, 100);
  }, [remaining]);

  function reloadApp() {
    window.location.reload();
  }

  if (!shouldShow) return null;

  const node = (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* light backdrop just around bottom area */}
      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute bottom-4 left-1/2 w-[min(720px,calc(100vw-24px))] -translate-x-1/2 pointer-events-auto">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-xl">
          {/* top strip */}
          <div className="h-1.5 w-full bg-gray-100">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>

                <div className="min-w-0">
                  <div className="font-black text-gray-900">
                    Session expiring in {remaining}s
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Please save your work. Reloading the app will refresh your
                    session. If you continue, you may get logged out and lose
                    unsaved changes.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDismissed(true)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-gray-500">
                Tip: Reload after saving to refresh the session.
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDismissed(true)}
                  className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
                >
                  Keep working
                </Button>

                <Button
                  onClick={reloadApp}
                  icon={<RefreshCw className="h-4 w-4" />}
                  iconPosition="left"
                  className="rounded-lg border border-orange-600 bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-black text-white shadow-sm transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow"
                >
                  Save & Reload
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
