/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import toast from "react-hot-toast";
import { Download, RefreshCw, FileText, Eye, EyeOff } from "lucide-react";
import { api } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

type Log = {
  empId: string;
  date: string;
  time: string;
  type?: "IN" | "OUT";
};

type ApiResponse = {
  logs: Log[];
  csv: string;
};

export default function LogsUploaderPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [showType, setShowType] = useState(true); // ✅ toggle for type column

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const t = toast.loading("Processing fingerprint logs...");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const r = await api.post<ApiResponse>("/fingerprint/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!r.data.logs || r.data.logs.length === 0) {
        toast.error("Invalid file or empty log file.", { id: t });
        return;
      }

      setLogs(r.data.logs);
      setCsv(r.data.csv);

      toast.success("Logs processed successfully.", { id: t });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to process file.", {
        id: t,
      });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  function downloadCSV() {
    if (!csv) return;

    let csvToExport = csv;

    if (!showType) {
      // remove the Type column
      const lines = csv.split("\n");
      csvToExport = lines
        .map((line) => line.split(",").slice(0, 3).join(",")) // only EmpID, Date, Time
        .join("\n");
    }

    const blob = new Blob([csvToExport], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "fingerprint_logs.csv";
    a.click();

    URL.revokeObjectURL(url);
    toast.success("CSV downloaded.");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Fingerprint Logs
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            Upload raw TXT logs from fingerprint machines and export clean CSV.
          </div>
        </div>

        {/* Toggle Type Column */}
        <Button
          variant="ghost"
          icon={
            showType ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )
          }
          onClick={() => setShowType((v) => !v)}
        >
          {showType ? "Hide Type" : "Show Type"}
        </Button>
      </div>

      {/* Upload Card */}
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1">
            <Input
              type="file"
              accept=".txt"
              label="Upload TXT File"
              onChange={handleFileUpload}
            />
          </div>

          <Button
            disabled={!csv || loading}
            onClick={downloadCSV}
            icon={<Download className="h-4 w-4" />}
            iconPosition="left"
            className="border border-green-600 bg-green-500 text-white hover:bg-green-600"
          >
            Download CSV
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white/80 p-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Processing logs...
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && logs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200/50 px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white/80">
            <div className="flex items-center gap-2 font-black text-gray-900">
              <FileText className="h-5 w-5 text-gray-600" />
              Processed Logs
            </div>
            <div className="text-xs text-gray-600">{logs.length} record(s)</div>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200/50 bg-gray-50">
                <tr className="text-left">
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-gray-700">
                    Emp ID
                  </th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-gray-700">
                    Date
                  </th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-gray-700">
                    Time
                  </th>
                  {showType && (
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-gray-700">
                      Type
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-all">
                    <td className="px-5 py-3 font-mono">{l.empId}</td>
                    <td className="px-5 py-3">{l.date}</td>
                    <td className="px-5 py-3">{l.time}</td>
                    {showType && (
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            l.type === "OUT"
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {l.type ?? "-"}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
