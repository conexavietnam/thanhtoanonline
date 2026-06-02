import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminReferralAPI, csvExportAPI } from "../../lib/api.js";

const ReferralManagementPage = () => {
  const [referrals, setReferrals] = useState([]);
  const [selectedRef, setSelectedRef] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [commissionForm, setCommissionForm] = useState({ percentage: "", amount: "" });

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const { data } = await adminReferralAPI.getAll(params);
      setReferrals(data);
    } catch (err) {
      setError("Không thể tải danh sách referrals");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await adminReferralAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error("Không thể tải stats", err);
    }
  };

  useEffect(() => {
    loadReferrals();
    loadStats();
  }, [filterStatus]);

  const handleViewDetail = async (ref) => {
    try {
      const { data } = await adminReferralAPI.getById(ref.id);
      setSelectedRef(data);
      setCommissionForm({
        percentage: data.commissionPercentage || "",
        amount: data.commissionAmount || "",
      });
      setMessage(null);
      setError(null);
    } catch (err) {
      setError("Không thể tải chi tiết referral");
    }
  };

  const handleUpdateStatus = async (refId, newStatus) => {
    if (!confirm(`Đổi trạng thái sang ${newStatus}?`)) return;
    setSaving(true);
    try {
      await adminReferralAPI.updateStatus(refId, newStatus);
      setMessage("Cập nhật trạng thái thành công");
      await loadReferrals();
      await loadStats();
      if (selectedRef?.id === refId) {
        const { data } = await adminReferralAPI.getById(refId);
        setSelectedRef(data);
      }
    } catch (err) {
      setError("Cập nhật trạng thái thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCommission = async () => {
    if (!selectedRef) return;
    setSaving(true);
    try {
      const payload = {
        commissionPercentage: commissionForm.percentage ? Number(commissionForm.percentage) : null,
        commissionAmount: commissionForm.amount ? Number(commissionForm.amount) : null,
      };
      await adminReferralAPI.updateCommission(selectedRef.id, payload);
      setMessage("Cập nhật hoa hồng thành công");
      await loadReferrals();
      const { data } = await adminReferralAPI.getById(selectedRef.id);
      setSelectedRef(data);
      setCommissionForm({
        percentage: data.commissionPercentage || "",
        amount: data.commissionAmount || "",
      });
    } catch (err) {
      setError("Cập nhật hoa hồng thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedRef) return;
    if (!confirm("Đánh dấu đã thanh toán?")) return;
    setSaving(true);
    try {
      await adminReferralAPI.markAsPaid(selectedRef.id);
      setMessage("Đánh dấu đã thanh toán thành công");
      await loadReferrals();
      await loadStats();
      const { data } = await adminReferralAPI.getById(selectedRef.id);
      setSelectedRef(data);
    } catch (err) {
      setError(err.response?.data?.message || "Đánh dấu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' VND';
  };

  const handleExport = async () => {
    try {
      const params = { page: 0, size: 10000 };
      const response = await csvExportAPI.exportReferrals(params);
      
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `referrals_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError("Không thể export CSV");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Quản lý Referrals</h2>
          <p className="text-sm text-base-content/60">Quản lý hoa hồng và thanh toán cho cộng tác viên</p>
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

      {stats && (
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
          <div className="stat">
            <div className="stat-title">Tổng Referrals</div>
            <div className="stat-value text-primary">{stats.totalReferrals}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Pending</div>
            <div className="stat-value text-warning">{stats.pendingCount}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Qualified</div>
            <div className="stat-value text-info">{stats.qualifiedCount}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Paid</div>
            <div className="stat-value text-success">{stats.paidCount}</div>
          </div>
        </div>
      )}

      {stats && (
        <div className="stats shadow w-full">
          <div className="stat">
            <div className="stat-title">Hoa hồng chờ thanh toán</div>
            <div className="stat-value text-warning">{formatMoney(stats.totalPendingCommission)}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Hoa hồng đã thanh toán</div>
            <div className="stat-value text-success">{formatMoney(stats.totalPaidCommission)}</div>
          </div>
        </div>
      )}

      {message && (
        <div className="alert alert-success">
          <span>{message}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      <div className="flex gap-2">
        <select
          className="select select-bordered select-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Pending</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <section className="space-y-3">
          <h3 className="font-semibold text-base-content">Danh sách Referrals ({referrals.length})</h3>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <span className="loading loading-spinner text-primary" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {referrals.map((ref) => (
                <article
                  key={ref.id}
                  className={`rounded-xl border p-4 cursor-pointer transition hover:border-primary/50 hover:shadow-md ${
                    selectedRef?.id === ref.id ? "border-primary bg-primary/5" : "border-base-200"
                  }`}
                  onClick={() => handleViewDetail(ref)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base-content truncate">{ref.referrerEmail}</h4>
                      <p className="text-sm text-base-content/70 truncate">→ {ref.referredUserEmail || "Chưa có"}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={`badge badge-sm ${
                          ref.status === 'PAID' ? 'badge-success' :
                          ref.status === 'QUALIFIED' ? 'badge-info' :
                          ref.status === 'CANCELLED' ? 'badge-error' : 'badge-ghost'
                        }`}>
                          {ref.status}
                        </span>
                        <span className="badge badge-sm badge-outline font-mono">
                          {ref.referralCode}
                        </span>
                      </div>
                      {ref.commissionAmount && (
                        <p className="text-xs text-success font-semibold mt-1">
                          {formatMoney(ref.commissionAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-base-200 bg-base-100 p-6">
          {selectedRef ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-base-content">Chi tiết Referral</h3>
                <p className="text-xs text-base-content/60">ID: {selectedRef.id}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-base-content/70">Referrer</label>
                  <p className="mt-1 text-base-content">{selectedRef.referrerFullName}</p>
                  <p className="text-sm text-base-content/70">{selectedRef.referrerEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Referred User</label>
                  <p className="mt-1 text-base-content">{selectedRef.referredUserFullName || "—"}</p>
                  <p className="text-sm text-base-content/70">{selectedRef.referredUserEmail || "Chưa có"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Referral Code</label>
                  <p className="mt-1 text-base-content font-mono">{selectedRef.referralCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Trạng thái</label>
                  <div className="mt-1">
                    <span className={`badge ${
                      selectedRef.status === 'PAID' ? 'badge-success' :
                      selectedRef.status === 'QUALIFIED' ? 'badge-info' :
                      selectedRef.status === 'CANCELLED' ? 'badge-error' : 'badge-ghost'
                    }`}>
                      {selectedRef.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-base-content/70">Thay đổi trạng thái</label>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    className="select select-bordered select-sm"
                    value={selectedRef.status}
                    onChange={(e) => handleUpdateStatus(selectedRef.id, e.target.value)}
                    disabled={saving}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="PAID">PAID</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium text-base-content/70">Điều chỉnh hoa hồng</label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="input input-bordered input-sm flex-1"
                      placeholder="Phần trăm (%)"
                      value={commissionForm.percentage}
                      min="0"
                      max="100"
                      step="0.01"
                      onChange={(e) => setCommissionForm(prev => ({ ...prev, percentage: e.target.value }))}
                    />
                    <span className="text-sm">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="input input-bordered input-sm flex-1"
                      placeholder="Số tiền (VND)"
                      value={commissionForm.amount}
                      min="0"
                      onChange={(e) => setCommissionForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                    <span className="text-sm">VND</span>
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleUpdateCommission}
                    disabled={saving}
                  >
                    Cập nhật hoa hồng
                  </button>
                </div>
              </div>

              {selectedRef.status === 'QUALIFIED' && (
                <div className="border-t pt-4">
                  <button
                    className="btn btn-success"
                    onClick={handleMarkAsPaid}
                    disabled={saving}
                  >
                    ✓ Đánh dấu đã thanh toán
                  </button>
                </div>
              )}

              <div className="pt-4 border-t flex gap-3">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedRef(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center text-base-content/50">
              <p>Chọn một referral để xem chi tiết</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ReferralManagementPage;
