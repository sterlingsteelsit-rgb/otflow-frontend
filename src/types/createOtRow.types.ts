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

export type EmployeeOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type ShiftOption = {
  label: string;
  value: string;
};

export type Preview = {
  normalMinutes: number;
  doubleMinutes: number;
  tripleMinutes: number;
  isNight: boolean;
};

export type Props = {
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
