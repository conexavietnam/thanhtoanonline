import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../lib/api.js";
import { adminUserAPI, adminPartnerAPI } from "../../lib/api.js";

const initialForm = {
  id: null,
  planType: "USER_PLAN", // USER_PLAN or PARTNER_PLAN
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
  pdfExportLimit: null, // null = unlimited, 0 = disabled, >0 = limit (trả phí)
  freePdfExportLimit: null, // null = unlimited, 0 = disabled, >0 = limit (miễn phí)
  partnerId: null, // null = global plan, UUID = partner-specific plan
};

const billingCycleOptions = [
  { value: "ONE_TIME", label: "Một lần" },
  { value: "MONTHLY", label: "Hàng tháng" },
  { value: "QUARTERLY", label: "Hàng quý" },
  { value: "YEARLY", label: "Hàng năm" },
];

// Danh sách tính năng phổ biến để admin chọn
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

// Danh sách tùy chọn tính năng phổ biến
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
  { key: "pdf_report_type", label: "Loại báo cáo PDF", default: "PAID_PDF" },
];

const normalizePdfReportType = (value) => {
  if (!value) return value;
  const upper = value.toString().trim().toUpperCase();
  if (upper === "PAID_PDF") return "PAID_PDF";
  return "PAID_PDF";
};

