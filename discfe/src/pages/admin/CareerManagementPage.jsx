import { useEffect, useMemo, useState } from "react";
import { BookOpen, Briefcase, Gauge, Pencil, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import DiscContentTabs from "../../components/admin/DiscContentTabs";
import ConfirmModal from "../../components/common/ConfirmModal";
import api, { adminCareerAPI } from "../../lib/api.js";
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
  primaryDimension: getDefaultDimension("DISC"),
  secondaryDimension: "",
  jobTitle: "",
  matchLevel: 50,
  summary: "",
  skills: "",
  learningResources: "",
  active: true,
  allowedPlanCodes: [],
};

const buildCareerPayload = (record, overrides = {}) => ({
  testCode: overrides.testCode || record.testCode || "DISC",
  primaryDimension: mapLegacyDimension(overrides.primaryDimension || record.primaryDimension),
  secondaryDimension: overrides.secondaryDimension !== undefined
    ? (overrides.secondaryDimension ? mapLegacyDimension(overrides.secondaryDimension) : null)
    : (record.secondaryDimension ? mapLegacyDimension(record.secondaryDimension) : null),
  jobTitle: overrides.jobTitle ?? record.jobTitle ?? "",
  matchLevel: Number(overrides.matchLevel ?? record.matchLevel ?? 0),
  summary: overrides.summary ?? record.summary ?? "",
  skills: overrides.skills ?? record.skills ?? "",
  learningResources: overrides.learningResources ?? record.learningResources ?? "",
  active: overrides.active ?? (record.active !== false),
  allowedPlanCodes: overrides.allowedPlanCodes ?? record.allowedPlanCodes ?? [],
});

