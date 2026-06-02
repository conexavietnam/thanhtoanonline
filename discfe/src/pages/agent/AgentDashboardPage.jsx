import { useEffect, useState } from "react";
import { agentAPI } from "../../lib/api";

const AgentDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadDashboard();
    loadHistory();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await agentAPI.getDashboard();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (pageNum = 0) => {
    setHistoryLoading(true);
    try {
      const { data } = await agentAPI.getExportHistory({ page: pageNum, size: 20 });
      setHistory(data.content || []);
      setPage(data.currentPage || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="text-center">
          <p className="text-base-content/70">Không thể tải dữ liệu</p>
          <button
            className="btn btn-primary btn-sm mt-4"
            onClick={loadDashboard}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const remaining = stats.remainingPaidReports || 0;
  const used = stats.usedPaidReports || 0;
  const max = stats.maxPaidReports || 0;
  const usagePercent = max > 0 ? (used / max) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-base-content">Dashboard Đại Lý</h2>
      </div>

      {/* Stats Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-base-content/70">Tổng quota</h4>
          <p className="mt-2 text-2xl font-semibold text-base-content">
            {max}
          </p>
          <p className="mt-1 text-xs text-base-content/60">Số bài được phép xuất</p>
        </article>

        <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-base-content/70">Đã xuất</h4>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {used}
          </p>
          <p className="mt-1 text-xs text-base-content/60">Số bài đã xuất</p>
        </article>

        <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-base-content/70">Còn lại</h4>
          <p className="mt-2 text-2xl font-semibold text-success">
            {remaining}
          </p>
          <p className="mt-1 text-xs text-base-content/60">Số bài còn lại</p>
        </article>

        <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-base-content/70">Tổng xuất</h4>
          <p className="mt-2 text-2xl font-semibold text-accent">
            {stats.totalExports || 0}
          </p>
          <div className="mt-1 text-xs text-base-content/60">
            <span>Trả phí: {stats.paidExports || 0}</span>
            <span className="mx-2">•</span>
            <span>Miễn phí: {stats.freeExports || 0}</span>
          </div>
        </article>
      </section>

      {/* Usage Progress */}
      {max > 0 && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-base-content mb-4">Tiến độ sử dụng quota</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">Đã sử dụng: {used}/{max}</span>
              <span className="font-semibold">{usagePercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-base-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${usagePercent >= 90 ? 'bg-error' : usagePercent >= 70 ? 'bg-warning' : 'bg-success'
                  }`}
                style={{ width: `${Math.min(100, usagePercent)}%` }}
              />
            </div>
            {remaining === 0 && (
              <p className="text-sm text-error">⚠️ Đã hết quota. Vui lòng liên hệ Admin để gia hạn.</p>
            )}
          </div>
        </section>
      )}

      {/* Export History */}
      <section className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-base-content mb-4">Lịch sử xuất bài</h3>
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner text-primary" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-base-content/70 py-8">Chưa có lịch sử xuất bài</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Loại</th>
                    <th>Người nhận</th>
                    <th>Email</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.createdAt || '-'}</td>
                      <td>
                        <span className={`badge badge-sm ${item.reportType === 'PAID' ? 'badge-primary' :
                            item.exportType === 'VIEW' ? 'badge-info' : 'badge-secondary'
                          }`}>
                          {item.reportType === 'PAID' ? 'Trả phí' :
                            item.exportType === 'VIEW' ? 'Xem online' :
                              'Miễn phí'}
                        </span>
                      </td>
                      <td>{item.recipientName || '-'}</td>
                      <td>{item.recipientEmail || '-'}</td>
                      <td>{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  className="btn btn-sm"
                  onClick={() => loadHistory(page - 1)}
                  disabled={page === 0}
                >
                  Trước
                </button>
                <span className="self-center text-sm">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  className="btn btn-sm"
                  onClick={() => loadHistory(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title text-lg">Lưu ý</h3>
          <ul className="text-sm space-y-2 text-base-content/70">
            <li>• Mỗi lần xuất bài DISC trả phí sẽ trừ 1 lượt trong quota</li>
            <li>• Hệ thống tự động ghi log mỗi lần xuất bài</li>
            <li>• Khi hết quota, vui lòng liên hệ Admin để gia hạn</li>
            <li>• Hệ thống không quản lý giá bán, bạn tự quyết định giá khi bán ngoài</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboardPage;

