import React from "react";
import {
  RefreshCw,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PieChart,
  Target,
  Calendar,
  Users,
  Zap,
} from "lucide-react";
import { Modal } from "../ui/Modal";

type DayStats = {
  date: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hours: { normal: number; double: number; triple: number };
};

interface StatsModalProps {
  stats: DayStats | null;
  statsOpen: boolean;
  setStatsOpen: (open: boolean) => void;
  statsLoading: boolean;
}

export default function StatsModal({
  stats,
  statsOpen,
  setStatsOpen,
  statsLoading,
}: StatsModalProps) {
  return (
    <Modal
      open={statsOpen}
      title={
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-brand-blue" />
          <div>
            <div className="text-lg font-black text-gray-900">
              OT Statistics
            </div>
            <div className="text-sm text-gray-600">
              {stats?.date
                ? new Date(stats.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </div>
          </div>
        </div>
      }
      onClose={() => setStatsOpen(false)}
      size="lg"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {statsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-blue mb-3" />
            <div className="text-sm text-gray-600">Loading statistics...</div>
          </div>
        ) : stats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Total
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {stats.total}
                </div>
                <div className="text-xs text-blue-600 mt-1">OT Entries</div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Pending
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {stats.pending}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Awaiting Review
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-green-100/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-green-100">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                    Approved
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {stats.approved}
                </div>
                <div className="text-xs text-green-600 mt-1">Verified</div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-red-50 to-red-100/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-red-100">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                    Rejected
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {stats.rejected}
                </div>
                <div className="text-xs text-red-600 mt-1">Declined</div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-brand-blue" />
                <div className="font-black text-gray-900">
                  Status Distribution
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Pending
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.total > 0
                        ? Math.round((stats.pending / stats.total) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                  <div className="font-black text-gray-900">
                    {stats.pending}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Approved
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.total > 0
                        ? Math.round((stats.approved / stats.total) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                  <div className="font-black text-gray-900">
                    {stats.approved}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Rejected
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.total > 0
                        ? Math.round((stats.rejected / stats.total) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                  <div className="font-black text-gray-900">
                    {stats.rejected}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Hours Summary */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-brand-blue" />
                <div className="font-black text-gray-900">Hours Summary</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-blue-100">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-sm font-semibold text-blue-700">
                      Normal Hours
                    </div>
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats.hours.normal.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Regular OT</div>
                </div>

                <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-green-100">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-sm font-semibold text-green-700">
                      Double Hours
                    </div>
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats.hours.double.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">2x Rate</div>
                </div>

                <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-orange-100">
                      <Users className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="text-sm font-semibold text-orange-700">
                      Triple Hours
                    </div>
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats.hours.triple.toFixed(2)}
                  </div>
                  <div className="text-xs text-orange-600 mt-1">3x Rate</div>
                </div>
              </div>

              {/* Total Hours */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <div className="text-sm font-semibold text-gray-700">
                      Total Hours
                    </div>
                  </div>
                  <div className="text-xl font-black text-gray-900">
                    {(
                      stats.hours.normal +
                      stats.hours.double +
                      stats.hours.triple
                    ).toFixed(2)}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Combined total of all overtime hours
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white/80 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-brand-blue" />
                <div className="font-black text-gray-900">Quick Stats</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Approval Rate
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.total > 0
                        ? Math.round((stats.approved / stats.total) * 100)
                        : 0}
                      % approved
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Rejection Rate
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.total > 0
                        ? Math.round((stats.rejected / stats.total) * 100)
                        : 0}
                      % rejected
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Double Hours
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.hours.double.toFixed(2)} hours
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Triple Hours
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.hours.triple.toFixed(2)} hours
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-3" />
            <div className="text-sm text-gray-500">No statistics available</div>
            <div className="text-xs text-gray-400 mt-1">
              Try selecting a different date
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
