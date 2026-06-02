import { useEffect, useMemo, useState } from "react";
import { BookOpen, ClipboardList, Pencil, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import DiscContentTabs from "../../components/admin/DiscContentTabs";
import ConfirmModal from "../../components/common/ConfirmModal";
import api, { adminDevPlanAPI } from "../../lib/api.js";
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
  dimension: getDefaultDimension("DISC"),
  focusArea: "",
  timeline: "",
  objectives: "",
  actions: "",
  resources: "",
  active: true,
  allowedPlanCodes: [],
};

const countLines = (value) =>
  (value || "")
    .split("\n")
    .map((segment) => segment.trim())
    .filter(Boolean).length;

const buildPlanPayload = (record, overrides = {}) => ({
  testCode: overrides.testCode || record.testCode || "DISC",
  dimension: mapLegacyDimension(overrides.dimension || record.dimension),
  focusArea: overrides.focusArea ?? record.focusArea ?? "",
  timeline: overrides.timeline ?? record.timeline ?? "",
  objectives: overrides.objectives ?? record.objectives ?? "",
  actions: overrides.actions ?? record.actions ?? "",
  resources: overrides.resources ?? record.resources ?? "",
  active: overrides.active ?? (record.active !== false),
  allowedPlanCodes: overrides.allowedPlanCodes ?? record.allowedPlanCodes ?? [],
});

