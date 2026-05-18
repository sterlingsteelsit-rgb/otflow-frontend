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
