import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, MessageSquareQuote, Pencil, Plus, Sparkles, Tags, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import DiscContentTabs from "../../components/admin/DiscContentTabs";
import ConfirmModal from "../../components/common/ConfirmModal";
import api, { adminInsightAPI } from "../../lib/api.js";
import {
  allDimensions,
  getDefaultDimension,
  getContentTypeOptions,
  getDimensionsByTest,
  mapLegacyDimension,
} from "../../features/admin/disc-content/config.js";
import {
  ContentHero,
  DimensionBadge,
  EditorModal,
  EmptyState,
  KeyValuePill,
  PlanCodePicker,
  SearchField,
  StatusBadge,
  Surface,
} from "../../features/admin/disc-content/ui.jsx";
import { formatListCount } from "../../features/admin/disc-content/meta.js";

const initialForm = {
  id: null,
  testCode: "DISC",
  category: "general",
  dimension: getDefaultDimension("DISC"),
  summary: "",
  keyBehaviors: "",
  strengths: "",
  weaknesses: "",
  communicationStyle: "",
  leadershipStyle: "",
  active: true,
  allowedPlanCodes: [],
};

const defaultCategories = ["general", "recruitment", "sales", "management"];

const buildInsightPayload = (record, overrides = {}) => ({
  testCode: overrides.testCode || record.testCode || "DISC",
  category: overrides.category ?? record.category ?? "general",
  dimension: mapLegacyDimension(overrides.dimension || record.dimension),
  summary: overrides.summary ?? record.summary ?? "",
  keyBehaviors: overrides.keyBehaviors ?? record.keyBehaviors ?? "",
  strengths: overrides.strengths ?? record.strengths ?? "",
  weaknesses: overrides.weaknesses ?? record.weaknesses ?? "",
  communicationStyle: overrides.communicationStyle ?? record.communicationStyle ?? "",
  leadershipStyle: overrides.leadershipStyle ?? record.leadershipStyle ?? "",
  active: overrides.active ?? (record.active !== false),
  allowedPlanCodes: overrides.allowedPlanCodes ?? record.allowedPlanCodes ?? [],
});

