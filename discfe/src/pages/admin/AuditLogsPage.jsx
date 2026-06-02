import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminAuditLogAPI, csvExportAPI } from "../../lib/api.js";

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    actionType: "",
    entityType: "",
    userId: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  useEffect(() => {
    loadLogs();
  }, [page, pageSize, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let response;
      const params = {
        page,
        size: pageSize,
      };

      if (filters.userId && filters.startDate && filters.endDate) {
        response = await adminAuditLogAPI.getByUserAndDateRange(
          filters.userId,
          filters.startDate,
          filters.endDate,
          params
        );
      } else if (filters.startDate && filters.endDate) {
        response = await adminAuditLogAPI.getByDateRange(
          filters.startDate,
          filters.endDate,
          params
        );
      } else if (filters.userId) {
        response = await adminAuditLogAPI.getByUser(filters.userId, params);
      } else if (filters.actionType) {
        response = await adminAuditLogAPI.getByActionType(filters.actionType, params);
      } else if (filters.entityType) {
        response = await adminAuditLogAPI.getByEntityType(filters.entityType, params);
      } else {
        response = await adminAuditLogAPI.getAll(params);
      }

      setLogs(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setError(null);
    } catch (err) {
      setError("Không thể tải audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const params = { page: 0, size: 10000 };
      const response = await csvExportAPI.exportAuditLogs(params);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Không thể export CSV");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const actionTypeColors = {
    CREATE: "badge-success",
    UPDATE: "badge-warning",
    DELETE: "badge-error",
    VIEW: "badge-info",
    EXPORT: "badge-primary",
    LOGIN: "badge-secondary",
    LOGOUT: "badge-ghost",
  };

  const getActionTypeColor = (actionType) => {
    return actionTypeColors[actionType] || "badge-ghost";
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pb-4 border-b border-base-300">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Audit Logs</h2>
          <p className="text-sm text-base-content/60">Theo dõi mọi hoạt động trong hệ thống</p>
        </div>
        <button
          className="btn btn-primary btn-sm gap-2"
          onClick={handleExport}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </header>

      {/* Filters */}
      <section className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-6">
        <h3 className="text-lg font-bold text-base-content mb-4">🔍 Bộ lọc</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label">
              <span className="label-text font-semibold">Action Type</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={filters.actionType}
              onChange={(e) => handleFilterChange("actionType", e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="VIEW">VIEW</option>
              <option value="EXPORT">EXPORT</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">Entity Type</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="User, Payment, etc."
              value={filters.entityType}
              onChange={(e) => handleFilterChange("entityType", e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">User ID</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full font-mono text-sm"
              placeholder="UUID"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">Từ ngày</span>
            </label>
            <input
              type="datetime-local"
              className="input input-bordered w-full"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">Đến ngày</span>
            </label>
            <input
              type="datetime-local"
              className="input input-bordered w-full"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setFilters({
                actionType: "",
                entityType: "",
                userId: "",
                startDate: "",
                endDate: "",
              });
              setPage(0);
            }}
          >
            Reset
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={loadLogs}
          >
            Tìm kiếm
          </button>
        </div>
      </section>

      {/* Logs Table */}
      <section className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-base-content">
            Audit Logs ({logs.length})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/70">Hiển thị:</span>
            <select
              className="select select-bordered select-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <span className="loading loading-spinner text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            Không có audit logs nào
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Type</th>
                    <th>Entity</th>
                    <th>Mô tả</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-xs font-mono">
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        <div>
                          <div className="font-medium">{log.userName || "—"}</div>
                          <div className="text-xs text-base-content/60 font-mono">
                            {log.userEmail || "—"}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${getActionTypeColor(log.actionType)}`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-sm badge-outline">
                          {log.entityType || "—"}
                        </span>
                      </td>
                      <td className="font-mono text-xs">
                        {log.entityId || "—"}
                      </td>
                      <td className="max-w-xs truncate">
                        {log.description || log.action || "—"}
                      </td>
                      <td className="font-mono text-xs text-base-content/70">
                        {log.ipAddress || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  className="btn btn-sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Trước
                </button>
                <span className="text-sm text-base-content/70">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  className="btn btn-sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default AuditLogsPage;
