import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { partnerPlanAPI } from "../../lib/api.js";

const initialForm = {
  id: null,
  code: "",
  name: "",
  price: 0,
  currency: "VND",
  billingCycle: "ONE_TIME",
  description: "",
  features: "",
  featureOptions: "",
  active: true,
  highlighted: false,
  pdfExportLimit: null,
};

const billingCycleOptions = [
  { value: "ONE_TIME", label: "Một lần" },
  { value: "MONTHLY", label: "Hàng tháng" },
  { value: "QUARTERLY", label: "Hàng quý" },
  { value: "YEARLY", label: "Hàng năm" },
];

const commonFeatures = [
  "Xem kết quả đầy đủ",
  "Báo cáo PDF",
  "Xuất báo cáo Excel",
  "Gợi ý nghề nghiệp",
  "Lộ trình phát triển",
  "Phân tích điểm mạnh/yếu",
  "Hỗ trợ 24/7",
  "Tư vấn chuyên gia",
  "Video hướng dẫn",
  "Tài liệu luyện tập",
  "Bài test không giới hạn",
  "So sánh kết quả theo thời gian",
  "Chia sẻ báo cáo",
  "Nhận thông báo cập nhật",
];

const commonFeatureOptions = [
  { key: "export_pdf", label: "Xuất PDF", default: "enabled" },
  { key: "export_excel", label: "Xuất Excel", default: "enabled" },
  { key: "advanced_analytics", label: "Phân tích nâng cao", default: "enabled" },
  { key: "priority_support", label: "Hỗ trợ ưu tiên", default: "enabled" },
  { key: "unlimited_tests", label: "Test không giới hạn", default: "enabled" },
  { key: "career_recommendations", label: "Gợi ý nghề nghiệp", default: "enabled" },
  { key: "development_plan", label: "Lộ trình phát triển", default: "enabled" },
  { key: "expert_consultation", label: "Tư vấn chuyên gia", default: "disabled" },
  { key: "video_tutorials", label: "Video hướng dẫn", default: "enabled" },
  { key: "progress_tracking", label: "Theo dõi tiến độ", default: "enabled" },
];