const InsightManagementPage = () => {
  const [insights, setInsights] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const filterTestCode = searchParams.get("testCode") || "";
  const filterDimension = mapLegacyDimension(searchParams.get("dimension")) || "";
  const filterCategory = searchParams.get("category") || "";

  const dimensionOptionsForFilter = useMemo(
    () => (filterTestCode ? getDimensionsByTest(filterTestCode) : allDimensions),
    [filterTestCode]
  );
  const dimensionOptionsForForm = useMemo(
    () => getDimensionsByTest(form.testCode),
    [form.testCode]
  );

  const setFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  };

  const loadInsights = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTestCode) params.testCode = filterTestCode;
      if (filterDimension) params.dimension = filterDimension;
      if (filterCategory) params.category = filterCategory;
      const { data } = await adminInsightAPI.getAll(params);
      setInsights(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Failed to load insights", loadError);
      toast.error("Không thể tải danh sách insight.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterTestCode && filterDimension) {
      const isAllowedDimension = getDimensionsByTest(filterTestCode).some(
        (dimension) => dimension.value === filterDimension
      );
      if (!isAllowedDimension) {
        setFilter("dimension", "");
        return;
      }
    }

    loadInsights();
  }, [filterCategory, filterDimension, filterTestCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const { data } = await api.get("/admin/plans", { params: { planType: "USER_PLAN" } });
        setAvailablePlans(Array.isArray(data) ? data : []);
      } catch (loadError) {
        console.error("Failed to load plan options", loadError);
        setAvailablePlans([]);
      }
    };

    loadPlans();
  }, []);

  useEffect(() => {
    const allowedValues = dimensionOptionsForForm.map((dimension) => dimension.value);
    setForm((previous) => {
      const nextDimension = allowedValues.includes(mapLegacyDimension(previous.dimension))
        ? mapLegacyDimension(previous.dimension)
        : allowedValues[0] || previous.dimension;

      if (nextDimension === previous.dimension) {
        return previous;
      }

      return {
        ...previous,
        dimension: nextDimension,
      };
    });
  }, [dimensionOptionsForForm]);

  const availableCategories = useMemo(() => {
    const categorySet = new Set(defaultCategories);
    insights.forEach((insight) => {
      if (insight.category) {
        categorySet.add(insight.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [insights]);

  const filteredInsights = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return insights.filter((insight) => {
      if (!keyword) return true;

      return [
        insight.category,
        insight.summary,
        insight.keyBehaviors,
        insight.strengths,
        insight.weaknesses,
        insight.communicationStyle,
        insight.leadershipStyle,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(keyword));
    });
  }, [insights, searchTerm]);

  const stats = useMemo(() => {
    const activeCount = insights.filter((insight) => insight.active !== false).length;
    const completedCount = insights.filter(
      (insight) =>
        [insight.summary, insight.keyBehaviors, insight.strengths, insight.weaknesses].filter(Boolean).length >= 4
    ).length;
    const planScoped = insights.filter(
      (insight) => Array.isArray(insight.allowedPlanCodes) && insight.allowedPlanCodes.length > 0
    ).length;

    return {
      total: insights.length,
      active: activeCount,
      completed: completedCount,
      planScoped,
    };
  }, [insights]);

  const resetForm = () => {
    const nextTestCode = filterTestCode || "DISC";
    setForm({
      ...initialForm,
      testCode: nextTestCode,
      dimension: getDefaultDimension(nextTestCode),
      category: filterCategory || "general",
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (insight) => {
    setForm({
      id: insight.id,
      testCode: insight.testCode || "DISC",
      category: insight.category || "general",
      dimension: mapLegacyDimension(insight.dimension),
      summary: insight.summary || "",
      keyBehaviors: insight.keyBehaviors || "",
      strengths: insight.strengths || "",
      weaknesses: insight.weaknesses || "",
      communicationStyle: insight.communicationStyle || "",
      leadershipStyle: insight.leadershipStyle || "",
      active: insight.active !== false,
      allowedPlanCodes: insight.allowedPlanCodes || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildInsightPayload(form);
      if (form.id) {
        await adminInsightAPI.update(form.id, payload);
        toast.success("Đã cập nhật insight.");
      } else {
        await adminInsightAPI.create(payload);
        toast.success("Đã tạo insight mới.");
      }

      await loadInsights();
      closeModal();
    } catch (saveError) {
      console.error("Failed to save insight", saveError);
      toast.error("Không thể lưu insight. Kiểm tra lại dữ liệu rồi thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (insight) => {
    try {
      await adminInsightAPI.update(
        insight.id,
        buildInsightPayload(insight, { active: insight.active === false })
      );
      await loadInsights();
      toast.success(insight.active === false ? "Đã bật insight." : "Đã tắt insight.");
    } catch (toggleError) {
      console.error("Failed to toggle insight", toggleError);
      toast.error("Không thể cập nhật trạng thái insight.");
    }
  };

  const handleDelete = (id) => {
    setConfirmId(id);
  };

  const executeDelete = async (id) => {
    setDeleting(true);
    try {
      await adminInsightAPI.delete(id);
      await loadInsights();
      toast.success("Đã xoá insight.");
      if (form.id === id) {
        closeModal();
      }
    } catch (deleteError) {
      console.error("Failed to delete insight", deleteError);
      toast.error("Không thể xoá insight.");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <DiscContentTabs />

      <ContentHero
        icon={BrainCircuit}
        eyebrow="Admin Content"
        title="Insight library"
        description="Kho nội dung giải thích hành vi theo dimension, gồm summary, strengths, weaknesses và phong cách giao tiếp/lãnh đạo cho từng context."
        tone="violet"
        stats={[
          {
            label: "Tổng insight",
            value: formatListCount(stats.total),
            hint: filterTestCode ? `Đang lọc theo ${filterTestCode}.` : "Đang xem toàn bộ loại nội dung.",
            icon: BrainCircuit,
            tone: "violet",
          },
          {
            label: "Đang bật",
            value: formatListCount(stats.active),
            hint: `${formatListCount(filteredInsights.length)} mục khớp bộ lọc hiện tại.`,
            icon: Sparkles,
            tone: "emerald",
          },
          {
            label: "Đủ khối nội dung",
            value: formatListCount(stats.completed),
            hint: "Có đủ summary, behaviors, strengths và weaknesses.",
            icon: MessageSquareQuote,
            tone: "sky",
          },
          {
            label: "Có giới hạn gói",
            value: formatListCount(stats.planScoped),
            hint: "Insight chỉ áp dụng cho một số plan code nhất định.",
            icon: Tags,
            tone: "amber",
          },
        ]}
        actions={
          <button type="button" className="btn btn-primary gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Thêm insight
          </button>
        }
      />

      <Surface className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr),200px,220px,220px] xl:w-[82%]">
            <SearchField
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Tìm theo summary, điểm mạnh/yếu, category hoặc style..."
            />
            <select
              className="select select-bordered h-full rounded-2xl border-slate-200 bg-white"
              value={filterTestCode}
              onChange={(event) => setFilter("testCode", event.target.value)}
            >
              <option value="">Tất cả loại</option>
              {getContentTypeOptions(filterTestCode).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="select select-bordered h-full rounded-2xl border-slate-200 bg-white"
              value={filterDimension}
              onChange={(event) => setFilter("dimension", event.target.value)}
            >
              <option value="">Tất cả dimension</option>
              {dimensionOptionsForFilter.map((dimension) => (
                <option key={dimension.value} value={dimension.value}>
                  {dimension.label}
                </option>
              ))}
            </select>
            <select
              className="select select-bordered h-full rounded-2xl border-slate-200 bg-white"
              value={filterCategory}
              onChange={(event) => setFilter("category", event.target.value)}
            >
              <option value="">Tất cả category</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <KeyValuePill label="Hiển thị" value={`${formatListCount(filteredInsights.length)} mục`} />
            <KeyValuePill label="Loại" value={filterTestCode || "Toàn bộ"} />
            <KeyValuePill label="Category" value={filterCategory || "Toàn bộ"} />
          </div>
        </div>
      </Surface>

      {loading ? (
        <Surface className="flex min-h-[320px] items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </Surface>
      ) : filteredInsights.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          title="Chưa có insight phù hợp"
          description="Thử đổi bộ lọc hoặc thêm một insight mới cho category/dimension bạn đang quản lý."
          action={
            <button type="button" className="btn btn-primary gap-2" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Tạo insight đầu tiên
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredInsights.map((insight) => {
            const completionCount = [
              insight.summary,
              insight.keyBehaviors,
              insight.strengths,
              insight.weaknesses,
              insight.communicationStyle,
              insight.leadershipStyle,
            ].filter(Boolean).length;
            const planScoped = Array.isArray(insight.allowedPlanCodes) && insight.allowedPlanCodes.length > 0;

            return (
              <article
                key={insight.id}
                className="rounded-[28px] border border-slate-200/70 bg-white/95 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(15,23,42,0.09)]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <DimensionBadge value={insight.dimension} compact />
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {insight.testCode || "DISC"}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                          {insight.category || "general"}
                        </span>
                      </div>
                      <p className="line-clamp-4 text-sm leading-6 text-slate-600">
                        {insight.summary || "Chưa có phần summary cho insight này."}
                      </p>
                    </div>
                    <StatusBadge active={insight.active !== false} />
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap gap-2">
                      <KeyValuePill label="Nội dung" value={`${completionCount}/6`} />
                      <KeyValuePill label="Plan" value={planScoped ? "Giới hạn" : "Tất cả"} />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {[
                        { label: "Strengths", value: insight.strengths },
                        { label: "Weaknesses", value: insight.weaknesses },
                        { label: "Behaviors", value: insight.keyBehaviors },
                        { label: "Styles", value: [insight.communicationStyle, insight.leadershipStyle].filter(Boolean).join(" • ") },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                          <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">
                            {item.value || "Chưa cập nhật"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {planScoped ? (
                      insight.allowedPlanCodes.map((planCode) => (
                        <span
                          key={planCode}
                          className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700"
                        >
                          {planCode}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">Áp dụng cho tất cả gói người dùng.</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <label className="flex items-center gap-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        className="toggle toggle-sm toggle-primary"
                        checked={insight.active !== false}
                        onChange={() => handleToggleActive(insight)}
                      />
                      Hiển thị insight này
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gap-2"
                        onClick={() => handleEdit(insight)}
                      >
                        <Pencil className="h-4 w-4" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
                        onClick={() => handleDelete(insight.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Xoá
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <EditorModal
        open={isModalOpen}
        onClose={closeModal}
        title={form.id ? "Chỉnh sửa insight" : "Tạo insight mới"}
        description="Quản lý loại nội dung, category, dimension và phạm vi plan code trong một editor thống nhất."
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>
              Huỷ
            </button>
            <button type="submit" form="insight-form" className="btn btn-primary gap-2" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : <Plus className="h-4 w-4" />}
              {form.id ? "Lưu cập nhật" : "Tạo insight"}
            </button>
          </div>
        }
      >
        <form id="insight-form" className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                    <BrainCircuit className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Cấu hình insight</h3>
                    <p className="text-sm text-slate-500">Chọn loại nội dung, dimension và category trước khi nhập nội dung.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Loại nội dung</span>
                    <select
                      className="select select-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.testCode}
                      onChange={(event) => {
                        const nextTestCode = event.target.value;
                        setForm((previous) => ({
                          ...previous,
                          testCode: nextTestCode,
                          dimension: getDefaultDimension(nextTestCode),
                        }));
                      }}
                      required
                    >
                      {getContentTypeOptions(form.testCode).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Dimension</span>
                    <select
                      className="select select-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.dimension}
                      onChange={(event) => setForm((previous) => ({ ...previous, dimension: event.target.value }))}
                      required
                    >
                      {dimensionOptionsForForm.map((dimension) => (
                        <option key={dimension.value} value={dimension.value}>
                          {dimension.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-control md:col-span-2">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Category</span>
                    <input
                      list="insight-category-list"
                      className="input input-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.category}
                      onChange={(event) => setForm((previous) => ({ ...previous, category: event.target.value }))}
                      placeholder="VD: general, recruitment..."
                      required
                    />
                    <datalist id="insight-category-list">
                      {availableCategories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </label>
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                    <Tags className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Plan access</h3>
                    <p className="text-sm text-slate-500">Giới hạn insight theo gói người dùng khi cần.</p>
                  </div>
                </div>

                <PlanCodePicker
                  plans={availablePlans}
                  value={form.allowedPlanCodes}
                  onChange={(nextCodes) => setForm((previous) => ({ ...previous, allowedPlanCodes: nextCodes }))}
                />
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Trạng thái phát hành</h3>
                    <p className="text-sm text-slate-500">Bật khi insight đã sẵn sàng để hiển thị trên kết quả.</p>
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Cho phép hiển thị</p>
                    <p className="text-xs text-slate-500">Tắt nếu đang chỉnh sửa hoặc kiểm duyệt.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={form.active}
                    onChange={(event) => setForm((previous) => ({ ...previous, active: event.target.checked }))}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <MessageSquareQuote className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Khối nội dung chính</h3>
                    <p className="text-sm text-slate-500">Các đoạn văn hoặc bullet dùng để giải thích kết quả.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Summary</span>
                    <textarea
                      className="textarea textarea-bordered min-h-24 rounded-2xl border-slate-200 bg-white"
                      value={form.summary}
                      onChange={(event) => setForm((previous) => ({ ...previous, summary: event.target.value }))}
                      placeholder="Mô tả ngắn gọn về nhóm tính cách hoặc context này."
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Key behaviors</span>
                    <textarea
                      className="textarea textarea-bordered min-h-24 rounded-2xl border-slate-200 bg-white"
                      value={form.keyBehaviors}
                      onChange={(event) => setForm((previous) => ({ ...previous, keyBehaviors: event.target.value }))}
                      placeholder="- Hành vi dễ nhận biết&#10;- Cách phản ứng thường gặp..."
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="form-control">
                      <span className="label-text mb-2 text-sm font-semibold text-slate-700">Strengths</span>
                      <textarea
                        className="textarea textarea-bordered min-h-32 rounded-2xl border-slate-200 bg-white"
                        value={form.strengths}
                        onChange={(event) => setForm((previous) => ({ ...previous, strengths: event.target.value }))}
                        placeholder="- Điểm mạnh 1&#10;- Điểm mạnh 2"
                      />
                    </label>

                    <label className="form-control">
                      <span className="label-text mb-2 text-sm font-semibold text-slate-700">Weaknesses</span>
                      <textarea
                        className="textarea textarea-bordered min-h-32 rounded-2xl border-slate-200 bg-white"
                        value={form.weaknesses}
                        onChange={(event) => setForm((previous) => ({ ...previous, weaknesses: event.target.value }))}
                        placeholder="- Điểm yếu 1&#10;- Điểm yếu 2"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="form-control">
                      <span className="label-text mb-2 text-sm font-semibold text-slate-700">Communication style</span>
                      <textarea
                        className="textarea textarea-bordered min-h-24 rounded-2xl border-slate-200 bg-white"
                        value={form.communicationStyle}
                        onChange={(event) => setForm((previous) => ({ ...previous, communicationStyle: event.target.value }))}
                        placeholder="Mô tả cách giao tiếp điển hình."
                      />
                    </label>

                    <label className="form-control">
                      <span className="label-text mb-2 text-sm font-semibold text-slate-700">Leadership style</span>
                      <textarea
                        className="textarea textarea-bordered min-h-24 rounded-2xl border-slate-200 bg-white"
                        value={form.leadershipStyle}
                        onChange={(event) => setForm((previous) => ({ ...previous, leadershipStyle: event.target.value }))}
                        placeholder="Mô tả cách dẫn dắt hoặc ra quyết định."
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </EditorModal>

      <ConfirmModal
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={() => executeDelete(confirmId)}
        loading={deleting}
        title="Xoá insight"
        description="Insight này sẽ bị xoá vĩnh viễn và không thể khôi phục."
        confirmLabel="Xoá insight"
      />
    </div>
  );
};

export default InsightManagementPage;