const PlanManagementPage = () => {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [customFeatures, setCustomFeatures] = useState("");
  const [featureOptions, setFeatureOptions] = useState({});
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    planType: "", // "" = all, "USER_PLAN", "PARTNER_PLAN"
    billingCycle: "",
    active: "",
    highlighted: "",
    priceMin: "",
    priceMax: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filters.planType ? { planType: filters.planType } : {};
      const { data } = await api.get("/admin/plans", { params });
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading plans:", err);
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;

      if (status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else if (status === 403) {
        setError("Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.");
      } else if (status === 404) {
        setError("Không tìm thấy endpoint. Vui lòng kiểm tra lại cấu hình API.");
      } else if (status >= 500) {
        setError("Lỗi máy chủ. Vui lòng thử lại sau.");
      } else if (err.code === "NETWORK_ERROR" || !err.response) {
        setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
      } else {
        setError(`Không thể tải danh sách gói: ${message || "Đã xảy ra lỗi không xác định"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    loadPartners();
  }, [filters.planType]);

  const loadPartners = async () => {
    try {
      const { data } = await adminPartnerAPI.getAll();
      setPartners(data || []);
    } catch (err) {
      console.error("Error loading partners:", err);
    }
  };

  const getDefaultFeatureOptions = () => {
    const defaultOptions = {};
    commonFeatureOptions.forEach((opt) => {
      defaultOptions[opt.key] = opt.default;
    });
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
    setMessage(null);
    setError(null);
  };

  // Parse freePdfExportLimit from featureOptions
  const parseFreePdfExportLimit = (options) => {
    if (!options) return null;
    // Handle both Set and Array
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

  // Khởi tạo featureOptions khi component mount
  useEffect(() => {
    const defaultOptions = getDefaultFeatureOptions();
    if (Object.keys(featureOptions).length === 0) {
      setFeatureOptions(defaultOptions);
      const optionsArray = Object.entries(defaultOptions)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
      setForm((prev) => ({ ...prev, featureOptions: optionsArray }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Parse featureOptions - khởi tạo với giá trị mặc định trước
    const options = {};
    commonFeatureOptions.forEach((opt) => {
      options[opt.key] = opt.default;
    });

    // Sau đó override với giá trị từ plan nếu có
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

    // Cập nhật form state với featureOptions
    const optionsArray = Object.entries(options)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    // Parse freePdfExportLimit from featureOptions
    const freeLimit = parseFreePdfExportLimit(plan.featureOptions);

    setForm({
      id: plan.id,
      planType: plan.planType || "USER_PLAN",
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
    });
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

  const payload = useMemo(
    () => {
      // Build featureOptions array
      const options = form.featureOptions
        .split("\n")
        .map((option) => option.trim())
        .filter(Boolean);

      // Add freePdfExportLimit to featureOptions if set
      if (form.freePdfExportLimit !== null && form.freePdfExportLimit !== "") {
        // Remove existing free_pdf_export_limit if any
        const filteredOptions = options.filter(opt => !opt.startsWith("free_pdf_export_limit="));
        filteredOptions.push(`free_pdf_export_limit=${form.freePdfExportLimit}`);
        return {
          code: form.code,
          name: form.name,
          price: Number(form.price),
          currency: form.currency,
          billingCycle: form.billingCycle,
          description: form.description,
          features: form.features
            .split("\n")
            .map((feature) => feature.trim())
            .filter(Boolean),
          featureOptions: filteredOptions,
          active: form.active,
          highlighted: form.highlighted,
          pdfExportLimit: form.pdfExportLimit === "" || form.pdfExportLimit === null
            ? null
            : Number(form.pdfExportLimit),
          partnerId: form.partnerId || null,
        };
      } else {
        // Remove free_pdf_export_limit if not set
        const filteredOptions = options.filter(opt => !opt.startsWith("free_pdf_export_limit="));
        return {
          code: form.code,
          name: form.name,
          price: Number(form.price),
          currency: form.currency,
          billingCycle: form.billingCycle,
          description: form.description,
          features: form.features
            .split("\n")
            .map((feature) => feature.trim())
            .filter(Boolean),
          featureOptions: filteredOptions,
          active: form.active,
          highlighted: form.highlighted,
          pdfExportLimit: form.pdfExportLimit === "" || form.pdfExportLimit === null
            ? null
            : Number(form.pdfExportLimit),
          partnerId: form.partnerId || null,
        };
      }
    },
    [form]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      if (form.id) {
        await api.put(`/admin/plans/${form.id}`, payload);
        setMessage("Cập nhật gói thành công");
      } else {
        await api.post("/admin/plans", payload);
        setMessage("Tạo gói mới thành công");
      }
      await loadPlans();
      resetForm();
    } catch (err) {
      setError("Lưu gói thất bại. Vui lòng kiểm tra dữ liệu.");
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
    } catch (err) {
      setError("Xoá gói thất bại");
    }
  };

  // Filter plans based on filter criteria
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          plan.name.toLowerCase().includes(searchLower) ||
          (plan.description && plan.description.toLowerCase().includes(searchLower)) ||
          plan.code.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Billing cycle filter
      if (filters.billingCycle && plan.billingCycle !== filters.billingCycle) {
        return false;
      }

      // Active filter
      if (filters.active !== "") {
        const isActive = filters.active === "true";
        if (plan.active !== isActive) return false;
      }

      // Highlighted filter
      if (filters.highlighted !== "") {
        const isHighlighted = filters.highlighted === "true";
        if (plan.highlighted !== isHighlighted) return false;
      }

      // Price range filter
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-base-300">
        <div>
          <h1 className="text-3xl font-bold text-base-content mb-2">Quản lý Gói DISC</h1>
          <p className="text-base-content/70 text-sm">
            Tạo và quản lý các gói đăng ký cho hệ thống DISC test
          </p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="btn btn-primary gap-2 shadow-md hover:shadow-lg transition-shadow"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo gói mới
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="space-y-4">
          <header className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-base-content">Danh sách gói</h3>
              <p className="text-sm text-base-content/60 mt-1">Nhấp vào gói để chỉnh sửa</p>
            </div>
          </header>

          {/* Filter Section */}
          <div className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="font-semibold text-base-content">Bộ lọc</span>
                {hasActiveFilters && (
                  <span className="badge badge-primary badge-sm">
                    {Object.values(filters).filter((v) => v !== "").length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn btn-ghost btn-xs"
                  >
                    Xóa bộ lọc
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-ghost btn-sm"
                >
                  {showFilters ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="border-t border-base-300 p-4">
                <div className="space-y-4">
                  {/* Search */}
                  <label className="form-control">
                    <span className="label-text mb-1 text-xs font-medium">Tìm kiếm</span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên, mô tả, mã gói..."
                      className="input input-bordered input-sm"
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                  </label>

                  {/* Filters Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Plan Type */}
                    <label className="form-control">
                      <span className="label-text mb-1 text-xs font-medium">Loại gói</span>
                      <select
                        className="select select-bordered select-sm"
                        value={filters.planType}
                        onChange={(e) => {
                          handleFilterChange("planType", e.target.value);
                          loadPlans();
                        }}
                      >
                        <option value="">Tất cả</option>
                        <option value="USER_PLAN">Gói User</option>
                        <option value="PARTNER_PLAN">Gói Partner</option>
                      </select>
                    </label>

                    {/* Billing Cycle */}
                    <label className="form-control">
                      <span className="label-text mb-1 text-xs font-medium">Chu kỳ</span>
                      <select
                        className="select select-bordered select-sm"
                        value={filters.billingCycle}
                        onChange={(e) => handleFilterChange("billingCycle", e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        {billingCycleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Active Status */}
                    <label className="form-control">
                      <span className="label-text mb-1 text-xs font-medium">Trạng thái</span>
                      <select
                        className="select select-bordered select-sm"
                        value={filters.active}
                        onChange={(e) => handleFilterChange("active", e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        <option value="true">Đang hoạt động</option>
                        <option value="false">Không hoạt động</option>
                      </select>
                    </label>

                    {/* Highlighted */}
                    <label className="form-control">
                      <span className="label-text mb-1 text-xs font-medium">Nổi bật</span>
                      <select
                        className="select select-bordered select-sm"
                        value={filters.highlighted}
                        onChange={(e) => handleFilterChange("highlighted", e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        <option value="true">Có</option>
                        <option value="false">Không</option>
                      </select>
                    </label>

                    {/* Price Range */}
                    <div className="form-control">
                      <span className="label-text mb-1 text-xs font-medium">Khoảng giá</span>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          placeholder="Min"
                          className="input input-bordered input-sm flex-1"
                          value={filters.priceMin}
                          onChange={(e) => handleFilterChange("priceMin", e.target.value)}
                        />
                        <span className="flex items-center px-1 text-xs">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          className="input input-bordered input-sm flex-1"
                          value={filters.priceMax}
                          onChange={(e) => handleFilterChange("priceMax", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          {!loading && !error && plans.length > 0 && (
            <div className="text-xs text-base-content/60">
              Hiển thị {filteredPlans.length} / {plans.length} gói
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <span className="loading loading-spinner text-primary" />
            </div>
          ) : error ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-base-300 bg-base-200 p-6">
              <svg
                className="mb-4 h-16 w-16 text-base-content/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mb-2 text-center text-sm font-semibold text-base-content/60">
                Không có dữ liệu để hiển thị.
              </p>
              <button
                type="button"
                onClick={loadPlans}
                className="btn btn-ghost btn-sm mt-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Thử lại
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlans.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200">
                  <svg
                    className="mb-2 h-12 w-12 text-base-content/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-base-content/60">Không tìm thấy gói nào</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="btn btn-ghost btn-xs mt-2"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                filteredPlans.map((plan) => {
                  const billingCycleLabel = billingCycleOptions.find(opt => opt.value === plan.billingCycle)?.label || plan.billingCycle;
                  return (
                    <article
                      key={plan.id}
                      className={`group relative rounded-xl border-2 p-5 bg-base-100 shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer ${form.id === plan.id
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "border-base-300 hover:border-primary/50"
                        }`}
                      onClick={() => handleEdit(plan)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold text-base-content">{plan.name}</h4>
                            {plan.planType === "PARTNER_PLAN" ? (
                              <span className="badge badge-primary badge-sm">Gói Partner</span>
                            ) : (
                              <span className="badge badge-secondary badge-sm">Gói User</span>
                            )}
                            {plan.partnerName && (
                              <span className="badge badge-info badge-sm">Partner: {plan.partnerName}</span>
                            )}
                            {!plan.partnerName && (
                              <span className="badge badge-outline badge-sm">Gói hệ thống</span>
                            )}
                            {plan.highlighted && (
                              <span className="badge badge-warning badge-sm">⭐ Nổi bật</span>
                            )}
                            {plan.active ? (
                              <span className="badge badge-success badge-sm">Đang hoạt động</span>
                            ) : (
                              <span className="badge badge-error badge-sm">Không hoạt động</span>
                            )}
                          </div>
                          <p className="text-sm text-base-content/70 mb-3 line-clamp-2">{plan.description || "Không có mô tả"}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-base-content">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-semibold text-green-700">
                                {new Intl.NumberFormat("vi-VN").format(plan.price)} {plan.currency}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-base-content/70">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{billingCycleLabel}</span>
                            </div>
                            <div className="flex items-center gap-1 text-base-content/70">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{plan.features?.length || 0} tính năng</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(plan);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(plan.id);
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Xóa
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </section>

        <section className="bg-base-100 rounded-xl border border-base-300 shadow-lg p-6 sticky top-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-base-300">
            <div>
              <h3 className="text-xl font-bold text-base-content">
                {form.id ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Chỉnh sửa gói
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tạo gói mới
                  </span>
                )}
              </h3>
              <p className="text-sm text-base-content/60 mt-1">
                {form.id ? "Cập nhật thông tin gói đăng ký" : "Thêm gói đăng ký mới vào hệ thống"}
              </p>
            </div>
            {form.id && (
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-ghost btn-sm gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Hủy
              </button>
            )}
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="space-y-4 p-4 bg-base-200 rounded-lg border border-base-300">
              <h4 className="font-semibold text-base-content flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Thông tin cơ bản
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium text-base-content mb-1">Loại gói *</span>
                  <select
                    className="select select-bordered focus:select-primary"
                    value={form.planType}
                    onChange={(e) => setForm((prev) => ({ ...prev, planType: e.target.value, code: "" }))}
                    required
                  >
                    <option value="USER_PLAN">Gói User</option>
                    <option value="PARTNER_PLAN">Gói Partner</option>
                  </select>
                </label>
                <label className="form-control">
                  <span className="label-text font-medium text-base-content mb-1">Mã gói *</span>
                  <input
                    type="text"
                    className="input input-bordered focus:input-primary"
                    placeholder={form.planType === "USER_PLAN"
                      ? "Nhập mã gói (ví dụ: FREE, PERSONAL, VIP...)"
                      : "Nhập mã gói (ví dụ: PARTNER_BASIC, PARTNER_PRO...)"}
                    value={form.code}
                    onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    required
                  />
                  <span className="label-text-alt text-base-content/60 mt-1">
                    {form.planType === "USER_PLAN"
                      ? "Gợi ý: FREE, PERSONAL, VIP hoặc mã tùy chỉnh"
                      : "Gợi ý: PARTNER_BASIC, PARTNER_PRO, PARTNER_ENTERPRISE hoặc mã tùy chỉnh"}
                  </span>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-1">
                <label className="form-control">
                  <span className="label-text font-medium text-base-content mb-1">Tên gói *</span>
                  <input
                    className="input input-bordered focus:input-primary"
                    placeholder="Nhập tên gói..."
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-1">
                <label className="form-control">
                  <span className="label-text font-medium text-base-content mb-1">
                    Partner (để trống = gói hệ thống)
                  </span>
                  <select
                    className="select select-bordered focus:select-primary"
                    value={form.partnerId || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, partnerId: e.target.value || null }))}
                  >
                    <option value="">-- Gói hệ thống (không gắn partner) --</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.fullName} ({partner.email})
                      </option>
                    ))}
                  </select>
                  <span className="label-text-alt text-base-content/60 mt-1">
                    Chọn partner để tạo gói riêng cho partner này
                  </span>
                </label>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="space-y-4 p-4 bg-base-200 rounded-lg border border-base-300">
              <h4 className="font-semibold text-base-content flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Thông tin giá
              </h4>
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
            </div>

            {/* Description */}
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

            {/* PDF Export Limits */}
            <div className="space-y-4 p-4 bg-base-200 rounded-lg border border-base-300">
              <h4 className="font-semibold text-base-content flex items-center gap-2">
                <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Giới hạn xuất PDF (bài)
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium text-base-content mb-1">
                    Số bài PDF miễn phí (tối đa)
                  </span>
                  <input
                    type="number"
                    className="input input-bordered focus:input-primary"
                    placeholder="Để trống = không giới hạn, 0 = tắt"
                    value={form.freePdfExportLimit ?? ""}
                    min="0"
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : e.target.value;
                      setForm((prev) => ({ ...prev, freePdfExportLimit: value }));
                    }}
                  />
                  <span className="label-text-alt text-base-content/60 mt-1">
                    Số bài PDF khách hàng có thể xuất miễn phí (không cần đăng ký gói)
                  </span>
                </label>
                <label className="form-control">
                  <span className="label-text font-medium text-base-content mb-1">
                    Số bài PDF trả phí (tối đa)
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
                  <span className="label-text-alt text-base-content/60 mt-1">
                    Số bài PDF khách hàng có thể xuất khi đăng ký gói này
                  </span>
                </label>
              </div>
              <div className="alert alert-info text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-5 h-5 h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p className="font-semibold">Hướng dẫn:</p>
                  <p>• <strong>PDF Miễn phí:</strong> Áp dụng cho khách hàng chưa đăng ký gói (qua link, trực tiếp...)</p>
                  <p>• <strong>PDF Trả phí:</strong> Áp dụng cho khách hàng đã đăng ký gói này</p>
                  <p>• Để trống = Không giới hạn | 0 = Tắt tính năng | &gt;0 = Số bài được phép xuất</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 p-4 bg-base-200 rounded-lg border border-base-300">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base-content flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tính năng
                </h4>
                <span className="badge badge-primary badge-sm">
                  {Array.from(selectedFeatures).length + customFeatures.split("\n").filter(Boolean).length} tính năng
                </span>
              </div>
              <div className="rounded-lg border border-base-300 bg-base-100 p-4">
                <p className="mb-3 text-sm font-medium text-base-content">
                  Chọn tính năng phổ biến:
                </p>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {commonFeatures.map((feature) => (
                    <label key={feature} className="label cursor-pointer gap-2 hover:bg-base-200 rounded p-2 -m-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={selectedFeatures.has(feature)}
                        onChange={() => handleFeatureToggle(feature)}
                      />
                      <span className="label-text text-sm text-base-content">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="label">
                  <span className="label-text font-medium text-base-content">Tính năng tùy chỉnh</span>
                  <span className="label-text-alt text-base-content/60">Mỗi dòng một mục</span>
                </label>
                <textarea
                  className="textarea textarea-bordered focus:textarea-primary text-sm"
                  rows={3}
                  value={customFeatures}
                  onChange={(e) => handleCustomFeaturesChange(e.target.value)}
                  placeholder="Nhập tính năng tùy chỉnh, mỗi dòng một mục&#10;Ví dụ:&#10;Tính năng đặc biệt 1&#10;Tính năng đặc biệt 2"
                />
              </div>
            </div>

            {/* Feature Options */}
            <div className="space-y-4 p-4 bg-base-200 rounded-lg border border-base-300">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base-content flex items-center gap-2">
                  <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Tùy chọn tính năng
                </h4>
                <span className="badge badge-secondary badge-sm">
                  {Object.keys(featureOptions).length} tùy chọn
                </span>
              </div>
              <div className="rounded-lg border border-base-300 bg-base-100 p-4 space-y-3">
                <p className="text-sm font-medium text-base-content mb-3">
                  Cấu hình các tùy chọn:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {commonFeatureOptions.map((option) => (
                    <div key={option.key} className="flex items-center justify-between rounded-lg bg-base-200 p-3 hover:bg-base-300 transition-colors">
                      <span className="text-sm font-medium text-base-content">{option.label}</span>
                      <select
                        className="select select-bordered select-sm w-48"
                        value={featureOptions[option.key] || option.default}
                        onChange={(e) => handleFeatureOptionChange(option.key, e.target.value)}
                      >
                        {option.key === 'pdf_report_type' ? (
                          <>
                            <option value="PAID_PDF">💎 PDF Trả phí (Template)</option>
                          </>
                        ) : (
                          <>
                            <option value="enabled">✅ Bật</option>
                            <option value="disabled">❌ Tắt</option>
                          </>
                        )}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="label">
                  <span className="label-text font-medium text-base-content">Tùy chọn tùy chỉnh</span>
                  <span className="label-text-alt text-base-content/60">Format: key=value, mỗi dòng 1 mục</span>
                </label>
                <textarea
                  className="textarea textarea-bordered focus:textarea-primary text-xs font-mono"
                  rows={2}
                  value={Object.entries(featureOptions)
                    .filter(([key]) => !commonFeatureOptions.some((opt) => opt.key === key))
                    .map(([key, value]) => `${key}=${value}`)
                    .join("\n")}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n");
                    const newOptions = { ...featureOptions };
                    lines.forEach((line) => {
                      const [key, value] = line.split("=");
                      if (key && value) {
                        newOptions[key.trim()] = value.trim();
                      }
                    });
                    setFeatureOptions(newOptions);
                    const optionsArray = Object.entries(newOptions)
                      .map(([k, v]) => `${k}=${v}`)
                      .join("\n");
                    setForm((prev) => ({ ...prev, featureOptions: optionsArray }));
                  }}
                  placeholder="custom_option1=enabled&#10;custom_option2=disabled"
                />
              </div>
            </div>

            {/* Status Settings */}
            <div className="space-y-4 p-4 bg-base-200 rounded-lg border border-base-300">
              <h4 className="font-semibold text-base-content flex items-center gap-2">
                <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Cài đặt trạng thái
              </h4>
              <div className="flex flex-wrap items-center gap-6">
                <label className="label cursor-pointer gap-3">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={form.active}
                    onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                  />
                  <div>
                    <span className="label-text font-medium text-base-content">Kích hoạt</span>
                    <p className="text-xs text-base-content/60">Gói sẽ hiển thị cho người dùng</p>
                  </div>
                </label>
                <label className="label cursor-pointer gap-3">
                  <input
                    type="checkbox"
                    className="toggle toggle-secondary"
                    checked={form.highlighted}
                    onChange={(e) => setForm((prev) => ({ ...prev, highlighted: e.target.checked }))}
                  />
                  <div>
                    <span className="label-text font-medium text-base-content">Đánh dấu nổi bật</span>
                    <p className="text-xs text-base-content/60">Gói sẽ được ưu tiên hiển thị</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className="alert alert-success shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-300">
              {form.id && (
                <button type="button" className="btn btn-ghost" onClick={resetForm}>
                  Hủy
                </button>
              )}
              <button type="submit" className="btn btn-primary gap-2 shadow-md hover:shadow-lg transition-shadow" disabled={saving}>
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {form.id ? "Cập nhật gói" : "Tạo gói mới"}
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default PlanManagementPage;