const DevelopmentPlanManagementPage = () => {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const testCode = searchParams.get("testCode") || "";
  const filterDimension = mapLegacyDimension(searchParams.get("dimension")) || "";

  const dimensionOptions = useMemo(
    () => (testCode ? getDimensionsByTest(testCode) : allDimensions),
    [testCode]
  );
  const formDimensionOptions = useMemo(
    () => getDimensionsByTest(form.testCode),
    [form.testCode]
  );

  const setQueryValue = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const params = { testCode };
      if (filterDimension) params.dimension = filterDimension;
      const { data } = await adminDevPlanAPI.getAll(params);
      setPlans(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Failed to load development plans", loadError);
      toast.error("Không thể tải danh sách lộ trình.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterDimension) {
      const isAllowedDimension = dimensionOptions.some(
        (dimension) => dimension.value === filterDimension
      );
      if (!isAllowedDimension) {
        setQueryValue("dimension", "");
        return;
      }
    }

    loadPlans();
  }, [filterDimension, testCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadPlanOptions = async () => {
      try {
        const { data } = await api.get("/admin/plans", { params: { planType: "USER_PLAN" } });
        setAvailablePlans(Array.isArray(data) ? data : []);
      } catch (loadError) {
        console.error("Failed to load plan options", loadError);
        setAvailablePlans([]);
      }
    };

    loadPlanOptions();
  }, []);

  useEffect(() => {
    const allowedValues = formDimensionOptions.map((dimension) => dimension.value);
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
  }, [formDimensionOptions]);

  const resetForm = () => {
    const nextTestCode = testCode || "DISC";
    setForm({
      ...initialForm,
      testCode: nextTestCode,
      dimension: getDefaultDimension(nextTestCode),
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

  const handleEdit = (plan) => {
    setForm({
      id: plan.id,
      testCode: plan.testCode || testCode || "DISC",
      dimension: mapLegacyDimension(plan.dimension),
      focusArea: plan.focusArea || "",
      timeline: plan.timeline || "",
      objectives: plan.objectives || "",
      actions: plan.actions || "",
      resources: plan.resources || "",
      active: plan.active !== false,
      allowedPlanCodes: plan.allowedPlanCodes || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildPlanPayload(form);
      if (form.id) {
        await adminDevPlanAPI.update(form.id, payload);
        toast.success("Đã cập nhật lộ trình.");
      } else {
        await adminDevPlanAPI.create(payload);
        toast.success("Đã tạo lộ trình mới.");
      }

      await loadPlans();
      closeModal();
    } catch (saveError) {
      console.error("Failed to save development plan", saveError);
      toast.error("Không thể lưu lộ trình. Kiểm tra lại dữ liệu và thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await adminDevPlanAPI.update(
        plan.id,
        buildPlanPayload(plan, { active: plan.active === false })
      );
      await loadPlans();
      toast.success(plan.active === false ? "Đã bật lộ trình." : "Đã tắt lộ trình.");
    } catch (toggleError) {
      console.error("Failed to toggle development plan", toggleError);
      toast.error("Không thể cập nhật trạng thái lộ trình.");
    }
  };

  const handleDelete = (id) => {
    setConfirmId(id);
  };

  const executeDelete = async (id) => {
    setDeleting(true);
    try {
      await adminDevPlanAPI.delete(id);
      await loadPlans();
      toast.success("Đã xoá lộ trình.");
      if (form.id === id) {
        closeModal();
      }
    } catch (deleteError) {
      console.error("Failed to delete development plan", deleteError);
      toast.error("Không thể xoá lộ trình.");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  const filteredPlans = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return plans.filter((plan) => {
      if (!keyword) return true;

      return [
        plan.focusArea,
        plan.timeline,
        plan.objectives,
        plan.actions,
        plan.resources,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(keyword));
    });
  }, [plans, searchTerm]);

  const stats = useMemo(() => {
    const activeCount = plans.filter((plan) => plan.active !== false).length;
    const withActions = plans.filter((plan) => countLines(plan.actions) > 0).length;
    const withResources = plans.filter((plan) => countLines(plan.resources) > 0).length;

    return {
      total: plans.length,
      active: activeCount,
      withActions,
      withResources,
    };
  }, [plans]);

  return (
    <div className="space-y-6">
      <DiscContentTabs />

      <ContentHero
        icon={Target}
        eyebrow="Admin Content"
        title="Lộ trình phát triển"
        description="Quản lý roadmap theo loại nội dung và dimension, bao gồm mục tiêu, action plan, tài nguyên hỗ trợ và phạm vi áp dụng theo gói."
        tone="sky"
        stats={[
          {
            label: "Tổng lộ trình",
            value: formatListCount(stats.total),
            hint: testCode ? `Phạm vi hiện tại: ${testCode}.` : "Đang xem toàn bộ loại nội dung.",
            icon: ClipboardList,
            tone: "sky",
          },
          {
            label: "Đang bật",
            value: formatListCount(stats.active),
            hint: `${formatListCount(filteredPlans.length)} mục đang khớp bộ lọc.`,
            icon: Sparkles,
            tone: "emerald",
          },
          {
            label: "Có action plan",
            value: formatListCount(stats.withActions),
            hint: "Các lộ trình đã có bước hành động cụ thể.",
            icon: Pencil,
            tone: "violet",
          },
          {
            label: "Có resources",
            value: formatListCount(stats.withResources),
            hint: "Số lộ trình đã đính kèm tài nguyên hỗ trợ.",
            icon: BookOpen,
            tone: "amber",
          },
        ]}
        actions={
          <button type="button" className="btn btn-primary gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Thêm lộ trình
          </button>
        }
      />

      <Surface className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr),200px,220px] xl:w-[78%]">
            <SearchField
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Tìm theo focus area, objective, action hoặc resources..."
            />
            <select
              className="select select-bordered h-full rounded-2xl border-slate-200 bg-white"
              value={testCode}
              onChange={(event) => setQueryValue("testCode", event.target.value)}
            >
              <option value="">Tất cả loại</option>
              {getContentTypeOptions(testCode).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="select select-bordered h-full rounded-2xl border-slate-200 bg-white"
              value={filterDimension}
              onChange={(event) => setQueryValue("dimension", event.target.value)}
            >
              <option value="">Tất cả dimension</option>
              {dimensionOptions.map((dimension) => (
                <option key={dimension.value} value={dimension.value}>
                  {dimension.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <KeyValuePill label="Hiển thị" value={`${formatListCount(filteredPlans.length)} mục`} />
            <KeyValuePill label="Loại" value={testCode || "Toàn bộ"} />
            <KeyValuePill label="Dimension" value={filterDimension || "Toàn bộ"} />
          </div>
        </div>
      </Surface>

      {loading ? (
        <Surface className="flex min-h-[320px] items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </Surface>
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Chưa có lộ trình nào"
          description="Tạo lộ trình đầu tiên để bổ sung roadmap theo dimension cho kết quả người dùng."
          action={
            <button type="button" className="btn btn-primary gap-2" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Tạo lộ trình đầu tiên
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredPlans.map((plan) => {
            const actionCount = countLines(plan.actions);
            const resourceCount = countLines(plan.resources);
            const planScoped = Array.isArray(plan.allowedPlanCodes) && plan.allowedPlanCodes.length > 0;

            return (
              <article
                key={plan.id}
                className="rounded-[28px] border border-slate-200/70 bg-white/95 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(15,23,42,0.09)]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <DimensionBadge value={plan.dimension} compact />
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {plan.testCode || testCode}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-slate-950">{plan.focusArea}</h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                          {plan.objectives || "Chưa có objective chi tiết cho lộ trình này."}
                        </p>
                      </div>
                    </div>
                    <StatusBadge active={plan.active !== false} />
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap gap-2">
                      <KeyValuePill label="Timeline" value={plan.timeline || "Chưa đặt"} />
                      <KeyValuePill label="Actions" value={formatListCount(actionCount)} />
                      <KeyValuePill label="Resources" value={formatListCount(resourceCount)} />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</p>
                        <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">
                          {plan.actions || "Chưa có bước hành động chi tiết."}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Resources</p>
                        <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">
                          {plan.resources || "Chưa có tài nguyên hỗ trợ."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {planScoped ? (
                      plan.allowedPlanCodes.map((planCode) => (
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
                        checked={plan.active !== false}
                        onChange={() => handleToggleActive(plan)}
                      />
                      Hiển thị lộ trình này
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gap-2"
                        onClick={() => handleEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
                        onClick={() => handleDelete(plan.id)}
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
        title={form.id ? "Chỉnh sửa lộ trình" : "Tạo lộ trình mới"}
        description="Thiết lập loại nội dung, focus area, timeline, objective, action plan và resources trong cùng một editor."
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>
              Huỷ
            </button>
            <button type="submit" form="development-plan-form" className="btn btn-primary gap-2" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : <Plus className="h-4 w-4" />}
              {form.id ? "Lưu cập nhật" : "Tạo lộ trình"}
            </button>
          </div>
        }
      >
        <form id="development-plan-form" className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <Target className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Khung lộ trình</h3>
                    <p className="text-sm text-slate-500">Chọn loại nội dung và dimension trước khi nhập nội dung.</p>
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
                      {formDimensionOptions.map((dimension) => (
                        <option key={dimension.value} value={dimension.value}>
                          {dimension.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-control md:col-span-2">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Focus area</span>
                    <input
                      className="input input-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.focusArea}
                      onChange={(event) => setForm((previous) => ({ ...previous, focusArea: event.target.value }))}
                      placeholder="VD: Nâng cao kỹ năng phản hồi và phối hợp"
                      required
                    />
                  </label>

                  <label className="form-control md:col-span-2">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Timeline</span>
                    <input
                      className="input input-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.timeline}
                      onChange={(event) => setForm((previous) => ({ ...previous, timeline: event.target.value }))}
                      placeholder="VD: 4 tuần, 3 tháng, 6 tháng"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Nội dung roadmap</h3>
                    <p className="text-sm text-slate-500">Objectives, actions và resources để hiển thị trong kết quả.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Objectives</span>
                    <textarea
                      className="textarea textarea-bordered min-h-28 rounded-2xl border-slate-200 bg-white"
                      value={form.objectives}
                      onChange={(event) => setForm((previous) => ({ ...previous, objectives: event.target.value }))}
                      placeholder="- Mục tiêu 1&#10;- Mục tiêu 2"
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Key actions</span>
                    <textarea
                      className="textarea textarea-bordered min-h-32 rounded-2xl border-slate-200 bg-white"
                      value={form.actions}
                      onChange={(event) => setForm((previous) => ({ ...previous, actions: event.target.value }))}
                      placeholder="- Việc cần làm mỗi tuần&#10;- Checkpoint hoặc thực hành..."
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Resources</span>
                    <textarea
                      className="textarea textarea-bordered min-h-24 rounded-2xl border-slate-200 bg-white"
                      value={form.resources}
                      onChange={(event) => setForm((previous) => ({ ...previous, resources: event.target.value }))}
                      placeholder="- Sách&#10;- Khoá học&#10;- Mentor"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Plan access</h3>
                    <p className="text-sm text-slate-500">Giới hạn lộ trình cho các gói người dùng cụ thể.</p>
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
                    <p className="text-sm text-slate-500">Bật khi lộ trình đã sẵn sàng để hiển thị cho người dùng.</p>
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Cho phép hiển thị</p>
                    <p className="text-xs text-slate-500">Tắt nếu đang chỉnh sửa hoặc kiểm thử nội dung.</p>
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
          </div>
        </form>
      </EditorModal>

      <ConfirmModal
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={() => executeDelete(confirmId)}
        loading={deleting}
        title="Xoá lộ trình"
        description="Lộ trình này sẽ bị xoá vĩnh viễn và không thể khôi phục."
        confirmLabel="Xoá lộ trình"
      />
    </div>
  );
};

export default DevelopmentPlanManagementPage;
