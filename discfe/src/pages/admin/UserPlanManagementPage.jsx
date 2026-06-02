import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api.js";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const initialForm = {
  id: null,
  planType: "USER_PLAN",
  code: "FREE",
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
  freePdfExportLimit: null,
  partnerId: null,
  preventPlanChange: false,
};

const billingCycleOptions = [
  { value: "ONE_TIME", label: "Một lần" },
  { value: "MONTHLY", label: "Hàng tháng" },
  { value: "QUARTERLY", label: "Hàng quý" },
  { value: "YEARLY", label: "Hàng năm" },
];

// Tính năng dành riêng cho gói User
const commonFeatures = [
  "Làm bài test DISC",
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

// Tùy chọn tính năng dành riêng cho gói User
const commonFeatureOptions = [
  { key: "export_pdf", label: "Xuất PDF", default: "enabled" },
  { key: "export_excel", label: "Xuất Excel", default: "enabled" },
  { key: "advanced_analytics", label: "Phân tích nâng cao", default: "enabled" },
  { key: "insights", label: "Phân tích điểm mạnh/yếu", default: "enabled" },
  { key: "priority_support", label: "Hỗ trợ ưu tiên", default: "enabled" },
  { key: "unlimited_tests", label: "Test không giới hạn", default: "enabled" },
  { key: "career_recommendations", label: "Gợi ý nghề nghiệp", default: "enabled" },
  { key: "development_plan", label: "Lộ trình phát triển", default: "enabled" },
  { key: "expert_consultation", label: "Tư vấn chuyên gia", default: "disabled" },
  { key: "video_tutorials", label: "Video hướng dẫn", default: "enabled" },
  { key: "progress_tracking", label: "Theo dõi tiến độ", default: "enabled" },
];

const normalizePdfReportType = (value) => {
  if (!value) return value;
  const upper = value.toString().trim().toUpperCase();
  if (upper === "PAID_PDF") return "PAID_PDF";
  return "PAID_PDF";
};

const UserPlanManagementPage = () => {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [customFeatures, setCustomFeatures] = useState("");
  const [featureOptions, setFeatureOptions] = useState({});

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    billingCycle: "",
    active: "",
    highlighted: "",
    priceMin: "",
    priceMax: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadPlans = async () => {
    setLoading(true);

    try {
      const { data } = await api.get("/admin/plans", { params: { planType: "USER_PLAN" } });
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading plans:", err);
      // Clean error handling
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if (status === 401) toast.error("Phiên đăng nhập đã hết hạn.");
      else if (status === 403) toast.error("Bạn không có quyền truy cập.");
      else toast.error(`Lỗi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const getDefaultFeatureOptions = () => {
    const defaultOptions = {};
    commonFeatureOptions.forEach((opt) => {
      defaultOptions[opt.key] = opt.default;
    });
    defaultOptions.pdf_report_type = "PAID_PDF";
    return defaultOptions;
  };

  const resetForm = () => {
    const defaultOptions = getDefaultFeatureOptions();
    const optionsArray = Object.entries(defaultOptions)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    setForm({ ...initialForm, featureOptions: optionsArray });
    setSelectedFeatures(new Set());
    setCustomFeatures("");
    setFeatureOptions(defaultOptions);
    setFeatureOptions(defaultOptions);
    setIsModalOpen(false);
  };

  const parseFreePdfExportLimit = (options) => {
    if (!options) return null;
    const optionsArray = Array.isArray(options) ? options : Array.from(options || []);
    for (const opt of optionsArray) {
      if (typeof opt === 'string' && opt.startsWith("free_pdf_export_limit=")) {
        const value = opt.split("=")[1];
        if (value === "" || value === "null" || value === null) return null;
        const numValue = parseInt(value, 10);
        return isNaN(numValue) ? null : numValue;
      }
    }
    return null;
  };

  useEffect(() => {
    const defaultOptions = getDefaultFeatureOptions();
    if (Object.keys(featureOptions).length === 0) {
      setFeatureOptions(defaultOptions);
      const optionsArray = Object.entries(defaultOptions)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
      setForm((prev) => ({ ...prev, featureOptions: optionsArray }));
    }
  }, []);

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
    options.pdf_report_type = "PAID_PDF";

    Array.from(plan.featureOptions ?? []).forEach((option) => {
      const [key, value] = option.split("=");
      if (key && value) {
        const normalizedValue = key.trim() === "pdf_report_type"
          ? normalizePdfReportType(value)
          : value.trim();
        options[key.trim()] = normalizedValue;
      }
    });
    setFeatureOptions(options);

    const optionsArray = Object.entries(options)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const freeLimit = parseFreePdfExportLimit(plan.featureOptions);

    setForm({
      id: plan.id,
      planType: "USER_PLAN",
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
      freePdfExportLimit: freeLimit,
      partnerId: plan.partnerId ?? null,
      preventPlanChange: plan.preventPlanChange ?? false,
    });
    setIsModalOpen(true);
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
        .map((f) => {
          const trimmed = f.trim();
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return trimmed;
          }
          return trimmed;
        })
        .filter(Boolean),
    ];
    setForm((prev) => ({ ...prev, features: allFeatures.join("\n") }));
  };

  const handleFeatureOptionChange = (key, value) => {
    let newOptions = { ...featureOptions, [key]: value };

    // Auto-enable PDF export when report type is changed
    if (key === 'pdf_report_type') {
      newOptions = { ...newOptions, export_pdf: 'enabled' };
    }

    setFeatureOptions(newOptions);
    const optionsArray = Object.entries(newOptions)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    setForm((prev) => ({ ...prev, featureOptions: optionsArray }));
  };

  const payload = useMemo(
    () => {
      const options = form.featureOptions
        .split("\n")
        .map((option) => option.trim())
        .filter(Boolean);

      let filteredOptions = options.filter(opt => !opt.startsWith("free_pdf_export_limit="));
      if (form.freePdfExportLimit !== null && form.freePdfExportLimit !== "") {
        filteredOptions.push(`free_pdf_export_limit=${form.freePdfExportLimit}`);
      }

      return {
        planType: "USER_PLAN",
        code: form.code,
        name: form.name,
        price: Number(form.price),
        currency: form.currency,
        billingCycle: form.billingCycle,
        description: form.description,
        features: form.features
          .split("\n")
          .map((feature) => {
            const trimmed = feature.trim();
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return trimmed;
            return trimmed;
          })
          .filter(Boolean),
        featureOptions: filteredOptions,
        active: form.active,
        highlighted: form.highlighted,
        pdfExportLimit: form.pdfExportLimit === "" || form.pdfExportLimit === null
          ? null
          : Number(form.pdfExportLimit),
        partnerId: form.partnerId || null,
        preventPlanChange: form.preventPlanChange,
      };
    },
    [form]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (form.id) {
        await api.put(`/admin/plans/${form.id}`, payload);
        toast.success("Cập nhật gói thành công");
      } else {
        await api.post("/admin/plans", payload);
        toast.success("Tạo gói mới thành công");
      }
      await loadPlans();
      resetForm();
    } catch (err) {
      toast.error("Lưu gói thất bại. Vui lòng kiểm tra dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn chắc chắn muốn xoá gói này?")) return;
    try {
      await api.delete(`/admin/plans/${id}`);
      await loadPlans();
      if (form.id === id) {
        resetForm();
      }
      toast.success("Xoá gói thành công");
    } catch (err) {
      let msg = err.response?.data?.message || err.message || "Xoá gói thất bại";
      if (msg.includes("Cannot delete plan with existing subscriptions")) {
        msg = "Vui lòng hủy kích hoạt gói do gói này đã có người mua";
      }
      toast.error(msg);
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          plan.name.toLowerCase().includes(searchLower) ||
          (plan.description && plan.description.toLowerCase().includes(searchLower)) ||
          plan.code.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.billingCycle && plan.billingCycle !== filters.billingCycle) {
        return false;
      }

      if (filters.active !== "") {
        const isActive = filters.active === "true";
        if (plan.active !== isActive) return false;
      }

      if (filters.highlighted !== "") {
        const isHighlighted = filters.highlighted === "true";
        if (plan.highlighted !== isHighlighted) return false;
      }

      if (filters.priceMin && plan.price < Number(filters.priceMin)) {
        return false;
      }
      if (filters.priceMax && plan.price > Number(filters.priceMax)) {
        return false;
      }

      return true;
    });
  }, [plans, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      billingCycle: "",
      active: "",
      highlighted: "",
      priceMin: "",
      priceMax: "",
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => value !== "");
  }, [filters]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gói dịch vụ User
          </h2>
          <p className="text-base-content/60 mt-2">
            Quản lý các gói đăng ký và quyền lợi cho người dùng cá nhân
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="btn btn-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Tạo gói mới
        </button>
      </div>


      {/* Messages replaced by toast */}


      {/* Filter Bar - Collapsible */}
      <div className="collapse collapse-arrow bg-base-100/50 border border-base-200 rounded-xl shadow-sm">
        <input type="checkbox" checked={showFilters} onChange={() => setShowFilters(!showFilters)} />
        <div className="collapse-title text-base font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Bộ lọc tìm kiếm
          {hasActiveFilters && <span className="badge badge-primary badge-sm ml-2">Active</span>}
        </div>
        <div className="collapse-content">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-base-200">
            <div className="form-control">
              <span className="label-text text-xs font-semibold uppercase text-base-content/50 mb-1">Tìm kiếm</span>
              <input
                type="text"
                placeholder="Tên, mã gói..."
                className="input input-bordered input-sm"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div className="form-control">
              <span className="label-text text-xs font-semibold uppercase text-base-content/50 mb-1">Chu kỳ</span>
              <select
                className="select select-bordered select-sm"
                value={filters.billingCycle}
                onChange={(e) => handleFilterChange("billingCycle", e.target.value)}
              >
                <option value="">Tất cả</option>
                {billingCycleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <span className="label-text text-xs font-semibold uppercase text-base-content/50 mb-1">Trạng thái</span>
              <select
                className="select select-bordered select-sm"
                value={filters.active}
                onChange={(e) => handleFilterChange("active", e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã ẩn</option>
              </select>
            </div>
            <div className="form-control flex self-end">
              <button onClick={resetFilters} className="btn btn-sm btn-ghost w-full">Xóa bộ lọc</button>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
          <svg className="h-24 w-24 text-base-content/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-bold">Không tìm thấy gói nào</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const billingCycleLabel = billingCycleOptions.find(opt => opt.value === plan.billingCycle)?.label || plan.billingCycle;
            return (
              <article
                key={plan.id}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl bg-base-100 flex flex-col ${plan.highlighted ? "border-primary/50 ring-1 ring-primary/20 shadow-primary/10" : "border-base-200 hover:border-primary/30"
                  } ${!plan.active && "opacity-70 grayscale-[0.5]"}`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary text-primary-content text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                      Popular
                    </div>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=${plan.name}&background=random&color=fff&size=64`}
                      alt={plan.name}
                      className="w-12 h-12 rounded-xl shadow-md"
                    />
                    <div className={`badge ${plan.active ? 'badge-success badge-outline' : 'badge-ghost'}`}>
                      {plan.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-base-content mb-1">{plan.name}</h3>
                  <div className="text-sm font-mono text-base-content/50 mb-4">{plan.code}</div>

                  <div className="text-3xl font-bold text-primary mb-1">
                    {new Intl.NumberFormat("vi-VN").format(plan.price)} <span className="text-sm font-normal text-base-content/60">{plan.currency}</span>
                  </div>
                  <div className="text-sm text-base-content/60 mb-6">/ {billingCycleLabel}</div>

                  <div className="divider my-0"></div>

                  <ul className="flex-1 py-4 space-y-2">
                    <li className="flex items-center gap-2 text-sm text-base-content/80">
                      <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.features?.length || 0} features included
                    </li>
                    {(plan.pdfExportLimit !== null) && (
                      <li className="flex items-center gap-2 text-sm text-base-content/80">
                        <svg className="w-4 h-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF Credits: <strong>{plan.pdfExportLimit ? `+${plan.pdfExportLimit}` : "0"}</strong>
                      </li>
                    )}
                  </ul>

                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleEdit(plan)} className="btn btn-primary btn-sm flex-1">Edit Plan</button>
                    <button onClick={() => handleDelete(plan.id)} className="btn btn-ghost btn-sm btn-square text-error">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-base-200 bg-base-100/50 backdrop-blur sticky top-0 z-10">
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {form.id ? "Chỉnh sửa gói" : "Tạo gói gói dịch vụ"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-base-50">
              <form id="planForm" onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Basic Info */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-5">
                    <h4 className="card-title text-base mb-4 flex items-center gap-2 text-primary">
                      <span className="w-2 h-6 bg-primary rounded-full"></span>
                      Thông tin cơ bản
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column: Essential Info */}
                      <div className="space-y-4">
                        <div className="form-control">
                          <label className="label text-xs font-bold uppercase text-base-content/50">Mã gói</label>
                          <input className="input input-bordered" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                        </div>
                        <div className="form-control">
                          <label className="label text-xs font-bold uppercase text-base-content/50">Tên gói</label>
                          <input className="input input-bordered" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                      </div>

                      {/* Right Column: Description */}
                      <div className="space-y-4">
                        <div className="form-control h-full">
                          <label className="label text-xs font-bold uppercase text-base-content/50">Mô tả</label>
                          <textarea className="textarea textarea-bordered h-full min-h-[120px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>
                      </div>

                      {/* Full Width: Status Toggles */}
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        <div className="form-control">
                          <label className="cursor-pointer label justify-between border rounded-xl p-4 hover:bg-base-100 transition-colors bg-base-50/50">
                            <span className="label-text font-medium flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${form.active ? 'bg-success' : 'bg-base-300'}`}></span>
                              Kích hoạt gói
                            </span>
                            <input type="checkbox" className="toggle toggle-success" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                          </label>
                        </div>
                        <div className="form-control">
                          <label className="cursor-pointer label justify-between border rounded-xl p-4 hover:bg-base-100 transition-colors bg-base-50/50">
                            <span className="label-text font-medium flex items-center gap-2">
                              <span className="text-warning">★</span>
                              Đánh dấu nổi bật (Popular)
                            </span>
                            <input type="checkbox" className="checkbox checkbox-warning" checked={form.highlighted} onChange={e => setForm({ ...form, highlighted: e.target.checked })} />
                          </label>
                        </div>
                        <div className="form-control">
                          <label className="cursor-pointer label justify-between border rounded-xl p-4 hover:bg-base-100 transition-colors bg-base-50/50">
                            <span className="label-text font-medium flex items-center gap-2">
                              <span className="text-error">⛔</span>
                              Chặn chuyển đổi gói
                            </span>
                            <input type="checkbox" className="toggle toggle-error" checked={form.preventPlanChange} onChange={e => setForm({ ...form, preventPlanChange: e.target.checked })} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Pricing */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-5">
                    <h4 className="card-title text-base mb-4 flex items-center gap-2 text-primary">
                      <span className="w-2 h-6 bg-secondary rounded-full"></span>
                      Giá & Chu kỳ thanh toán
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Giá tiền</label>
                        <input type="number" className="input input-bordered" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                      </div>
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Đơn vị tiền tệ</label>
                        <select className="select select-bordered" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                          <option value="VND">VND</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Chu kỳ</label>
                        <select className="select select-bordered" value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })}>
                          {billingCycleOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Features */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-5">
                    <h4 className="card-title text-base mb-4 flex items-center gap-2 text-primary">
                      <span className="w-2 h-6 bg-accent rounded-full"></span>
                      Tính năng & Quyền lợi
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h5 className="font-bold text-sm mb-3">Tính năng chung</h5>
                        <div className="flex flex-wrap gap-2">
                          {commonFeatures.map(feature => (
                            <button
                              key={feature}
                              type="button"
                              onClick={() => handleFeatureToggle(feature)}
                              className={`btn btn-sm ${selectedFeatures.has(feature) ? 'btn-primary' : 'btn-outline border-base-300 text-base-content/60'} normal-case`}
                            >
                              {feature}
                            </button>
                          ))}
                        </div>

                        <div className="form-control mt-4">
                          <label className="label text-xs font-bold uppercase text-base-content/50">Tính năng tùy chỉnh (mỗi dòng 1 tính năng)</label>
                          <textarea
                            className="textarea textarea-bordered h-32"
                            value={customFeatures}
                            onChange={e => handleCustomFeaturesChange(e.target.value)}
                            placeholder="- Tính năng A&#10;- Tính năng B"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* System Controls Group */}
                        <div className="card bg-base-50 border border-info/20 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-info"></div>
                          <div className="card-body p-4 gap-4">
                            <h5 className="font-bold text-sm text-info flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                              </svg>
                              Cấu hình hệ thống (Functional)
                            </h5>



                            <div className="grid grid-cols-1 gap-3">
                              <div className="form-control">
                                <label className="label text-xs font-bold uppercase text-base-content/50 pb-1">Loại báo cáo PDF</label>
                              <select
                                className="select select-bordered select-sm w-full"
                                value={normalizePdfReportType(featureOptions['pdf_report_type']) || 'PAID_PDF'}
                                onChange={(e) => handleFeatureOptionChange('pdf_report_type', e.target.value)}
                              >
                                <option value="PAID_PDF">💎 PDF Trả phí (Template)</option>
                              </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="form-control">
                                  <label className="label text-xs font-bold uppercase text-base-content/50 pb-1">Số Credit PDF (Tặng kèm)</label>
                                  <input
                                    type="number"
                                    className="input input-bordered input-sm w-full"
                                    value={form.pdfExportLimit === null ? "" : form.pdfExportLimit}
                                    onChange={e => setForm({ ...form, pdfExportLimit: e.target.value })}
                                    placeholder="0"
                                  />
                                  <label className="label pt-1"><span className="label-text-alt text-xs text-base-content/50">Cộng vào tài khoản khi mua. 0 = Không tặng.</span></label>
                                </div>
                                <div className="form-control">
                                  <label className="label text-xs font-bold uppercase text-base-content/50 pb-1">Limit PDF (Free)</label>
                                  <input
                                    type="number"
                                    className="input input-bordered input-sm w-full"
                                    value={form.freePdfExportLimit === null ? "" : form.freePdfExportLimit}
                                    onChange={e => setForm({ ...form, freePdfExportLimit: e.target.value })}
                                    placeholder="0"
                                  />
                                  <label className="label pt-1"><span className="label-text-alt text-xs text-base-content/50">Khi hết Credit. -1 = Vô hạn.</span></label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Display Benefits Group */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-bold text-sm">Quyền lợi hiển thị</h5>
                            <div className="tooltip" data-tip="Các mục này sẽ hiển thị 'Có/Không' trên bảng giá để so sánh giữa các gói.">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                          </div>

                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {commonFeatureOptions
                              .filter(opt => opt.key !== 'export_pdf') // Exclude system functional options
                              .map(option => (
                                <label key={option.key} className="cursor-pointer flex items-center justify-between p-2 hover:bg-base-100 rounded-lg transition-colors border border-base-200/50">
                                  <span className="text-sm font-medium text-base-content/70">{option.label}</span>
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-primary"
                                    checked={featureOptions[option.key] === 'enabled'}
                                    onChange={(e) => handleFeatureOptionChange(option.key, e.target.checked ? 'enabled' : 'disabled')}
                                  />
                                </label>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-base-200 bg-base-50/50 flex justify-end gap-3 sticky bottom-0">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Huỷ bỏ
              </button>
              <button
                type="submit"
                form="planForm"
                className="btn btn-primary px-8"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Đang lưu...
                  </>
                ) : (
                  "Lưu Gói"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserPlanManagementPage;
