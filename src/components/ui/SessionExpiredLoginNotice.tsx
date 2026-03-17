/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

export default function SessionExpiredLoginNotice() {
  const { state } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismiss when reason changes
  useEffect(() => {
    setDismissed(false);
  }, [state.logoutReason]);

  const show = state.logoutReason === "SESSION_EXPIRED" && !dismissed;

  if (!show) return null;

  const node = (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="absolute top-4 left-1/2 w-[min(640px,calc(100vw-24px))] -translate-x-1/2 pointer-events-auto">
        <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-xl">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>

                <div>
                  <div className="font-black text-gray-900">
                    You were logged out
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Your session expired. Please log in again to continue.
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
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
