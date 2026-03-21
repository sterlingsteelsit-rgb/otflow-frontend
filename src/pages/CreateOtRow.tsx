import React, { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SelectField } from "../components/ui/SelectField";
import { calcOtMinutesUI, minsToHours } from "../utils/otCalcPreview";

type CreateRow = {
  id: string;
  employeeId: string;
  shift: string;
  inTime: string;
  outTime: string;
  reason: string;
};

type EmployeeOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type ShiftOption = {
  label: string;
  value: string;
};

type Preview = {
  normalMinutes: number;
  doubleMinutes: number;
  tripleMinutes: number;
  isNight: boolean;
};

type Props = {
  index: number;
  row: CreateRow;
  selectedDate: string;
  isTripleDay: boolean;
  employeeOptions: EmployeeOption[];
  shiftOptions: ShiftOption[];
  canRemove: boolean;
  onChangeRow: (index: number, patch: Partial<CreateRow>) => void;
  onRemoveRow: (index: number) => void;
};

function CreateOtRowComponent({
  index,
  row,
  selectedDate,
  isTripleDay,
  employeeOptions,
  shiftOptions,
  canRemove,
  onChangeRow,
  onRemoveRow,
}: Props) {
  const isNoShift = row.shift === "NO_SHIFT";

  const preview: Preview = useMemo(() => {
    if (isNoShift) {
      return {
        normalMinutes: 0,
        doubleMinutes: 0,
        tripleMinutes: 0,
        isNight: false,
      };
    }

    return calcOtMinutesUI({
      workDate: selectedDate,
      shift: row.shift,
      inTime: row.inTime,
      outTime: row.outTime,
      isTripleDay,
    });
  }, [
    isNoShift,
    row.shift,
    row.inTime,
    row.outTime,
    selectedDate,
    isTripleDay,
  ]);

  const totalMins =
    preview.normalMinutes + preview.doubleMinutes + preview.tripleMinutes;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <SelectField
            label="Employee"
            value={row.employeeId}
            onValueChange={(v) => onChangeRow(index, { employeeId: v })}
            options={employeeOptions}
          />
        </div>

        <div className="md:col-span-2">
          <SelectField
            label="Shift"
            value={row.shift}
            onValueChange={(v) => {
              if (v === "NO_SHIFT") {
                onChangeRow(index, { shift: v, inTime: "", outTime: "" });
              } else {
                onChangeRow(index, { shift: v });
              }
            }}
            options={shiftOptions}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="In Time"
            type="time"
            value={row.inTime}
            disabled={isNoShift}
            onChange={(e) => onChangeRow(index, { inTime: e.target.value })}
            className="border-gray-300"
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Out Time"
            type="time"
            value={row.outTime}
            disabled={isNoShift}
            onChange={(e) => onChangeRow(index, { outTime: e.target.value })}
            className="border-gray-300"
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Reason"
            value={row.reason || ""}
            onChange={(e) => onChangeRow(index, { reason: e.target.value })}
            className="border-gray-300"
            placeholder="Optional"
          />
        </div>

        {isNoShift ? (
          <div className="text-xs text-gray-500">No shift selected</div>
        ) : (
          <div className="md:col-span-12">
            <div className="rounded-lg border border-gray-200 bg-white/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-black text-gray-700">
                  Preview OT
                </div>

                {preview.isNight ? (
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-black text-purple-700">
                    Night
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-black text-gray-600">
                    Day
                  </span>
                )}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded bg-blue-50 p-2">
                  <div className="text-[10px] font-black text-blue-700">
                    Normal
                  </div>
                  <div className="text-sm font-black text-blue-900">
                    {minsToHours(preview.normalMinutes)}h
                  </div>
                  <div className="text-[10px] text-blue-700/80">
                    {preview.normalMinutes} min
                  </div>
                </div>

                <div className="rounded bg-green-50 p-2">
                  <div className="text-[10px] font-black text-green-700">
                    Double
                  </div>
                  <div className="text-sm font-black text-green-900">
                    {minsToHours(preview.doubleMinutes)}h
                  </div>
                  <div className="text-[10px] text-green-700/80">
                    {preview.doubleMinutes} min
                  </div>
                </div>

                <div className="rounded bg-orange-50 p-2">
                  <div className="text-[10px] font-black text-orange-700">
                    Triple
                  </div>
                  <div className="text-sm font-black text-orange-900">
                    {minsToHours(preview.tripleMinutes)}h
                  </div>
                  <div className="text-[10px] text-orange-700/80">
                    {preview.tripleMinutes} min
                  </div>
                </div>

                <div className="rounded bg-gray-50 p-2">
                  <div className="text-[10px] font-black text-gray-700">
                    Total
                  </div>
                  <div className="text-sm font-black text-gray-900">
                    {minsToHours(totalMins)}h
                  </div>
                  <div className="text-[10px] text-gray-700/80">
                    {totalMins} min
                  </div>
                </div>
              </div>

              {!row.inTime || !row.outTime ? (
                <div className="mt-2 text-[11px] text-gray-500">
                  Enter in/out time to preview OT (rounded down to 15 mins).
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className="md:col-span-12 flex justify-end gap-2">
          {canRemove ? (
            <Button
              variant="ghost"
              onClick={() => onRemoveRow(index)}
              className="text-gray-700 font-black border border-gray-300 bg-white hover:bg-gray-50"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const CreateOtRow = React.memo(CreateOtRowComponent);
