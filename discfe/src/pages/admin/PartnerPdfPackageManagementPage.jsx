import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminPartnerPdfPackageAPI, adminPartnerAPI } from "../../lib/api.js";

const PartnerPdfPackageManagementPage = () => {
  const [packages, setPackages] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [form, setForm] = useState({
    paidExportLimit: null,
    freeExportLimit: null,
    allowFreeExports: false,
    resetPeriod: "MANUAL",
    notes: "",
    active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [packagesRes, partnersRes] = await Promise.all([
        adminPartnerPdfPackageAPI.getAll(),
        adminPartnerAPI.getAll(),
      ]);
      setPackages(packagesRes.data || []);
      setPartners(partnersRes.data || []);
    } catch (err) {
      setError("Không thể tải dữ liệu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg) => {
    setSelectedPartner(pkg.partnerId);
    setForm({
      paidExportLimit: pkg.paidExportLimit,
      freeExportLimit: pkg.freeExportLimit,
      allowFreeExports: pkg.allowFreeExports,
      resetPeriod: pkg.resetPeriod || "MANUAL",
      notes: pkg.notes || "",
      active: pkg.active,
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedPartner(null);
    setForm({
      paidExportLimit: null,
      freeExportLimit: null,
      allowFreeExports: false,
      resetPeriod: "MANUAL",
      notes: "",
      active: true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPartner) {
      setError("Vui lòng chọn Partner");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await adminPartnerPdfPackageAPI.createOrUpdate(selectedPartner, form);
      setMessage("Lưu thành công!");
      setShowForm(false);
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (packageId) => {
    if (!confirm("Bạn có chắc muốn reset số lượt xuất PDF?")) return;

    try {
      await adminPartnerPdfPackageAPI.resetUsage(packageId);
      setMessage("Reset thành công!");
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể reset");
    }
  };

  const handleAddUsage = async (packageId) => {
    const paidAmount = prompt("Nhập số lượt PDF trả phí muốn cộng thêm (0 nếu không):", "0");
    const freeAmount = prompt("Nhập số lượt PDF miễn phí muốn cộng thêm (0 nếu không):", "0");

    if (paidAmount === null || freeAmount === null) return;

    try {
      await adminPartnerPdfPackageAPI.addUsage(packageId, parseInt(paidAmount) || 0, parseInt(freeAmount) || 0);
      setMessage("Cộng thêm thành công!");
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cộng thêm");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Quản lý Gói PDF cho Partner</h2>
          <p className="text-sm text-base-content/60">
            Gán và quản lý gói PDF xuất cho từng Partner
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo gói PDF
        </button>
      </header>

      {message && (
        <div className="alert alert-success">
          <span>{message}</span>
        </div>
      )}

      {/* Packages List */}
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Mã giới thiệu</th>
              <th>Gói User (License)</th>
              <th>PDF miễn phí</th>
              <th>Cho phép free</th>
              <th>Đã dùng (Sales/Free)</th>
              <th>Còn lại (Sales/Free)</th>
              <th>Reset period</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-8 text-base-content/60">
                  Chưa có gói PDF nào
                </td>
              </tr>
            ) : (
              packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td>
                    <div>
                      <div className="font-semibold">{pkg.partnerName}</div>
                      {pkg.companyName && (
                        <div className="text-xs text-base-content/60">{pkg.companyName}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <code className="text-xs bg-base-200 px-2 py-1 rounded">{pkg.referralCode}</code>
                  </td>
                  <td>
                    {pkg.paidExportLimit === null
                      ? "Không giới hạn"
                      : pkg.paidExportLimit === 0
                        ? "Tắt"
                        : pkg.paidExportLimit}
                  </td>
                  <td>
                    {pkg.freeExportLimit === null
                      ? "Không giới hạn"
                      : pkg.freeExportLimit === 0
                        ? "Tắt"
                        : pkg.freeExportLimit}
                  </td>
                  <td>
                    {pkg.allowFreeExports ? (
                      <span className="badge badge-success">Có</span>
                    ) : (
                      <span className="badge badge-error">Không</span>
                    )}
                  </td>
                  <td>
                    <div className="text-sm">
                      <span className={pkg.currentPaidUsage > 0 ? "text-warning" : ""}>
                        {pkg.currentPaidUsage}
                      </span>
                      {" / "}
                      <span className={pkg.currentFreeUsage > 0 ? "text-info" : ""}>
                        {pkg.currentFreeUsage}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <span className={pkg.remainingPaid === -1 ? "text-success" : pkg.remainingPaid === 0 ? "text-error" : ""}>
                        {pkg.remainingPaid === -1 ? "∞" : pkg.remainingPaid}
                      </span>
                      {" / "}
                      <span className={pkg.remainingFree === -1 ? "text-success" : pkg.remainingFree === 0 ? "text-error" : ""}>
                        {pkg.remainingFree === -1 ? "∞" : pkg.remainingFree}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-outline badge-sm">
                      {pkg.resetPeriod || "MANUAL"}
                    </span>
                    {pkg.nextResetAt && (
                      <div className="text-xs text-base-content/60 mt-1">
                        {formatDate(pkg.nextResetAt)}
                      </div>
                    )}
                  </td>
                  <td>
                    {pkg.active ? (
                      <span className="badge badge-success">Hoạt động</span>
                    ) : (
                      <span className="badge badge-error">Tắt</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => handleEdit(pkg)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn btn-xs btn-warning"
                        onClick={() => handleReset(pkg.id)}
                      >
                        Reset
                      </button>
                      <button
                        className="btn btn-xs btn-info"
                        onClick={() => handleAddUsage(pkg.id)}
                      >
                        + Thêm
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {selectedPartner ? "Chỉnh sửa" : "Tạo mới"} Gói PDF
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Partner</span>
                </label>
                <select
                  className="select select-bordered"
                  value={selectedPartner || ""}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  required
                  disabled={!!selectedPartner}
                >
                  <option value="">Chọn Partner</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.userFullName} {partner.companyName ? `(${partner.companyName})` : ""} - {partner.referralCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Giới hạn bán gói User</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    placeholder="Để trống = không giới hạn, 0 = tắt, >0 = số lượng"
                    value={form.paidExportLimit ?? ""}
                    min="0"
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseInt(e.target.value);
                      setForm((prev) => ({ ...prev, paidExportLimit: value }));
                    }}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Để trống = Không giới hạn • 0 = Tắt • &gt;0 = Số lượng License
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Giới hạn PDF miễn phí</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    placeholder="Để trống = không giới hạn, 0 = tắt, >0 = số lượng"
                    value={form.freeExportLimit ?? ""}
                    min="0"
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseInt(e.target.value);
                      setForm((prev) => ({ ...prev, freeExportLimit: value }));
                    }}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Số lượt PDF miễn phí cho khách hàng
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text font-medium">Cho phép xuất PDF miễn phí</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={form.allowFreeExports}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, allowFreeExports: e.target.checked }))
                    }
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Chu kỳ reset</span>
                </label>
                <select
                  className="select select-bordered"
                  value={form.resetPeriod}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, resetPeriod: e.target.value }))
                  }
                >
                  <option value="MANUAL">Thủ công</option>
                  <option value="MONTHLY">Hàng tháng</option>
                  <option value="QUARTERLY">Hàng quý</option>
                  <option value="YEARLY">Hàng năm</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Ghi chú</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="Ghi chú về gói PDF này..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text font-medium">Hoạt động</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={form.active}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, active: e.target.checked }))
                    }
                  />
                </label>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="loading loading-spinner" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu"
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowForm(false)} />
        </div>
      )}
    </div>
  );
};

export default PartnerPdfPackageManagementPage;


