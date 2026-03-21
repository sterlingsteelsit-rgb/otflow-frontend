import React from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  CircleSlash,
  BarChart3,
} from "lucide-react";
import { Button } from "../components/ui/Button";

type DayStats = {
  date: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hours: { normal: number; double: number; triple: number };
};

type DayStatus = "full" | "pending" | "empty";

type Props = {
  date: Date;
  dateKey: string;
  isSelected: boolean;
  stat?: DayStats;
  status: DayStatus;
  canReadStats: boolean;
  onPick: (date: Date) => void;
  onOpenStats: (dateKey: string) => void;
};

function WeekDayCardComponent({
  date,
  dateKey,
  isSelected,
  stat,
  status,
  canReadStats,
  onPick,
  onOpenStats,
}: Props) {
  const badge =
    status === "full" ? "Complete" : status === "pending" ? "Pending" : "Empty";

  const borderClass =
    status === "full"
      ? "border-2 border-green-500"
      : status === "pending"
        ? "border-2 border-yellow-500"
        : "border-2 border-red-500";

  return (
    <div
      className={[
        "rounded-xl border p-4 transition-all duration-200",
        isSelected
          ? "bg-gradient-to-br from-brand-blue/10 to-blue-100/30 shadow-sm"
          : "bg-white/80 backdrop-blur-sm hover:shadow-sm",
        borderClass,
      ].join(" ")}
    >
      <button className="w-full text-left" onClick={() => onPick(date)}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">
            {date.toLocaleDateString(undefined, { weekday: "short" })}
          </div>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>

        <div className="mt-2 text-2xl font-black text-gray-900">
          {date.getDate()}
        </div>

        {canReadStats ? (
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Total:</span>
              <span className="font-black text-gray-900">
                {stat?.total ?? 0}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              <div className="text-center rounded bg-blue-50 px-1.5 py-0.5">
                <div className="text-[10px] text-blue-700">P</div>
                <div className="font-bold text-blue-800">
                  {stat?.pending ?? 0}
                </div>
              </div>

              <div className="text-center rounded bg-green-50 px-1.5 py-0.5">
                <div className="text-[10px] text-green-700">A</div>
                <div className="font-bold text-green-800">
                  {stat?.approved ?? 0}
                </div>
              </div>

              <div className="text-center rounded bg-red-50 px-1.5 py-0.5">
                <div className="text-[10px] text-red-700">R</div>
                <div className="font-bold text-red-800">
                  {stat?.rejected ?? 0}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-xs text-gray-500">
            Stats (No permission)
          </div>
        )}
      </button>

      {canReadStats ? (
        <div className="mt-3 flex justify-between items-center gap-2">
          <div className="px-2 py-1 text-xs text-gray-700 font-black">
            {badge === "Complete" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : badge === "Pending" ? (
              <Clock className="h-4 w-4 text-yellow-500" />
            ) : (
              <CircleSlash className="h-4 w-4 text-red-500" />
            )}
          </div>

          <Button
            variant="ghost"
            className="px-2 py-1 text-xs text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            onClick={() => onOpenStats(dateKey)}
            title="Day stats"
          >
            <BarChart3 className="h-3 w-3" />
            Info
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export const WeekDayCard = React.memo(WeekDayCardComponent);
