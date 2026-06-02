import { useEffect, useState } from "react";
import api, { partnerDiscountAPI } from "../../lib/api.js";
import toast from "react-hot-toast";

const statusLabels = {
  PENDING: "Chờ nâng cấp",
  QUALIFIED: "Đã kích hoạt",
  PAID: "Đã thanh toán",
  CANCELLED: "Huỷ",
};

const ReferralListPage = () => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    discountPercentage: 10,
    discountAmount: null,
    minAmount: 300000,
    maxDiscountAmount: 50000,
    validDays: 30,
    usageLimit: 1,
    description: "",
  });

  const loadReferrals = async (status) => {
    setLoading(true);
    try {
      const endpoint = status && status !== "ALL" ? `/partners/referrals?status=${status}` : "/partners/referrals";
      const { data } = await api.get(endpoint);
      setReferrals(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals(statusFilter === "ALL" ? undefined : statusFilter);
  }, [statusFilter]);

  const handleGenerateDiscount = async (referral) => {
    setSelectedReferral(referral);
    setShowDiscountModal(true);
    setDiscountForm({
      discountPercentage: 10,
      discountAmount: null,
      minAmount: 300000,
      maxDiscountAmount: 50000,
      validDays: 30,
      usageLimit: 1,
      description: `Mã giảm giá cho khách hàng ${referral.referredEmail || referral.referralCode}`,
    });
  };

  const handleSubmitDiscount = async () => {
    try {
      await partnerDiscountAPI.generate({
        referralCode: selectedReferral.referralCode,
        ...discountForm,
      });
      setShowDiscountModal(false);
      toast.success("Tạo mã giảm giá thành công!");
    } catch (err) {
      toast.error("Lỗi khi tạo mã giảm giá: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-base-content">Lịch sử giới thiệu</h3>
        <select
          className="select select-bordered select-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.keys(statusLabels).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-base-content/60">
              <th>Mã</th>
              <th>Email khách hàng</th>
              <th>Trạng thái</th>
              <th>Hoa hồng (%)</th>
              <th>Hoa hồng (VND)</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center">
                  <span className="loading loading-spinner text-primary" />
                </td>
              </tr>
            ) : referrals.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm text-base-content/60">
                  Chưa có lượt giới thiệu nào.
                </td>
              </tr>
            ) : (
              referrals.map((referral) => (
                <tr key={referral.id} className="text-sm">
                  <td className="font-mono text-xs text-base-content/70">{referral.referralCode}</td>
                  <td>{referral.referredEmail ?? "Chờ khách đăng ký"}</td>
                  <td>
                    <span className="badge badge-outline">{statusLabels[referral.status] ?? referral.status}</span>
                  </td>
                  <td>{referral.commissionPercentage ?? 0}</td>
                  <td>{new Intl.NumberFormat("vi-VN").format(referral.commissionAmount ?? 0)}</td>
                  <td>{referral.createdAt ? new Date(referral.createdAt).toLocaleString("vi-VN") : ""}</td>
                  <td>
                    <button
                      className="btn btn-xs btn-outline btn-primary"
                      onClick={() => handleGenerateDiscount(referral)}
                      disabled={referral.status === "PENDING"}
                    >
                      Tạo mã giảm giá
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && selectedReferral && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Tạo mã giảm giá</h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Loại giảm giá</span>
                </label>
                <div className="flex gap-4">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="discountType"
                      className="radio radio-primary"
                      checked={discountForm.discountPercentage !== null}
                      onChange={() => setDiscountForm({ ...discountForm, discountPercentage: 10, discountAmount: null })}
                    />
                    <span className="label-text">Phần trăm (%)</span>
                  </label>
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="radio"
                      name="discountType"
                      className="radio radio-primary"
                      checked={discountForm.discountAmount !== null}
                      onChange={() => setDiscountForm({ ...discountForm, discountAmount: 50000, discountPercentage: null })}
                    />
                    <span className="label-text">Số tiền cố định (VND)</span>
                  </label>
                </div>
              </div>

              {discountForm.discountPercentage !== null ? (
                <div>
                  <label className="label">
                    <span className="label-text">Phần trăm giảm giá (%)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={discountForm.discountPercentage}
                    onChange={(e) => setDiscountForm({ ...discountForm, discountPercentage: parseFloat(e.target.value) })}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              ) : (
                <div>
                  <label className="label">
                    <span className="label-text">Số tiền giảm giá (VND)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={discountForm.discountAmount || ""}
                    onChange={(e) => setDiscountForm({ ...discountForm, discountAmount: parseFloat(e.target.value) })}
                    min="0"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Số tiền tối thiểu (VND)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={discountForm.minAmount}
                    onChange={(e) => setDiscountForm({ ...discountForm, minAmount: parseFloat(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Giảm giá tối đa (VND)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={discountForm.maxDiscountAmount}
                    onChange={(e) => setDiscountForm({ ...discountForm, maxDiscountAmount: parseFloat(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Có hiệu lực (ngày)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={discountForm.validDays}
                    onChange={(e) => setDiscountForm({ ...discountForm, validDays: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Giới hạn sử dụng</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={discountForm.usageLimit}
                    onChange={(e) => setDiscountForm({ ...discountForm, usageLimit: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Mô tả</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={discountForm.description}
                  onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowDiscountModal(false)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSubmitDiscount}>
                Tạo mã
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralListPage;
