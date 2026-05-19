import type { OtRow } from "../utils/otTypes";

export type Props = {
  item: OtRow;
  canApprove: boolean;
  canReject: boolean;
  canReadAudit: boolean;
  canUpdate: boolean;
  onApprove: (row: OtRow) => void;
  onReject: (row: OtRow) => void;
  onEdit: (row: OtRow) => void;
  onAudit: (row: OtRow) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
};

export const SHIFT_LABELS: Record<string, string> = {
  NO_SHIFT: "No Shift",
  "Shift 1": "6:30AM",
  "Shift 2": "8:30AM",
};
