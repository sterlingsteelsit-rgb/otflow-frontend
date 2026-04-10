export type EmployeeLite = { _id: string; empId: string; name: string };

export type OtRow = {
  _id: string;
  employeeId: EmployeeLite;
  workDate: string;
  shift: string;
  inTime: string;
  outTime: string;
  reason?: string;
  normalMinutes: number;
  doubleMinutes: number;
  tripleMinutes: number;
  isNight: boolean;
  approvedNormalMinutes?: number;
  approvedDoubleMinutes?: number;
  approvedTripleMinutes?: number;
  approvedTotalMinutes?: number;
  isApprovedOverride?: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export type DayStats = {
  date: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hours: { normal: number; double: number; triple: number };
};

export type CreateRow = {
  id: string;
  employeeId: string;
  shift: string;
  inTime: string;
  outTime: string;
  reason: string;

  manualOverride: boolean;
  normalHours: string;
  doubleHours: string;
  tripleHours: string;
  isNight: boolean;
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

export type ReasonOpt = { _id: string; label: string };

export type BulkApproveRow = {
  id: string;
  employeeLabel: string;
  shift: string;
  inTime: string;
  outTime: string;
  normalMinutes: number;
  doubleMinutes: number;
  tripleMinutes: number;
  approvedNormalMinutes: number;
  approvedDoubleMinutes: number;
  approvedTripleMinutes: number;
  warning?: string;
  canApprove: boolean;
};
