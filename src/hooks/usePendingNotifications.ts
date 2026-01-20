import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";

type PendingItem = {
  id: string;
  createdAt: string;
  workDate: string;
  shift: string;
  inTime: string;
  outTime: string;
  employee: { empId: string; name: string } | null;
};

export function usePendingNotifications(enabled: boolean) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const lastFetchAtRef = useRef<number>(0);

  const fetchNow = useCallback(async () => {
    // throttle: avoid hammering if user clicks fast
    const now = Date.now();
    if (now - lastFetchAtRef.current < 800) return;
    lastFetchAtRef.current = now;

    setLoading(true);
    try {
      const r = await api.get("/ot/notifications/pending", {
        params: { limit: 8 },
      });
      setCount(r.data.pendingCount ?? 0);
      setItems(r.data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch only when dropdown is opened (enabled=true)
  useEffect(() => {
    if (!enabled) return;
    fetchNow();
  }, [enabled, fetchNow]);

  return { count, items, loading, refresh: fetchNow };
}