const PartnerPlanManagementPage = () => {
  const [plans, setPlans] = useState([]);
  const [globalPlans, setGlobalPlans] = useState([]);
  const [activeTab, setActiveTab] = useState("my-plans"); // "my-plans" | "global-plans"
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [customFeatures, setCustomFeatures] = useState("");
  const [featureOptions, setFeatureOptions] = useState({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (message) {
      toast.success(message);
      setMessage(null);
    }
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [message, error]);

  useEffect(() => {
    loadPlans();
    const defaultOptions = {};
    commonFeatureOptions.forEach((opt) => {
      defaultOptions[opt.key] = opt.default;
    });
    setFeatureOptions(defaultOptions);
  }, []);

  useEffect(() => {
    if (activeTab === "global-plans" && globalPlans.length === 0) {
      loadGlobalPlans();
    }
  }, [activeTab]);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await partnerPlanAPI.getAll();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Không thể tải danh sách gói");
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalPlans = async () => {
    setLoadingGlobal(true);
    try {
      const { data } = await partnerPlanAPI.getGlobal();
      setGlobalPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading global plans:", err);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setSelectedFeatures(new Set());
    setCustomFeatures("");
    const defaultOptions = {};
    commonFeatureOptions.forEach((opt) => {
      defaultOptions[opt.key] = opt.default;
    });
    setFeatureOptions(defaultOptions);
    setMessage(null);
    setError(null);
    setShowForm(false);
  };

  const handleEdit = (plan) => {
    const planFeatures = Array.from(plan.features ?? []);
    const selected = new Set();
    const custom = [];

    planFeatures.forEach((feature) => {
      if (commonFeatures.includes(feature)) {
        selected.add(feature);
      } else {
        custom.push(feature);
      }
    });

    setSelectedFeatures(selected);
    setCustomFeatures(custom.join("\n"));

    const options = {};
    commonFeatureOptions.forEach((opt) => {
      options[opt.key] = opt.default;
    });

    Array.from(plan.featureOptions ?? []).forEach((option) => {
      const [key, value] = option.split("=");
      if (key && value) {
        options[key.trim()] = value.trim();
      }
    });
    setFeatureOptions(options);

    const optionsArray = Object.entries(options)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    setForm({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      description: plan.description ?? "",
      features: planFeatures.join("\n"),
      featureOptions: optionsArray,
      active: plan.active,
      highlighted: plan.highlighted,
      pdfExportLimit: plan.pdfExportLimit ?? null,
    });
    setShowForm(true);
    setMessage(null);
    setError(null);
  };

  const handleFeatureToggle = (feature) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(feature)) {
      newSelected.delete(feature);
    } else {
      newSelected.add(feature);
    }
    setSelectedFeatures(newSelected);
    updateFeaturesFromSelection(newSelected, customFeatures);
  };

  const handleCustomFeaturesChange = (value) => {
    setCustomFeatures(value);
    updateFeaturesFromSelection(selectedFeatures, value);
  };

  const updateFeaturesFromSelection = (selected, custom) => {
    const allFeatures = [
      ...Array.from(selected),
      ...custom
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    ];
    setForm((prev) => ({ ...prev, features: allFeatures.join("\n") }));
  };

  const handleFeatureOptionChange = (key, value) => {
    const newOptions = { ...featureOptions, [key]: value };
    setFeatureOptions(newOptions);
    const optionsArray = Object.entries(newOptions)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    setForm((prev) => ({ ...prev, featureOptions: optionsArray }));
  };

  const getFreePdfExportLimit = () => {
    if (!form.featureOptions) return null;
    const options = form.featureOptions.split("\n").map((o) => o.trim()).filter(Boolean);
    for (const option of options) {
      if (option.startsWith("free_pdf_export_limit=")) {
        const value = option.substring("free_pdf_export_limit=".length);
        if (value && value !== "null") {
          return parseInt(value);
        }
      }
    }
    return null;
  };

  const updateFreePdfExportLimit = (value) => {
    let options = form.featureOptions
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean)
      .filter((o) => !o.startsWith("free_pdf_export_limit="));

    if (value !== null && value !== "") {
      options.push(`free_pdf_export_limit=${value}`);
    }

    setForm((prev) => ({ ...prev, featureOptions: options.join("\n") }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    // Validate code format: uppercase letters, numbers, and underscores only
    const codePattern = /^[A-Z0-9_]+$/;
    if (!codePattern.test(form.code)) {
      setError("Mã gói chỉ được chứa chữ cái in hoa, số và dấu gạch dưới (ví dụ: PLAN_001, BASIC)");
      setSaving(false);
      return;
    }

    // Validate code length (common constraint: 1-50 characters)
    if (form.code.length < 1 || form.code.length > 50) {
      setError("Mã gói phải có từ 1 đến 50 ký tự");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        planType: "PARTNER_PLAN", // Required by backend validation
        code: form.code.trim().toUpperCase(),
        name: form.name,
        price: Number(form.price),
        currency: form.currency,
        billingCycle: form.billingCycle,
        description: form.description,
        features: form.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        featureOptions: form.featureOptions
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean),
        active: form.active,
        highlighted: form.highlighted,
        pdfExportLimit: form.pdfExportLimit === "" || form.pdfExportLimit === null
          ? null
          : Number(form.pdfExportLimit),
        partnerId: null, // Will be set by backend
      };

      if (form.id) {
        await partnerPlanAPI.update(form.id, payload);
        setMessage("Cập nhật gói thành công!");
      } else {
        await partnerPlanAPI.create(payload);
        setMessage("Tạo gói thành công!");
      }

      await loadPlans();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Đã xảy ra lỗi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn chắc chắn muốn xóa gói này?")) return;

    setSaving(true);
    try {
      await partnerPlanAPI.delete(id);
      setMessage("Xóa gói thành công!");
      await loadPlans();
    } catch (err) {
      setError("Không thể xóa gói");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Quản lý Gói của Tôi</h2>
          <p className="text-sm text-base-content/60">Tạo và quản lý các gói subscription cho khách hàng của bạn</p>
        </div>
        <button
          className="btn btn-primary btn-sm gap-2"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo gói mới
        </button>
      </header>

      {message && (
        <div className="alert alert-success">
          <span>{message}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      {showForm && (
        <section className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-6">
          <h3 className="text-lg font-semibold text-base-content mb-4">
            {form.id ? "Chỉnh sửa gói" : "Tạo gói mới"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="form-control">
                <span className="label-text font-medium text-base-content mb-1">Mã gói *</span>
                <input
                  type="text"
                  className="input input-bordered focus:input-primary"
                  placeholder="PERSONAL, PREMIUM, PLAN_001, etc."
                  value={form.code}
                  onChange={(e) => {
                    // Only allow uppercase letters, numbers, and underscores
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                    setForm((prev) => ({ ...prev, code: value }));
                  }}
                  required
                  disabled={!!form.id}
                  maxLength={50}
                  pattern="[A-Z0-9_]+"
                />
                <span className="label-text-alt text-base-content/60 mt-1">
                  Chỉ chữ cái in hoa, số và dấu gạch dưới (tối đa 50 ký tự)
                </span>
              </label>
              <label className="form-control">
                <span className="label-text font-medium text-base-content mb-1">Tên gói *</span>
                <input
                  type="text"
                  className="input input-bordered focus:input-primary"
                  placeholder="Gói Cá Nhân"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="form-control">
                <span className="label-text font-medium text-base-content mb-1">Giá *</span>
                <input
                  type="number"
                  className="input input-bordered focus:input-primary"
                  placeholder="0"
                  value={form.price}
                  min="0"
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  required
                />
              </label>
              <label className="form-control">
                <span className="label-text font-medium text-base-content mb-1">Tiền tệ *</span>
                <input
                  className="input input-bordered focus:input-primary"
                  placeholder="VND"
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                  required
                />
              </label>
              <label className="form-control">
                <span className="label-text font-medium text-base-content mb-1">Chu kỳ *</span>
                <select
                  className="select select-bordered focus:select-primary"
                  value={form.billingCycle}
                  onChange={(e) => setForm((prev) => ({ ...prev, billingCycle: e.target.value }))}
                  required
                >
                  {billingCycleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <label className="form-control">
                <span className="label-text font-medium text-base-content mb-1">Mô tả gói</span>
                <textarea
                  className="textarea textarea-bordered focus:textarea-primary"
                  rows={3}
                  placeholder="Nhập mô tả chi tiết về gói đăng ký..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="form-control">
                <span className="label-text font-medium text-base-content mb-1">
                  Giới hạn xuất PDF trả phí (bài)
                </span>
                <input
                  type="number"
                  className="input input-bordered focus:input-primary"
                  placeholder="Để trống = không giới hạn, 0 = tắt, >0 = số lượng"
                  value={form.pdfExportLimit ?? ""}
                  min="0"
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : e.target.value;
                    setForm((prev) => ({ ...prev, pdfExportLimit: value }));
                  }}
                />
                <span className="label-text-alt text-base-content/60">
                  Để trống = Không giới hạn • 0 = Tắt xuất PDF • &gt;0 = Số bài được xuất PDF
                </span>
              </label>
              <label className="form-control">
                <span className="label-text font-medium text-base-content mb-1">
                  Giới hạn xuất PDF miễn phí (bài)
                </span>
                <input
                  type="number"
                  className="input input-bordered focus:input-primary"
                  placeholder="Để trống = không giới hạn, 0 = tắt, >0 = số lượng"
                  value={getFreePdfExportLimit() ?? ""}
                  min="0"
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : e.target.value;
                    updateFreePdfExportLimit(value);
                  }}
                />
                <span className="label-text-alt text-base-content/60">
                  Số bài PDF miễn phí cho khách hàng (thêm vào featureOptions)
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="loading loading-spinner" /> : form.id ? "Cập nhật" : "Tạo gói"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                Hủy
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed">
        <button
          className={`tab ${activeTab === "my-plans" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("my-plans")}
        >
          Gói của Tôi ({plans.length})
        </button>
        <button
          className={`tab ${activeTab === "global-plans" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("global-plans")}
        >
          Gói Hệ Thống ({globalPlans.length})
        </button>
      </div>

      {/* My Plans Tab */}
      {activeTab === "my-plans" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base-content">Danh sách Gói của Tôi ({plans.length})</h3>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <span className="loading loading-spinner text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <p>Chưa có gói nào. Hãy tạo gói đầu tiên của bạn!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const billingCycleLabel = Array.isArray(billingCycleOptions)
                  ? (billingCycleOptions.find(opt => opt?.value === plan?.billingCycle)?.label || plan?.billingCycle)
                  : plan?.billingCycle || '';
                return (
                  <article
                    key={plan.id}
                    className={`rounded-xl border p-4 transition hover:border-primary/50 hover:shadow-md ${plan.highlighted ? "border-primary bg-primary/5" : "border-base-200"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base-content">{plan.name}</h4>
                        <p className="text-xs text-base-content/70 font-mono">{plan.code}</p>
                      </div>
                      {plan.active ? (
                        <span className="badge badge-success badge-sm">Hoạt động</span>
                      ) : (
                        <span className="badge badge-error badge-sm">Tắt</span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-1 text-base-content/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-base-content">
                          {new Intl.NumberFormat("vi-VN").format(plan.price)} {plan.currency}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-base-content/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{billingCycleLabel}</span>
                      </div>
                      {plan.pdfExportLimit !== null && (
                        <div className="flex items-center gap-1 text-base-content/70">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>PDF: {plan.pdfExportLimit === 0 ? "Tắt" : plan.pdfExportLimit === -1 ? "Không giới hạn" : `${plan.pdfExportLimit} bài`}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        className="btn btn-sm btn-primary flex-1"
                        onClick={() => handleEdit(plan)}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => handleDelete(plan.id)}
                        disabled={saving}
                      >
                        Xóa
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Global Plans Tab */}
      {activeTab === "global-plans" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base-content">Gói Hệ Thống ({globalPlans.length})</h3>
            <p className="text-sm text-base-content/60">
              Các gói do hệ thống quản lý, khách hàng có thể mua trực tiếp
            </p>
          </div>

          {loadingGlobal ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <span className="loading loading-spinner text-primary" />
            </div>
          ) : globalPlans.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <p>Chưa có gói hệ thống nào.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {globalPlans.map((plan) => {
                const billingCycleLabel = Array.isArray(billingCycleOptions)
                  ? (billingCycleOptions.find(opt => opt?.value === plan?.billingCycle)?.label || plan?.billingCycle)
                  : plan?.billingCycle || '';
                return (
                  <article
                    key={plan.id}
                    className={`rounded-xl border p-4 transition hover:border-primary/50 hover:shadow-md ${plan.highlighted ? "border-primary bg-primary/5" : "border-base-200"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base-content">{plan.name}</h4>
                        <p className="text-xs text-base-content/70 font-mono">{plan.code}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {plan.active ? (
                          <span className="badge badge-success badge-sm">Hoạt động</span>
                        ) : (
                          <span className="badge badge-error badge-sm">Tắt</span>
                        )}
                        <span className="badge badge-info badge-xs">Hệ thống</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-1 text-base-content/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-base-content">
                          {new Intl.NumberFormat("vi-VN").format(plan.price)} {plan.currency}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-base-content/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{billingCycleLabel}</span>
                      </div>
                      {plan.pdfExportLimit !== null && (
                        <div className="flex items-center gap-1 text-base-content/70">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>PDF: {plan.pdfExportLimit === 0 ? "Tắt" : plan.pdfExportLimit === -1 ? "Không giới hạn" : `${plan.pdfExportLimit} bài`}</span>
                        </div>
                      )}
                      {plan.description && (
                        <p className="text-xs text-base-content/60 line-clamp-2 mt-2">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-base-200">
                      <p className="text-xs text-base-content/50 text-center">
                        Gói này do hệ thống quản lý, bạn không thể chỉnh sửa
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PartnerPlanManagementPage;

