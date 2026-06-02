import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { partnerAffiliateAPI, partnerQuotaAPI } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const normalizedValue = String(value);
  if (
    normalizedValue.includes(",") ||
    normalizedValue.includes('"') ||
    normalizedValue.includes("\n")
  ) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
};

const buildCsvContent = (headers, rows) => [
  headers.join(","),
  ...rows.map((row) => row.map(escapeCsvValue).join(",")),
].join("\n");

const downloadCsvFile = (fileName, content) => {
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const PartnerDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [exportingReferrals, setExportingReferrals] = useState(false);
  const [exportingRevenue, setExportingRevenue] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/partners/dashboard");
        setStats(data);
      } finally {
        setLoading(false);
      }
    };

    const fetchQuotaInfo = async () => {
      setLoadingQuota(true);
      try {
        const { data } = await partnerQuotaAPI.getQuotaInfo();
        setQuotaInfo(data);
        // Load export history
        const { data: history } = await partnerQuotaAPI.getPaidExportHistory({ page: 0, size: 20 });
        setExportHistory(history);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Error loading quota info:", err);
        }
        // 404 means no quota package exists
      } finally {
        setLoadingQuota(false);
      }
    };

    fetchStats();
    fetchQuotaInfo();
  }, []);

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
          <p className="text-base-content/70">Không thể tải dữ liệu thống kê</p>
          <button
            className="btn btn-primary btn-sm mt-4"
            onClick={() => {
              setLoading(true);
              const fetchStats = async () => {
                try {
                  const { data } = await api.get("/partners/dashboard");
                  setStats(data);
                } finally {
                  setLoading(false);
                }
              };
              fetchStats();
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const handleExportReferrals = async () => {
    setExportingReferrals(true);
    try {
      const { data } = await partnerAffiliateAPI.getReferrals();
      const rows = Array.isArray(data)
        ? data.map((referral) => [
            referral.id,
            referral.email,
            referral.fullName,
            referral.joinedAt ? new Date(referral.joinedAt).toLocaleString("vi-VN") : "",
          ])
        : [];

      // Quốc Trí: export CSV trực tiếp từ affiliate endpoints đang chạy thay vì gọi các route CSV chưa được nối ở backend.
      const csvContent = buildCsvContent(
        ["id", "email", "fullName", "joinedAt"],
        rows
      );

      downloadCsvFile(
        `referrals_${new Date().toISOString().split("T")[0]}.csv`,
        csvContent
      );
      toast.success("Đã xuất danh sách referrals.");
    } catch (err) {
      console.error("Export referrals failed:", err);
      toast.error(err.response?.data?.message || "Xuất danh sách referrals thất bại.");
    } finally {
      setExportingReferrals(false);
    }
  };

  const handleExportRevenue = async () => {
    setExportingRevenue(true);
    try {
      const { data } = await partnerAffiliateAPI.getEarnings();
      const rows = Array.isArray(data)
        ? data.map((earning) => [
            earning.id,
            earning.orderId,
            earning.fromUserEmail,
            earning.amountVnd,
            earning.percent,
            earning.createdAt ? new Date(earning.createdAt).toLocaleString("vi-VN") : "",
            earning.note,
          ])
        : [];

      const csvContent = buildCsvContent(
        ["id", "orderId", "fromUserEmail", "amountVnd", "percent", "createdAt", "note"],
        rows
      );

      downloadCsvFile(
        `revenue_${new Date().toISOString().split("T")[0]}.csv`,
        csvContent
      );
      toast.success("Đã xuất doanh thu.");
    } catch (err) {
      console.error("Export revenue failed:", err);
      toast.error(err.response?.data?.message || "Xuất doanh thu thất bại.");
    } finally {
      setExportingRevenue(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-base-content">Dashboard Đối Tác</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline btn-primary"
            onClick={handleExportReferrals}
            disabled={exportingReferrals}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exportingReferrals ? "Đang xuất..." : "Export Referrals"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline btn-success"
            onClick={handleExportRevenue}
            disabled={exportingRevenue}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exportingRevenue ? "Đang xuất..." : "Export Doanh Thu"}
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-base-content">Link referral của bạn</h3>
        <p className="mt-2 text-sm text-base-content/70">
          Chia sẻ link độc quyền để nhận hoa hồng khi khách nâng cấp gói Cá Nhân hoặc VIP.
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <label className="label">
                <span className="label-text text-xs text-base-content/70">Referral Code</span>
              </label>
              <code className="block rounded-2xl bg-base-200/70 px-4 py-2 text-sm text-base-content font-mono">
                {stats?.referralCode || user?.referralCode || "N/A"}
              </code>
            </div>
            <div className="flex-1 min-w-0">
              <label className="label">
                <span className="label-text text-xs text-base-content/70">Referral Link</span>
              </label>
              <code className="block rounded-2xl bg-base-200/70 px-4 py-2 text-xs text-base-content break-all">
                {(() => {
                  const code = stats?.referralCode || user?.referralCode;
                  const origin = window.location.origin.replace(/\/+$/, "");
                  return `${origin}/register?ref=${code}`;
                })()}
              </code>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={`btn btn-sm btn-primary flex-1 ${copied ? 'btn-success' : ''}`}
              onClick={async () => {
                const code = stats?.referralCode || user?.referralCode;
                // Ensure origin doesn't have trailing slash and construct standard link
                const origin = window.location.origin.replace(/\/+$/, "");
                const link = `${origin}/register?ref=${code}`;
                try {
                  if (navigator?.clipboard?.writeText) {
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                    toast.success("Đã sao chép link dashboard!");
                    setTimeout(() => setCopied(false), 2000);
                  } else {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = link;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    setCopied(true);
                    toast.success("Đã sao chép link dashboard!");
                    setTimeout(() => setCopied(false), 2000);
                  }
                } catch (err) {
                  console.error('Failed to copy:', err);
                  toast.error("Sao chép thất bại!");
                }
              }}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Đã copy link
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Sao chép link
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={async () => {
                const code = stats?.referralCode || user?.referralCode;
                if (code) {
                  try {
                    if (navigator?.clipboard?.writeText) {
                      await navigator.clipboard.writeText(code);
                      toast.success("Đã copy mã giới thiệu!");
                    } else {
                      const textArea = document.createElement('textarea');
                      textArea.value = code;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      toast.success("Đã copy mã giới thiệu!");
                    }
                  } catch (err) {
                    console.error('Failed to copy:', err);
                    toast.error("Sao chép thất bại!");
                  }
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy mã
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Tổng lượt giới thiệu" value={stats?.totalReferrals ?? 0} />
        <StatCard title="Đã bán (Sales)" value={(stats?.qualifiedReferrals ?? 0) + (stats?.paidReferrals ?? 0)} />
        <StatCard title="Đã kích hoạt (Chờ trả)" value={stats?.qualifiedReferrals ?? 0} />
        <StatCard title="Đã nhận tiền" value={stats?.paidReferrals ?? 0} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-base-content/70">Tổng doanh thu</h4>
          <p className="mt-2 text-2xl font-semibold text-success">
            {new Intl.NumberFormat("vi-VN").format(stats?.totalRevenue ?? 0)} VND
          </p>
        </article>
        <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-base-content/70">Hoa hồng đang chờ duyệt</h4>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {new Intl.NumberFormat("vi-VN").format(stats?.pendingCommission ?? 0)} VND
          </p>
        </article>
        <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-base-content/70">Hoa hồng đã thanh toán</h4>
          <p className="mt-2 text-2xl font-semibold text-secondary">
            {new Intl.NumberFormat("vi-VN").format(stats?.paidCommission ?? 0)} VND
          </p>
        </article>
        <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-base-content/70">Tổng hoa hồng</h4>
          <p className="mt-2 text-2xl font-semibold text-accent">
            {new Intl.NumberFormat("vi-VN").format(stats?.totalCommission ?? 0)} VND
          </p>
        </article>
      </section>

      {stats?.monthlyStats?.monthlyCommissions && stats.monthlyStats.monthlyCommissions.length > 0 && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-base-content mb-4">Biểu đồ hoa hồng theo tháng</h3>

          {/* Bar Chart */}
          <div className="mb-6">
            <div className="flex items-end gap-2 h-64">
              {stats.monthlyStats.monthlyCommissions.map((month, idx) => {
                const maxCommission = Math.max(...stats.monthlyStats.monthlyCommissions.map(m => Number(m.commissionAmount ?? 0)));
                const height = maxCommission > 0 ? (Number(month.commissionAmount ?? 0) / maxCommission) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                      <div
                        className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all hover:from-primary-focus hover:to-primary/80 cursor-pointer"
                        style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                        title={`${month.monthLabel}: ${new Intl.NumberFormat("vi-VN").format(month.commissionAmount ?? 0)} VND`}
                      />
                    </div>
                    <div className="text-xs text-base-content/70 font-medium text-center">
                      {month.monthLabel}
                    </div>
                    <div className="text-xs text-base-content/60 text-center">
                      {new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(month.commissionAmount ?? 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed List */}
          <div className="space-y-3 border-t border-base-200 pt-4">
            {stats.monthlyStats.monthlyCommissions.map((month, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-20 text-sm text-base-content/70 font-medium">{month.monthLabel}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-base-200 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (Number(month.commissionAmount ?? 0) / Math.max(1, Number(stats?.totalCommission ?? 1))) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="w-32 text-sm font-semibold text-right">
                      {new Intl.NumberFormat("vi-VN").format(month.commissionAmount ?? 0)} VND
                    </div>
                  </div>
                  <div className="text-xs text-base-content/60 mt-1">
                    {month.referralsCount} lượt giới thiệu
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats?.recentActivity?.recentReferrals && stats.recentActivity.recentReferrals.length > 0 && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-base-content mb-4">Hoạt động gần đây</h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Email khách hàng</th>
                  <th>Trạng thái</th>
                  <th>Hoa hồng</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.recentReferrals.map((ref, idx) => (
                  <tr key={idx}>
                    <td>{ref.referredUserEmail}</td>
                    <td>
                      <span className="badge badge-outline badge-sm">{ref.status}</span>
                    </td>
                    <td>{new Intl.NumberFormat("vi-VN").format(ref.commissionAmount ?? 0)} VND</td>
                    <td>{new Date(ref.createdAt).toLocaleDateString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Detailed Revenue History Table */}
      {stats?.revenueHistory && stats.revenueHistory.length > 0 && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-base-content mb-4">Lịch sử doanh thu & hoa hồng</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Gói đã mua</th>
                  <th>Số tiền</th>
                  <th>% Hoa hồng</th>
                  <th>Hoa hồng</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {stats.revenueHistory.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-mono text-sm">{item.customerEmail}</td>
                    <td>{item.planName}</td>
                    <td className="font-semibold">
                      {new Intl.NumberFormat("vi-VN").format(item.revenueAmount ?? 0)} VND
                    </td>
                    <td>{Number(item.commissionPercentage ?? 0).toFixed(2)}%</td>
                    <td className="font-semibold text-primary">
                      {new Intl.NumberFormat("vi-VN").format(item.commissionAmount ?? 0)} VND
                    </td>
                    <td>
                      <span className={`badge badge-sm ${item.status === 'PAID' ? 'badge-success' :
                        item.status === 'APPROVED' ? 'badge-info' :
                          item.status === 'PENDING' ? 'badge-warning' :
                            'badge-error'
                        }`}>
                        {item.status === 'PAID' ? 'Đã trả' :
                          item.status === 'APPROVED' ? 'Đã duyệt' :
                            item.status === 'PENDING' ? 'Chờ duyệt' :
                              item.status}
                      </span>
                    </td>
                    <td className="text-sm text-base-content/70">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Partner Quota Info */}
      {quotaInfo && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-base-content mb-4">Kho Gói User (License)</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-base-200 bg-base-50 p-4">
              <h4 className="text-sm font-semibold text-base-content/70">Quota tổng</h4>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {quotaInfo.paidExportLimit === null ? "Không giới hạn" : quotaInfo.paidExportLimit}
              </p>
            </article>
            <article className="rounded-xl border border-base-200 bg-base-50 p-4">
              <h4 className="text-sm font-semibold text-base-content/70">Đã bán</h4>
              <p className="mt-2 text-2xl font-semibold text-warning">
                {quotaInfo.currentPaidUsage || 0}
              </p>
            </article>
            <article className="rounded-xl border border-base-200 bg-base-50 p-4">
              <h4 className="text-sm font-semibold text-base-content/70">Còn lại</h4>
              <p className="mt-2 text-2xl font-semibold text-success">
                {quotaInfo.remainingPaid === -1 ? "Không giới hạn" : quotaInfo.remainingPaid}
              </p>
            </article>
          </div>
          {quotaInfo.paidExportLimit !== null && quotaInfo.paidExportLimit > 0 && (
            <div className="mt-4">
              <div className="w-full bg-base-200 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((quotaInfo.currentPaidUsage || 0) / quotaInfo.paidExportLimit) * 100)}%`
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-base-content/60 text-center">
                {Math.round(((quotaInfo.currentPaidUsage || 0) / quotaInfo.paidExportLimit) * 100)}% đã bán
              </p>
            </div>
          )}
          {quotaInfo.nextResetAt && (
            <p className="mt-2 text-xs text-base-content/60 text-center">
              Reset tiếp theo: {new Date(quotaInfo.nextResetAt).toLocaleDateString("vi-VN")}
            </p>
          )}
        </section>
      )}

      {/* Export History */}
      {quotaInfo && exportHistory.length > 0 && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-base-content mb-4">Lịch sử bán gói</h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người nhận</th>
                  <th>Email</th>
                  <th>Test Session ID</th>
                </tr>
              </thead>
              <tbody>
                {exportHistory.map((exportItem) => (
                  <tr key={exportItem.id}>
                    <td className="text-xs">
                      {new Date(exportItem.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td>{exportItem.recipientName || "—"}</td>
                    <td className="text-xs">{exportItem.recipientEmail || "—"}</td>
                    <td className="text-xs font-mono">
                      {exportItem.testSessionId ? exportItem.testSessionId.substring(0, 8) + "..." : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* PDF Export Stats */}
      {stats?.pdfExportStats && (
        <section className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-base-content mb-4">Thống kê xuất PDF</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-base-200 bg-base-50 p-4">
              <h4 className="text-sm font-semibold text-base-content/70">Tổng lượt xuất PDF</h4>
              <p className="mt-2 text-2xl font-semibold text-base-content">
                {stats.pdfExportStats.totalExports ?? 0}
              </p>
              <div className="mt-2 text-xs text-base-content/60">
                <span>Miễn phí: {stats.pdfExportStats.freeExports ?? 0}</span>
                <span className="mx-2">•</span>
                <span>Trả phí: {stats.pdfExportStats.paidExports ?? 0}</span>
              </div>
            </article>
            <article className="rounded-xl border border-base-200 bg-base-50 p-4">
              <h4 className="text-sm font-semibold text-base-content/70">Giới hạn PDF trả phí</h4>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {stats.pdfExportStats.planPdfExportLimit === null
                  ? "Không giới hạn"
                  : stats.pdfExportStats.planPdfExportLimit === 0
                    ? "Tắt"
                    : stats.pdfExportStats.planPdfExportLimit}
              </p>
              {stats.pdfExportStats.planPdfExportLimit !== null &&
                stats.pdfExportStats.planPdfExportLimit > 0 && (
                  <p className="mt-1 text-xs text-base-content/60">
                    Còn lại: {stats.pdfExportStats.remainingExports >= 0
                      ? stats.pdfExportStats.remainingExports
                      : "Không giới hạn"}
                  </p>
                )}
            </article>
            <article className="rounded-xl border border-base-200 bg-base-50 p-4">
              <h4 className="text-sm font-semibold text-base-content/70">Giới hạn PDF miễn phí</h4>
              <p className="mt-2 text-2xl font-semibold text-secondary">
                {stats.pdfExportStats.planFreePdfExportLimit === null
                  ? "Không giới hạn"
                  : stats.pdfExportStats.planFreePdfExportLimit === 0
                    ? "Tắt"
                    : stats.pdfExportStats.planFreePdfExportLimit}
              </p>
              {stats.pdfExportStats.planFreePdfExportLimit !== null &&
                stats.pdfExportStats.planFreePdfExportLimit > 0 && (
                  <p className="mt-1 text-xs text-base-content/60">
                    Còn lại: {stats.pdfExportStats.remainingFreeExports >= 0
                      ? stats.pdfExportStats.remainingFreeExports
                      : "Không giới hạn"}
                  </p>
                )}
            </article>
            <article className="rounded-xl border border-base-200 bg-base-50 p-4">
              <h4 className="text-sm font-semibold text-base-content/70">Đã xuất (Trả phí)</h4>
              <p className="mt-2 text-2xl font-semibold text-accent">
                {stats.pdfExportStats.paidExports ?? 0}
              </p>
              {stats.pdfExportStats.planPdfExportLimit !== null &&
                stats.pdfExportStats.planPdfExportLimit > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-base-200 rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((stats.pdfExportStats.paidExports ?? 0) / stats.pdfExportStats.planPdfExportLimit) * 100)}%`
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-base-content/60">
                      {Math.round(((stats.pdfExportStats.paidExports ?? 0) / stats.pdfExportStats.planPdfExportLimit) * 100)}% đã sử dụng
                    </p>
                  </div>
                )}
            </article>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-base-content mb-4">Thống kê tháng này</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-base-content/70">Hoa hồng tháng này:</span>
              <span className="font-semibold text-primary">
                {new Intl.NumberFormat("vi-VN").format(stats?.recentActivity?.thisMonthCommission ?? 0)} VND
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-base-content/70">Hoa hồng tháng trước:</span>
              <span className="font-semibold text-base-content/70">
                {new Intl.NumberFormat("vi-VN").format(stats?.recentActivity?.lastMonthCommission ?? 0)} VND
              </span>
            </div>
            {stats?.recentActivity?.thisMonthCommission > 0 && stats?.recentActivity?.lastMonthCommission > 0 && (
              <div className="flex justify-between pt-2 border-t border-base-200">
                <span className="text-sm text-base-content/70">Tăng trưởng:</span>
                <span className={`font-semibold ${stats.recentActivity.thisMonthCommission >= stats.recentActivity.lastMonthCommission
                  ? 'text-success' : 'text-error'
                  }`}>
                  {((stats.recentActivity.thisMonthCommission / stats.recentActivity.lastMonthCommission - 1) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </article>
        <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-base-content mb-4">Gợi ý tăng hoa hồng</h3>
          <ul className="space-y-2 text-sm text-base-content/70">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Gửi khách hàng bản preview 70% và nhắc họ nâng cấp trong 24h đầu tiên.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Sử dụng tài liệu bán hàng dành cho cộng tác viên trong thư viện Admin.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Chạy mini workshop giới thiệu DISC để thu hút khách mới.</span>
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <article className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow-sm">
    <h4 className="text-sm font-semibold text-base-content/70">{title}</h4>
    <p className="mt-2 text-2xl font-semibold text-base-content">{value}</p>
  </article>
);

export default PartnerDashboardPage;
