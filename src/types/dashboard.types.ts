export type DayStats = {
  date: string; // YYYY-MM-DD
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hours: { normal: number; double: number; triple: number };
};

export type AuditRow = {
  _id: string;
  createdAt: string;
  actorUserId?: { username?: string; email?: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, unknown>;
};