const CareerManagementPage = () => {
  const [careers, setCareers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const filterTestCode = searchParams.get("testCode") || "";
  const filterDimension = mapLegacyDimension(searchParams.get("dimension")) || "";

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

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  const loadCareers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTestCode) params.testCode = filterTestCode;
      if (filterDimension) params.dimension = filterDimension;
      const { data } = await adminCareerAPI.getAll(params);
      setCareers(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Failed to load careers", loadError);
      setError("Không thể tải danh sách nghề nghiệp.");
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

    loadCareers();
  }, [filterDimension, filterTestCode]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const nextPrimary = allowedValues.includes(mapLegacyDimension(previous.primaryDimension))
        ? mapLegacyDimension(previous.primaryDimension)
        : allowedValues[0] || previous.primaryDimension;
      const nextSecondary = previous.secondaryDimension && allowedValues.includes(mapLegacyDimension(previous.secondaryDimension))
        ? mapLegacyDimension(previous.secondaryDimension)
        : "";

      if (
        nextPrimary === previous.primaryDimension &&
        nextSecondary === previous.secondaryDimension
      ) {
        return previous;
      }

      return {
        ...previous,
        primaryDimension: nextPrimary,
        secondaryDimension: nextSecondary,
      };
    });
  }, [dimensionOptionsForForm]);

  const resetForm = () => {
    const nextTestCode = filterTestCode || "DISC";
    setForm({
      ...initialForm,
      testCode: nextTestCode,
      primaryDimension: getDefaultDimension(nextTestCode),
      secondaryDimension: "",
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

  const handleEdit = (career) => {
    setForm({
      id: career.id,
      testCode: career.testCode || "DISC",
      primaryDimension: mapLegacyDimension(career.primaryDimension),
      secondaryDimension: career.secondaryDimension ? mapLegacyDimension(career.secondaryDimension) : "",
      jobTitle: career.jobTitle || "",
      matchLevel: Number(career.matchLevel ?? 50),
      summary: career.summary || "",
      skills: career.skills || "",
      learningResources: career.learningResources || "",
      active: career.active !== false,
      allowedPlanCodes: career.allowedPlanCodes || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildCareerPayload(form);
      if (form.id) {
        await adminCareerAPI.update(form.id, payload);
        toast.success("Đã cập nhật nghề nghiệp.");
      } else {
        await adminCareerAPI.create(payload);
        toast.success("Đã tạo nghề nghiệp mới.");
      }

      await loadCareers();
      closeModal();
    } catch (saveError) {
      console.error("Failed to save career", saveError);
      setError("Không thể lưu nghề nghiệp. Kiểm tra lại dữ liệu trước khi thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (career) => {
    try {
      await adminCareerAPI.update(
        career.id,
        buildCareerPayload(career, { active: career.active === false })
      );
      await loadCareers();
      toast.success(career.active === false ? "Đã bật nghề nghiệp." : "Đã tắt nghề nghiệp.");
    } catch (toggleError) {
      console.error("Failed to toggle career", toggleError);
      setError("Không thể cập nhật trạng thái nghề nghiệp.");
    }
  };

  const handleDelete = (id) => {
    setConfirmId(id);
  };

  const executeDelete = async (id) => {
    setDeleting(true);
    try {
      await adminCareerAPI.delete(id);
      await loadCareers();
      toast.success("Đã xoá nghề nghiệp.");
      if (form.id === id) {
        closeModal();
      }
    } catch (deleteError) {
      console.error("Failed to delete career", deleteError);
      setError("Không thể xoá nghề nghiệp.");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  const filteredCareers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return careers.filter((career) => {
      if (!keyword) return true;

      return [
        career.jobTitle,
        career.summary,
        career.skills,
        career.learningResources,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(keyword));
    });
  }, [careers, searchTerm]);

  const stats = useMemo(() => {
    const activeCount = careers.filter((career) => career.active !== false).length;
    const averageMatch = careers.length === 0
      ? 0
      : Math.round(careers.reduce((total, career) => total + Number(career.matchLevel || 0), 0) / careers.length);
    const premiumScoped = careers.filter(
      (career) => Array.isArray(career.allowedPlanCodes) && career.allowedPlanCodes.length > 0
    ).length;

    return {
      total: careers.length,
      active: activeCount,
      averageMatch,
      premiumScoped,
    };
  }, [careers]);

  const filterLabel = filterTestCode || "toàn bộ loại nội dung";

  return (
    <div className="space-y-6">
      <DiscContentTabs />

      <ContentHero
        icon={Briefcase}
        eyebrow="Admin Content"
        title="Bản đồ nghề nghiệp"
        description="Chuẩn hoá danh sách nghề phù hợp theo từng dimension, quản lý mức độ match và giới hạn hiển thị theo gói thuê bao trong cùng một giao diện."
        tone="amber"
        stats={[
          {
            label: "Tổng career",
            value: formatListCount(stats.total),
            hint: `Đang xem theo ${filterLabel.toLowerCase()}.`,
            icon: Briefcase,
            tone: "amber",
          },
          {
            label: "Đang bật",
            value: formatListCount(stats.active),
            hint: `${formatListCount(filteredCareers.length)} mục khớp bộ lọc hiện tại.`,
            icon: Sparkles,
            tone: "emerald",
          },
          {
            label: "Match trung bình",
            value: `${stats.averageMatch}%`,
            hint: "Dùng để rà soát độ phân bổ recommendation.",
            icon: Gauge,
            tone: "sky",
          },
          {
            label: "Có giới hạn gói",
            value: formatListCount(stats.premiumScoped),
            hint: "Các career chỉ hiển thị cho một số plan code cụ thể.",
            icon: Target,
            tone: "violet",
          },
        ]}
        actions={
          <button type="button" className="btn btn-primary gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Thêm career
          </button>
        }
      />

      <Surface className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr),200px,220px] xl:w-[78%]">
            <SearchField
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Tìm theo tên nghề, mô tả, kỹ năng hoặc tài nguyên..."
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <KeyValuePill label="Hiển thị" value={`${formatListCount(filteredCareers.length)} mục`} />
            <KeyValuePill label="Loại" value={filterTestCode || "Toàn bộ"} />
            <KeyValuePill
              label="Dimension"
              value={filterDimension || (filterTestCode ? "Toàn bộ" : "All")}
            />
          </div>
        </div>
      </Surface>

      {loading ? (
        <Surface className="flex min-h-[320px] items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </Surface>
      ) : filteredCareers.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Chưa có career phù hợp"
          description="Thử đổi bộ lọc hoặc tạo một mapping nghề nghiệp mới để bổ sung recommendation."
          action={
            <button type="button" className="btn btn-primary gap-2" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Tạo career đầu tiên
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredCareers.map((career) => {
            const detailCount = [career.summary, career.skills, career.learningResources].filter(Boolean).length;
            const planScoped = Array.isArray(career.allowedPlanCodes) && career.allowedPlanCodes.length > 0;

            return (
              <article
                key={career.id}
                className="rounded-[28px] border border-slate-200/70 bg-white/95 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(15,23,42,0.09)]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <DimensionBadge value={career.primaryDimension} compact />
                        {career.secondaryDimension ? (
                          <DimensionBadge value={career.secondaryDimension} compact />
                        ) : null}
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {career.testCode || "DISC"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-slate-950">{career.jobTitle}</h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                          {career.summary || "Chưa có mô tả tóm tắt cho nghề nghiệp này."}
                        </p>
                      </div>
                    </div>
                    <StatusBadge active={career.active !== false} />
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                      <span>Độ phù hợp</span>
                      <span className="text-base font-semibold text-slate-900">{career.matchLevel}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500"
                        style={{ width: `${Math.max(0, Math.min(100, Number(career.matchLevel || 0)))}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <KeyValuePill label="Nội dung" value={`${detailCount}/3`} />
                      <KeyValuePill label="Plan" value={planScoped ? "Giới hạn" : "Tất cả"} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {planScoped ? (
                      career.allowedPlanCodes.map((planCode) => (
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
                        checked={career.active !== false}
                        onChange={() => handleToggleActive(career)}
                      />
                      Hiển thị trong recommendation
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gap-2"
                        onClick={() => handleEdit(career)}
                      >
                        <Pencil className="h-4 w-4" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
                        onClick={() => handleDelete(career.id)}
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
        title={form.id ? "Chỉnh sửa career" : "Tạo career mới"}
        description="Chỉnh loại nội dung, dimension chính/phụ, độ phù hợp và giới hạn plan code trong cùng một biểu mẫu."
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>
              Huỷ
            </button>
            <button type="submit" form="career-form" className="btn btn-primary gap-2" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : <Plus className="h-4 w-4" />}
              {form.id ? "Lưu cập nhật" : "Tạo career"}
            </button>
          </div>
        }
      >
        <form id="career-form" className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                    <Briefcase className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Thông tin cốt lõi</h3>
                    <p className="text-sm text-slate-500">Tên nghề, loại nội dung, dimension và mức độ match.</p>
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
                          primaryDimension: getDefaultDimension(nextTestCode),
                          secondaryDimension: "",
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
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Tên nghề nghiệp</span>
                    <input
                      className="input input-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.jobTitle}
                      onChange={(event) => setForm((previous) => ({ ...previous, jobTitle: event.target.value }))}
                      placeholder="VD: Business Analyst"
                      required
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Primary dimension</span>
                    <select
                      className="select select-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.primaryDimension}
                      onChange={(event) => setForm((previous) => ({ ...previous, primaryDimension: event.target.value }))}
                      required
                    >
                      {dimensionOptionsForForm.map((dimension) => (
                        <option key={dimension.value} value={dimension.value}>
                          {dimension.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Secondary dimension</span>
                    <select
                      className="select select-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.secondaryDimension}
                      onChange={(event) => setForm((previous) => ({ ...previous, secondaryDimension: event.target.value }))}
                    >
                      <option value="">Không có</option>
                      {dimensionOptionsForForm.map((dimension) => (
                        <option key={dimension.value} value={dimension.value}>
                          {dimension.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Match level</p>
                      <p className="text-xs text-slate-500">Sử dụng để ưu tiên nghề trong recommendation.</p>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-slate-950">{form.matchLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.matchLevel}
                    className="range range-primary mt-4"
                    onChange={(event) => setForm((previous) => ({ ...previous, matchLevel: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Nội dung mô tả</h3>
                    <p className="text-sm text-slate-500">Thông tin dùng cho trang kết quả hoặc recommendation.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Tóm tắt</span>
                    <textarea
                      className="textarea textarea-bordered min-h-28 rounded-2xl border-slate-200 bg-white"
                      value={form.summary}
                      onChange={(event) => setForm((previous) => ({ ...previous, summary: event.target.value }))}
                      placeholder="Mô tả ngắn gọn vì sao nghề này phù hợp."
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Kỹ năng cần thiết</span>
                    <textarea
                      className="textarea textarea-bordered min-h-32 rounded-2xl border-slate-200 bg-white"
                      value={form.skills}
                      onChange={(event) => setForm((previous) => ({ ...previous, skills: event.target.value }))}
                      placeholder="- Tư duy hệ thống&#10;- Giao tiếp với stakeholder&#10;- Phân tích dữ liệu..."
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Tài nguyên học tập</span>
                    <textarea
                      className="textarea textarea-bordered min-h-24 rounded-2xl border-slate-200 bg-white"
                      value={form.learningResources}
                      onChange={(event) => setForm((previous) => ({ ...previous, learningResources: event.target.value }))}
                      placeholder="Khoá học, sách, mentor hoặc learning path."
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Target className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Phạm vi hiển thị</h3>
                    <p className="text-sm text-slate-500">Giới hạn career theo plan code khi cần.</p>
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
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Trạng thái phát hành</h3>
                    <p className="text-sm text-slate-500">Bật để career này được đưa vào luồng hiển thị.</p>
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Cho phép hiển thị</p>
                    <p className="text-xs text-slate-500">Ẩn khỏi recommendation nếu cần rà soát nội dung.</p>
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
        title="Xoá nghề nghiệp"
        description="Nghề nghiệp này sẽ bị xoá vĩnh viễn và không thể khôi phục."
        confirmLabel="Xoá nghề"
      />
    </div>
  );
};

export default CareerManagementPage;
