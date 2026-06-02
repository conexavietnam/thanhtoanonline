import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { adminCommissionRuleAPI } from "../../lib/api.js";
import { adminUserAPI, adminPartnerAPI } from "../../lib/api.js";
import api from "../../lib/api.js";

const ruleTypeLabels = {
  FIXED_PERCENTAGE: "Phần trăm cố định",
  TIERED: "Theo cấp độ",
  FIXED_AMOUNT: "Số tiền cố định",
  CUSTOM: "Tùy chỉnh",
};

const planCodes = ["FREE", "PERSONAL", "VIP"]; // Common plan codes

const CommissionRuleManagementPage = () => {
  const [rules, setRules] = useState([]);
  const [partners, setPartners] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPartner, setFilterPartner] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    ruleType: "FIXED_PERCENTAGE",
    commissionPercentage: "",
    commissionAmount: "",
    minAmount: "",
    maxAmount: "",
    planCodes: [],
    partnerId: null,
    priority: 0,
    active: true,
    validFrom: "",
    validUntil: "",
    tierConfig: "",
  });

  useEffect(() => {
    loadRules();
    loadPartners();
    loadPlans();
  }, []);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const { data } = await adminCommissionRuleAPI.getAll();
      setRules(data);
      setError(null);
    } catch (err) {
      console.error("Error loading rules:", err);
      setError("Không thể tải danh sách quy tắc hoa hồng");
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async () => {
    try {
      const { data } = await adminUserAPI.getAll({ role: "PARTNER" });
      setPartners(data);
    } catch (err) {
      console.error("Error loading partners:", err);
    }
  };

  const loadPlans = async () => {
    try {
      const { data } = await api.get("/admin/plans");
      setPlans(data);
    } catch (err) {
      console.error("Error loading plans:", err);
    }
  };

  const filteredRules = useMemo(() => {
    let filtered = rules;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rule) =>
          rule.name?.toLowerCase().includes(query) ||
          rule.description?.toLowerCase().includes(query) ||
          rule.partnerEmail?.toLowerCase().includes(query)
      );
    }

    if (filterPartner) {
      filtered = filtered.filter((rule) => rule.partnerId === filterPartner);
    }

    if (filterActive !== "") {
      filtered = filtered.filter((rule) => rule.active === (filterActive === "true"));
    }

    return filtered;
  }, [rules, searchQuery, filterPartner, filterActive]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        ruleType: form.ruleType,
        commissionPercentage: form.commissionPercentage ? parseFloat(form.commissionPercentage) : null,
        commissionAmount: form.commissionAmount ? parseFloat(form.commissionAmount) : null,
        minAmount: form.minAmount ? parseFloat(form.minAmount) : null,
        maxAmount: form.maxAmount ? parseFloat(form.maxAmount) : null,
        planCodes: form.planCodes.length > 0 ? form.planCodes : null,
        partnerId: form.partnerId || null,
        priority: parseInt(form.priority) || 0,
        active: form.active !== false,
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
        tierConfig: form.tierConfig || null,
      };

      if (editingRule) {
        await adminCommissionRuleAPI.update(editingRule.id, payload);
        setMessage("Cập nhật quy tắc thành công!");
      } else {
        await adminCommissionRuleAPI.create(payload);
        setMessage("Tạo quy tắc thành công!");
      }

      setShowForm(false);
      setEditingRule(null);
      resetForm();
      await loadRules();
    } catch (err) {
      console.error("Error saving rule:", err);
      setError(err.response?.data?.message || "Lỗi khi lưu quy tắc hoa hồng");
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name || "",
      description: rule.description || "",
      ruleType: rule.ruleType || "FIXED_PERCENTAGE",
      commissionPercentage: rule.commissionPercentage?.toString() || "",
      commissionAmount: rule.commissionAmount?.toString() || "",
      minAmount: rule.minAmount?.toString() || "",
      maxAmount: rule.maxAmount?.toString() || "",
      planCodes: rule.planCodes || [],
      partnerId: rule.partnerId || null,
      priority: rule.priority?.toString() || "0",
      active: rule.active !== false,
      validFrom: rule.validFrom ? new Date(rule.validFrom).toISOString().slice(0, 16) : "",
      validUntil: rule.validUntil ? new Date(rule.validUntil).toISOString().slice(0, 16) : "",
      tierConfig: rule.tierConfig || "",
    });
    setShowForm(true);
    setMessage(null);
    setError(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa quy tắc này?")) return;
    setError(null);
    try {
      await adminCommissionRuleAPI.delete(id);
      setMessage("Xóa quy tắc thành công!");
      await loadRules();
    } catch (err) {
      console.error("Error deleting rule:", err);
      setError("Lỗi khi xóa quy tắc");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      ruleType: "FIXED_PERCENTAGE",
      commissionPercentage: "",
      commissionAmount: "",
      minAmount: "",
      maxAmount: "",
      planCodes: [],
      partnerId: null,
      priority: 0,
      active: true,
      validFrom: "",
      validUntil: "",
      tierConfig: "",
    });
  };

  const togglePlanCode = (code) => {
    setForm((prev) => {
      const newCodes = prev.planCodes.includes(code)
        ? prev.planCodes.filter((c) => c !== code)
        : [...prev.planCodes, code];
      return { ...prev, planCodes: newCodes };
    });
  };

  const getPartnerName = (partnerId) => {
    if (!partnerId) return "Chung";
    const partner = partners.find((p) => p.id === partnerId);
    return partner ? `${partner.fullName} (${partner.email})` : "N/A";
  };

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Quản lý quy tắc hoa hồng</h2>
          <p className="text-sm text-base-content/60 mt-1">
            Quản lý các quy tắc tính hoa hồng cho đối tác ({rules.length} quy tắc)
          </p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={() => {
            resetForm();
            setEditingRule(null);
            setShowForm(true);
            setMessage(null);
            setError(null);
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm quy tắc mới
        </button>
      </div>

      {message && (
        <div className="alert alert-success">
          <span>{message}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Tìm kiếm</span>
            </label>
            <input
              type="text"
              placeholder="Tên, mô tả, email đối tác..."
              className="input input-bordered w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Lọc theo đối tác</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={filterPartner}
              onChange={(e) => setFilterPartner(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="null">Quy tắc chung</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Trạng thái</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="true">Hoạt động</option>
              <option value="false">Tắt</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              {editingRule ? "Chỉnh sửa quy tắc" : "Thêm quy tắc mới"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Tên quy tắc *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Loại quy tắc *</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={form.ruleType}
                    onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
                    required
                  >
                    {Object.entries(ruleTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Mô tả</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả về quy tắc hoa hồng này..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Đối tác</span>
                    <span className="label-text-alt">(để trống = quy tắc chung)</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={form.partnerId || ""}
                    onChange={(e) => setForm({ ...form, partnerId: e.target.value || null })}
                  >
                    <option value="">Quy tắc chung (áp dụng cho tất cả)</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} - {p.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Độ ưu tiên</span>
                    <span className="label-text-alt">(số càng cao, ưu tiên càng cao)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Áp dụng cho gói</span>
                  <span className="label-text-alt">(để trống = tất cả gói)</span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-base-200 rounded-lg">
                  {plans.map((plan) => (
                    <label key={plan.id} className="label cursor-pointer gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={form.planCodes.includes(plan.code)}
                        onChange={() => togglePlanCode(plan.code)}
                      />
                      <span className="label-text text-sm">{plan.name} ({plan.code})</span>
                    </label>
                  ))}
                  {plans.length === 0 && (
                    <div className="text-sm text-base-content/60">
                      {planCodes.map((code) => (
                        <label key={code} className="label cursor-pointer gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={form.planCodes.includes(code)}
                            onChange={() => togglePlanCode(code)}
                          />
                          <span className="label-text text-sm">{code}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Hoa hồng (%)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="input input-bordered w-full"
                    value={form.commissionPercentage}
                    onChange={(e) => setForm({ ...form, commissionPercentage: e.target.value })}
                    placeholder="Ví dụ: 10.5"
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Hoa hồng (VND)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input input-bordered w-full"
                    value={form.commissionAmount}
                    onChange={(e) => setForm({ ...form, commissionAmount: e.target.value })}
                    placeholder="Ví dụ: 50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Số tiền tối thiểu (VND)</span>
                    <span className="label-text-alt">(đơn hàng phải đạt mức này)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input input-bordered w-full"
                    value={form.minAmount}
                    onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Hoa hồng tối đa (VND)</span>
                    <span className="label-text-alt">(giới hạn trên cho hoa hồng)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input input-bordered w-full"
                    value={form.maxAmount}
                    onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Có hiệu lực từ</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered w-full"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Có hiệu lực đến</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered w-full"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  />
                </div>
              </div>

              {form.ruleType === "TIERED" && (
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Cấu hình theo cấp độ (JSON)</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full font-mono text-xs"
                    rows={4}
                    value={form.tierConfig}
                    onChange={(e) => setForm({ ...form, tierConfig: e.target.value })}
                    placeholder='{"tiers": [{"min": 0, "max": 1000000, "percentage": 5}, {"min": 1000000, "percentage": 10}]}'
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                <span className="label-text font-semibold">Kích hoạt quy tắc này</span>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRule(null);
                    resetForm();
                    setMessage(null);
                    setError(null);
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRule ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-base-100 rounded-xl shadow-lg border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Tên quy tắc</th>
                <th>Loại</th>
                <th>Đối tác</th>
                <th>Gói áp dụng</th>
                <th>Hoa hồng</th>
                <th>Điều kiện</th>
                <th>Ưu tiên</th>
                <th>Hiệu lực</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-base-content/60">
                    {searchQuery || filterPartner || filterActive
                      ? "Không tìm thấy quy tắc nào phù hợp"
                      : "Chưa có quy tắc nào. Hãy tạo quy tắc đầu tiên!"}
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <div className="font-semibold">{rule.name}</div>
                      {rule.description && (
                        <div className="text-xs text-base-content/70 mt-1 line-clamp-2">
                          {rule.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-outline badge-sm">
                        {ruleTypeLabels[rule.ruleType] || rule.ruleType}
                      </span>
                    </td>
                    <td>
                      {rule.partnerId ? (
                        <div className="text-sm">
                          <div className="font-medium">{getPartnerName(rule.partnerId)}</div>
                        </div>
                      ) : (
                        <span className="badge badge-info badge-sm">Chung</span>
                      )}
                    </td>
                    <td>
                      {rule.planCodes && rule.planCodes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rule.planCodes.map((code) => (
                            <span key={code} className="badge badge-outline badge-xs">
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-base-content/60">Tất cả</span>
                      )}
                    </td>
                    <td>
                      <div className="text-sm">
                        {rule.commissionPercentage && (
                          <div className="font-semibold text-primary">
                            {rule.commissionPercentage}%
                          </div>
                        )}
                        {rule.commissionAmount && (
                          <div className="text-base-content/70">
                            {new Intl.NumberFormat("vi-VN").format(rule.commissionAmount)} VND
                          </div>
                        )}
                        {rule.maxAmount && (
                          <div className="text-xs text-base-content/60">
                            Tối đa: {new Intl.NumberFormat("vi-VN").format(rule.maxAmount)} VND
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs">
                        {rule.minAmount && (
                          <div>Tối thiểu: {new Intl.NumberFormat("vi-VN").format(rule.minAmount)} VND</div>
                        )}
                        {!rule.minAmount && <div className="text-base-content/60">Không giới hạn</div>}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary badge-sm">{rule.priority}</span>
                    </td>
                    <td>
                      <div className="text-xs">
                        {rule.validFrom && (
                          <div>Từ: {new Date(rule.validFrom).toLocaleDateString("vi-VN")}</div>
                        )}
                        {rule.validUntil && (
                          <div>Đến: {new Date(rule.validUntil).toLocaleDateString("vi-VN")}</div>
                        )}
                        {!rule.validFrom && !rule.validUntil && (
                          <div className="text-base-content/60">Vô thời hạn</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${rule.active ? "badge-success" : "badge-error"}`}>
                        {rule.active ? "Hoạt động" : "Tắt"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-outline btn-primary"
                          onClick={() => handleEdit(rule)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-sm btn-error"
                          onClick={() => handleDelete(rule.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommissionRuleManagementPage;

