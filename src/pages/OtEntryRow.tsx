import React from "react";
import {
  User,
  Moon,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Pencil,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import type { OtRow } from "../utils/otTypes";

function minutesToOt(min: number) {
  const h = Math.round((min / 60) * 100) / 100;
  const s = String(h).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
  return `${s}`;
}

type Props = {
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
  onToggleSelect?: () => void;
};

function OtEntryRowComponent({
  item,
  canApprove,
  canReject,
  canReadAudit,
  canUpdate,
  onApprove,
  onReject,
  onEdit,
  onAudit,
  isSelected = false,
  onToggleSelect = () => {},
}: Props) {
  const shiftLabel =
    item.shift === "NO_SHIFT"
      ? "No Shift"
      : item.shift === "Shift 1"
        ? "6:30AM"
        : item.shift === "Shift 2"
          ? "8:30AM"
          : item.shift || "";

  const n = minutesToOt(item.normalMinutes);
  const d = minutesToOt(item.doubleMinutes);
  const t = minutesToOt(item.tripleMinutes);
  const total = minutesToOt(
    item.normalMinutes + item.doubleMinutes + item.tripleMinutes,
  );
  const approved = minutesToOt(item.approvedTotalMinutes ?? 0);

  const dimN = n === "0";
  const dimD = d === "0";
  const dimT = t === "0";

  return (
    <tr className="transition-colors duration-150 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/30">
      <td className="px-5 py-3">
        {item.status === "PENDING" ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
          />
        ) : null}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue/20 to-blue-100/50">
            <User className="h-4 w-4 text-brand-blue" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-black text-gray-900">
              {item.employeeId?.empId}
            </div>
            <div className="truncate text-xs text-gray-600">
              {item.employeeId?.name}
            </div>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="font-medium text-gray-900">{shiftLabel}</div>
      </td>

      <td className="px-5 py-4">
        <div className="font-mono font-semibold text-gray-900">
          {item.inTime?.trim() ? (
            item.inTime
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="font-mono font-semibold text-gray-900">
          {item.outTime?.trim() ? (
            item.outTime
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-stretch justify-between gap-4 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <div className="space-y-1 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className={dimN ? "text-gray-400" : "font-medium"}>
                Normal
              </span>
              <span
                className={dimN ? "text-gray-400" : "font-black text-gray-900"}
              >
                ({n})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className={dimD ? "text-gray-400" : "font-medium"}>
                Double
              </span>
              <span
                className={dimD ? "text-gray-400" : "font-black text-gray-900"}
              >
                ({d})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className={dimT ? "text-gray-400" : "font-medium"}>
                Triple
              </span>
              <span
                className={dimT ? "text-gray-400" : "font-black text-gray-900"}
              >
                ({t})
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center border-l border-gray-200 pl-4 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Total
            </div>
            <div className="text-lg font-black leading-none text-gray-900">
              {total}
            </div>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div
          className={[
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            item.isNight
              ? "bg-purple-50 text-purple-700"
              : "bg-gray-100 text-gray-700",
          ].join(" ")}
        >
          <Moon className="h-3 w-3" />
          {item.isNight ? "Yes" : "No"}
        </div>
      </td>

      <td className="px-5 py-4">
        {item.status === "APPROVED" ? (
          <div className="font-black text-gray-900">{approved}</div>
        ) : (
          <div className="text-xs text-gray-400">—</div>
        )}
      </td>

      <td className="px-5 py-4">
        <div
          className={[
            "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black",
            item.status === "PENDING" ? "bg-blue-50 text-blue-700" : "",
            item.status === "APPROVED" ? "bg-green-50 text-green-700" : "",
            item.status === "REJECTED" ? "bg-red-50 text-red-700" : "",
          ].join(" ")}
        >
          {item.status === "PENDING" && <Clock className="h-3 w-3" />}
          {item.status === "APPROVED" && <CheckCircle className="h-3 w-3" />}
          {item.status === "REJECTED" && <XCircle className="h-3 w-3" />}
          {item.status}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {item.status === "PENDING" && canApprove ? (
            <Button
              variant="ghost"
              onClick={() => onApprove(item)}
              icon={<CheckCircle className="h-3 w-3" />}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Approve
            </Button>
          ) : null}

          {item.status === "PENDING" && canReject ? (
            <Button
              variant="ghost"
              onClick={() => onReject(item)}
              icon={<XCircle className="h-3 w-3" />}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Reject
            </Button>
          ) : null}

          {item.status === "PENDING" && canUpdate ? (
            <Button
              variant="ghost"
              onClick={() => onEdit(item)}
              icon={<Pencil className="h-3 w-3" />}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Edit
            </Button>
          ) : null}

          {canReadAudit ? (
            <Button
              variant="ghost"
              onClick={() => onAudit(item)}
              icon={<Eye className="h-3 w-3" />}
              iconPosition="left"
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              Audit
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export const OtEntryRow = React.memo(OtEntryRowComponent);
