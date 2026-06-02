import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Download, Hash, Pencil, Plus, Scale, Tag, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import DiscContentTabs from "../../components/admin/DiscContentTabs";
import ConfirmModal from "../../components/common/ConfirmModal";
import api, { adminCatalogAPI } from "../../lib/api.js";
import { DISC_CONTENT_TEST_CODES, TEST_CODE_COPY } from "../../features/admin/disc-content/config.js";
import {
  ContentHero,
  EditorModal,
  EmptyState,
  KeyValuePill,
  SearchField,
  Surface,
} from "../../features/admin/disc-content/ui.jsx";
import { formatListCount } from "../../features/admin/disc-content/meta.js";

const QUESTION_PAGE_DEFAULT_TEST_CODE = "DISC_FREE";

const QUESTION_TEST_CODE_LABELS = {
  DISC_FREE: "DISC Free",
  DISC_PAID: "DISC Paid",
  BIG_FIVE: "Big Five",
  IKIGAI: "Ikigai",
};

const normalizeQuestionTestCode = (value) => {
  const normalizedValue = String(value || "").trim().toUpperCase();

  if (!normalizedValue || normalizedValue === "DISC") {
    return QUESTION_PAGE_DEFAULT_TEST_CODE;
  }

  return normalizedValue;
};

const isDiscQuestionBank = (value) => String(value || "").toUpperCase().startsWith("DISC");

const getQuestionTypeOptions = (currentValue) => {
  const options = DISC_CONTENT_TEST_CODES
    .filter((code) => code !== "DISC")
    .map((code) => ({
      value: code,
      label: QUESTION_TEST_CODE_LABELS[code] || code,
    }));

  const normalizedCurrentValue = normalizeQuestionTestCode(currentValue);
  if (normalizedCurrentValue && !options.some((option) => option.value === normalizedCurrentValue)) {
    options.push({
      value: normalizedCurrentValue,
      label: QUESTION_TEST_CODE_LABELS[normalizedCurrentValue] || normalizedCurrentValue,
    });
  }

  return options;
};

const initialForm = {
  id: null,
  testCode: QUESTION_PAGE_DEFAULT_TEST_CODE,
  categoryId: "",
  content: "",
  traitKey: "",
  reverseScored: false,
  weight: 1,
  orderIndex: 1,
  options: [
    { id: null, label: "Hoàn toàn không đồng ý", value: 1, discDimension: "", traitOverride: "", orderIndex: 1 },
    { id: null, label: "Không đồng ý", value: 2, discDimension: "", traitOverride: "", orderIndex: 2 },
    { id: null, label: "Phân vân", value: 3, discDimension: "", traitOverride: "", orderIndex: 3 },
    { id: null, label: "Đồng ý", value: 4, discDimension: "", traitOverride: "", orderIndex: 4 },
    { id: null, label: "Hoàn toàn đồng ý", value: 5, discDimension: "", traitOverride: "", orderIndex: 5 },
  ],
};

const traitOptions = [
  { label: "Theo trait của câu hỏi", value: "" },
  { label: "DISC_D", value: "DISC_D" },
  { label: "DISC_I", value: "DISC_I" },
  { label: "DISC_S", value: "DISC_S" },
  { label: "DISC_C", value: "DISC_C" },
  { label: "BIG5_O", value: "BIG5_O" },
  { label: "BIG5_C", value: "BIG5_C" },
  { label: "BIG5_E", value: "BIG5_E" },
  { label: "BIG5_A", value: "BIG5_A" },
  { label: "BIG5_N", value: "BIG5_N" },
  { label: "IKIGAI_LOVE", value: "IKIGAI_LOVE" },
  { label: "IKIGAI_SKILL", value: "IKIGAI_SKILL" },
  { label: "IKIGAI_NEED", value: "IKIGAI_NEED" },
  { label: "IKIGAI_PAID", value: "IKIGAI_PAID" },
];

const buildQuestionPayload = (record, getNextOrderIndex) => {
  const normalizedTestCode = normalizeQuestionTestCode(record.testCode);
  const normalizedWeight = isDiscQuestionBank(normalizedTestCode) ? 1 : Number(record.weight) || 1;
  const normalizedOrderIndex = isDiscQuestionBank(normalizedTestCode)
    ? Number(record.orderIndex) || getNextOrderIndex(normalizedTestCode)
    : Number(record.orderIndex) || 1;

  return {
    testCode: normalizedTestCode,
    categoryId: record.categoryId || null,
    content: record.content,
    traitKey: record.traitKey,
    reverseScored: Boolean(record.reverseScored),
    weight: normalizedWeight,
    orderIndex: normalizedOrderIndex,
    options: (record.options || []).map((option, index) => ({
      label: option.label?.trim() || `Lựa chọn ${index + 1}`,
      value: Number(option.value) || index + 1,
      discDimension: (option.discDimension || "").toUpperCase(),
      traitOverride: (option.traitOverride || "").toUpperCase(),
      orderIndex: index + 1,
    })),
  };
};

const QuestionManagementPage = () => {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { type: 'question'|'category', id }
  const [deleting, setDeleting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [testCode, setTestCode] = useState(() => normalizeQuestionTestCode(searchParams.get("testCode")));
  const [categories, setCategories] = useState([]);
  const [modalCategories, setModalCategories] = useState([]);
  const [weightValidation, setWeightValidation] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ id: null, name: "", weightPercent: 0 });
  const [savingCategory, setSavingCategory] = useState(false);

  const isDiscPage = isDiscQuestionBank(testCode);
  const isDiscModal = isDiscQuestionBank(form.testCode);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  const getNextOrderIndex = useCallback(
    (code) => {
      const relevantQuestions = questions.filter((question) => question.testCode === code);
      const maxOrder = relevantQuestions.reduce(
        (currentMax, question) => Math.max(currentMax, Number(question.orderIndex || 0)),
        0
      );
      return maxOrder + 1;
    },
    [questions]
  );

  const loadCategories = async (code) => {
    const [categoriesResult, validationResult] = await Promise.allSettled([
      adminCatalogAPI.listCategories({ testCode: code }),
      adminCatalogAPI.validateWeights(code),
    ]);

    if (categoriesResult.status === "fulfilled") {
      setCategories(categoriesResult.value.data || []);
    } else {
      console.error("Failed to load categories", categoriesResult.reason);
      setCategories([]);
    }

    if (validationResult.status === "fulfilled") {
      setWeightValidation(validationResult.value.data || null);
    } else {
      setWeightValidation(null);
    }
  };

  const loadModalCategories = async (code) => {
    if (!code) return;

    try {
      const { data } = await adminCatalogAPI.listCategories({ testCode: code });
      setModalCategories(data || []);
    } catch (loadError) {
      console.error("Failed to load modal categories", loadError);
      setModalCategories([]);
    }
  };

  const loadQuestions = async (code) => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/questions", { params: { testCode: code } });
      setQuestions(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Failed to load questions", loadError);
      setError("Không thể tải ngân hàng câu hỏi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(testCode);
    loadQuestions(testCode);
    setSearchParams((previous) => {
      const nextParams = new URLSearchParams(previous);
      nextParams.set("testCode", testCode);
      return nextParams;
    });
  }, [testCode, setSearchParams]);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    loadModalCategories(form.testCode);
    return undefined;
  }, [form.testCode, isModalOpen]);

  const resetCategoryForm = () => setCategoryForm({ id: null, name: "", weightPercent: 0 });

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setSavingCategory(true);

    try {
      const payload = {
        testCode,
        name: categoryForm.name,
        weightPercent: Number(categoryForm.weightPercent) || 0,
      };

      if (categoryForm.id) {
        await adminCatalogAPI.updateCategory(categoryForm.id, payload);
        toast.success("Đã cập nhật category.");
      } else {
        await adminCatalogAPI.createCategory(payload);
        toast.success("Đã tạo category mới.");
      }

      resetCategoryForm();
      await loadCategories(testCode);
    } catch (saveError) {
      console.error("Failed to save category", saveError);
      setError(saveError.response?.data?.message || "Không thể lưu category.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleCategoryEdit = (category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      weightPercent: category.weightPercent,
    });
  };

  const handleCategoryDelete = (id) => {
    setConfirmTarget({ type: 'category', id });
  };

  const executeCategoryDelete = async (id) => {
    setDeleting(true);
    try {
      await adminCatalogAPI.deleteCategory(id);
      toast.success("Đã xoá category.");
      if (categoryForm.id === id) {
        resetCategoryForm();
      }
      await loadCategories(testCode);
    } catch (deleteError) {
      console.error("Failed to delete category", deleteError);
      setError(deleteError.response?.data?.message || "Không thể xoá category.");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const categoriesById = useMemo(() => {
    return categories.reduce((accumulator, category) => {
      accumulator[category.id] = category;
      return accumulator;
    }, {});
  }, [categories]);

  const filteredQuestions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return questions.filter((question) => {
      const categoryName = question.categoryId ? categoriesById[question.categoryId]?.name || "" : "";
      const matchesSearch = !keyword
        || [question.content, question.traitKey, categoryName]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(keyword));
      const matchesCategory = filterCategory ? question.categoryId === filterCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [categoriesById, filterCategory, questions, searchTerm]);

  const resetForm = (nextTestCode = testCode) => {
    const normalizedNextTestCode = normalizeQuestionTestCode(nextTestCode);
    setForm({
      ...initialForm,
      testCode: normalizedNextTestCode,
      orderIndex: getNextOrderIndex(normalizedNextTestCode),
      options: initialForm.options.map((option, index) => ({
        ...option,
        orderIndex: index + 1,
      })),
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (question) => {
    const normalizedTestCode = normalizeQuestionTestCode(question.testCode);
    setForm({
      id: question.id,
      testCode: normalizedTestCode,
      categoryId: question.categoryId ?? "",
      content: question.content || "",
      traitKey: question.traitKey || "",
      reverseScored: question.reverseScored,
      weight: question.weight ?? 1,
      orderIndex: question.orderIndex ?? 1,
      options: (question.options && question.options.length > 0 ? question.options : initialForm.options).map((option, index) => ({
        id: option.id ?? null,
        label: option.label ?? option.content ?? "",
        value: option.value ?? option.score ?? index + 1,
        discDimension: option.discDimension || "",
        traitOverride: option.traitOverride || "",
        orderIndex: index + 1,
      })),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildQuestionPayload(form, getNextOrderIndex);

      if (form.id) {
        await api.put(`/admin/questions/${form.id}`, payload);
        toast.success("Đã cập nhật câu hỏi.");
      } else {
        await api.post("/admin/questions", payload);
        toast.success("Đã tạo câu hỏi mới.");
      }

      setTestCode(payload.testCode);
      await loadQuestions(payload.testCode);
      closeModal();
    } catch (saveError) {
      console.error("Failed to save question", saveError);
      setError(saveError.response?.data?.message || "Không thể lưu câu hỏi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmTarget({ type: 'question', id });
  };

  const executeDelete = async (id) => {
    setDeleting(true);
    try {
      await api.delete(`/admin/questions/${id}`);
      await loadQuestions(testCode);
      toast.success("Đã xoá câu hỏi.");
      if (form.id === id) {
        closeModal();
      }
    } catch (deleteError) {
      console.error("Failed to delete question", deleteError);
      setError("Không thể xoá câu hỏi.");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/admin/questions/export-template", {
        params: { testCode },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${testCode.toLowerCase()}_questions_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải file mẫu.");
    } catch (downloadError) {
      console.error("Failed to download template", downloadError);
      setError("Không thể tải file mẫu.");
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Vui lòng chọn tệp Excel (.xlsx hoặc .xls).");
      event.target.value = "";
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("testCode", testCode);

      const { data } = await api.post("/admin/questions/import", formData, {
        params: { testCode },
      });

      const importedCount = data.created ?? data.length ?? 0;
      setImportResult({
        success: true,
        fileName: file.name,
        count: importedCount,
      });
      toast.success(`Đã nhập ${importedCount} câu hỏi từ ${file.name}.`);
      await loadQuestions(testCode);
      event.target.value = "";
    } catch (importError) {
      console.error("Failed to import questions", importError);
      const message = importError.response?.data?.message || "Không thể nhập dữ liệu từ Excel.";
      setImportResult({
        success: false,
        fileName: file.name,
        error: message,
      });
      setError(message);
    } finally {
      setImporting(false);
    }
  };

  const totalWeight = weightValidation?.totalWeight ?? categories.reduce(
    (sum, category) => sum + Number(category.weightPercent || 0),
    0
  );
  const isWeightValid = weightValidation?.valid ?? totalWeight === 100;
  const categorizedCount = questions.filter((question) => Boolean(question.categoryId)).length;

  return (
    <div className="space-y-6">
      <DiscContentTabs />

      <ContentHero
        icon={ClipboardList}
        eyebrow="Admin Content"
        title="Ngân hàng câu hỏi"
        description={TEST_CODE_COPY[testCode] || "Quản lý bộ câu hỏi, category, trọng số và file import cho bộ DISC."}
        tone="emerald"
        stats={[
          {
            label: "Tổng câu hỏi",
            value: formatListCount(questions.length),
            hint: `${formatListCount(filteredQuestions.length)} mục khớp bộ lọc hiện tại.`,
            icon: ClipboardList,
            tone: "emerald",
          },
          {
            label: "Category",
            value: formatListCount(categories.length),
            hint: `${formatListCount(categorizedCount)} câu hỏi đã được gắn category.`,
            icon: Tag,
            tone: "sky",
          },
          {
            label: "Tổng trọng số",
            value: `${totalWeight}%`,
            hint: isWeightValid ? "Phân bổ category hợp lệ." : "Nên điều chỉnh về đúng 100%.",
            icon: Scale,
            tone: isWeightValid ? "violet" : "amber",
          },
          {
            label: "Import gần nhất",
            value: importResult?.success ? formatListCount(importResult.count) : "—",
            hint: importResult?.fileName || "Chưa có phiên import nào trong lượt làm việc này.",
            icon: Upload,
            tone: "amber",
          },
        ]}
        actions={
          <>
            <button type="button" className="btn btn-outline gap-2" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4" />
              Tải template
            </button>
            <button type="button" className="btn btn-primary gap-2" onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Thêm câu hỏi
            </button>
          </>
        }
      />

      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <Surface className="h-full p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Category manager</h2>
                <p className="mt-1 text-sm text-slate-500">Quản lý nhóm câu hỏi và phân bổ trọng số theo loại nội dung đang chọn.</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${isWeightValid
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
              >
                {isWeightValid ? "Weight OK" : "Need review"}
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleCategorySubmit}>
              <label className="form-control">
                <span className="label-text mb-2 text-sm font-semibold text-slate-700">Tên category</span>
                <input
                  className="input input-bordered rounded-2xl border-slate-200 bg-white"
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="VD: Lãnh đạo, Tư duy hệ thống"
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-2 text-sm font-semibold text-slate-700">Trọng số (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input input-bordered rounded-2xl border-slate-200 bg-white"
                  value={categoryForm.weightPercent}
                  onChange={(event) => setCategoryForm((previous) => ({ ...previous, weightPercent: event.target.value }))}
                  required
                />
              </label>

              <div className="flex items-center gap-3">
                <button type="submit" className="btn btn-primary flex-1" disabled={savingCategory}>
                  {savingCategory ? "Đang lưu..." : categoryForm.id ? "Cập nhật category" : "Thêm category"}
                </button>
                {categoryForm.id ? (
                  <button type="button" className="btn btn-ghost" onClick={resetCategoryForm}>
                    Huỷ
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap gap-2">
                <KeyValuePill label="Tổng weight" value={`${totalWeight}%`} />
                <KeyValuePill label="Category" value={formatListCount(categories.length)} />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có category nào cho loại nội dung này.</p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-[22px] border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{category.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{category.weightPercent}% trọng số</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCategoryEdit(category)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                          onClick={() => handleCategoryDelete(category.id)}
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Surface>

          <Surface className="h-full p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Nhập từ Excel</h2>
                <p className="mt-1 text-sm text-slate-500">Tải template đúng loại nội dung và import nhanh để cập nhật hàng loạt.</p>
              </div>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {testCode}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button type="button" className="btn btn-outline w-full gap-2" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4" />
                Tải file mẫu
              </button>

              <label className="btn btn-primary w-full gap-2">
                {importing ? <span className="loading loading-spinner loading-sm" /> : <Upload className="h-4 w-4" />}
                {importing ? "Đang xử lý..." : "Chọn file để import"}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImportExcel}
                  disabled={importing}
                />
              </label>
            </div>

            <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              {importResult ? (
                <div className="space-y-2">
                  <p className={`text-sm font-semibold ${importResult.success ? "text-emerald-700" : "text-rose-700"}`}>
                    {importResult.success ? "Import thành công" : "Import thất bại"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {importResult.success
                      ? `${importResult.count} câu hỏi từ ${importResult.fileName}.`
                      : importResult.error}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Chưa có phiên import nào trong lượt làm việc này.</p>
              )}
            </div>
          </Surface>
        </div>

        <div className="space-y-6">
          <Surface className="p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr),220px,220px] xl:w-[78%]">
                <SearchField
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Tìm theo nội dung câu hỏi, trait hoặc category..."
                />
                <select
                  className="select select-bordered h-full rounded-2xl border-slate-200 bg-white"
                  value={testCode}
                  onChange={(event) => setTestCode(normalizeQuestionTestCode(event.target.value))}
                >
                  {getQuestionTypeOptions(testCode).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="select select-bordered h-full rounded-2xl border-slate-200 bg-white"
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value)}
                >
                  <option value="">Tất cả category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <KeyValuePill label="Hiển thị" value={`${formatListCount(filteredQuestions.length)} câu`} />
                <KeyValuePill label="Loại" value={testCode} />
                <KeyValuePill label="Category" value={filterCategory ? categoriesById[filterCategory]?.name || "Đã chọn" : "Toàn bộ"} />
              </div>
            </div>
          </Surface>

          {loading ? (
            <Surface className="flex min-h-[320px] items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary" />
            </Surface>
          ) : filteredQuestions.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Chưa có câu hỏi phù hợp"
              description="Thử đổi loại nội dung hoặc tạo thêm câu hỏi cho phạm vi hiện tại."
              action={
                <button type="button" className="btn btn-primary gap-2" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  Tạo câu hỏi đầu tiên
                </button>
              }
            />
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {filteredQuestions.map((question) => (
                <article
                  key={question.id}
                  className="rounded-[28px] border border-slate-200/70 bg-white/95 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(15,23,42,0.09)]"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">
                            {question.traitKey}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {question.testCode}
                          </span>
                          {question.categoryId ? (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                              {categoriesById[question.categoryId]?.name || "Category"}
                            </span>
                          ) : null}
                        </div>
                        <p className="line-clamp-4 text-sm leading-6 text-slate-700">{question.content}</p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-wrap gap-2">
                        <KeyValuePill label="Options" value={formatListCount(question.options?.length || 0)} />
                        {!isDiscPage ? (
                          <>
                            <KeyValuePill label="Order" value={question.orderIndex} />
                            <KeyValuePill label="Weight" value={question.weight} />
                          </>
                        ) : null}
                        {question.reverseScored ? <KeyValuePill label="Scoring" value="Reverse" /> : null}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(question.options || []).slice(0, 3).map((option) => (
                          <span
                            key={option.id || `${question.id}-${option.orderIndex}`}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                          >
                            {option.label}
                          </span>
                        ))}
                        {(question.options || []).length > 3 ? (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                            +{question.options.length - 3} lựa chọn
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gap-2"
                        onClick={() => handleEdit(question)}
                      >
                        <Pencil className="h-4 w-4" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
                        onClick={() => handleDelete(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Xoá
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditorModal
        open={isModalOpen}
        onClose={closeModal}
        title={form.id ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi mới"}
        description="Thiết lập loại câu hỏi, trait, category, scoring rule và danh sách lựa chọn trong cùng một editor."
        maxWidth="max-w-6xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>
              Huỷ
            </button>
            <button type="submit" form="question-form" className="btn btn-primary gap-2" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : <Plus className="h-4 w-4" />}
              {form.id ? "Lưu cập nhật" : "Tạo câu hỏi"}
            </button>
          </div>
        }
      >
        <form id="question-form" className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Cấu hình câu hỏi</h3>
                    <p className="text-sm text-slate-500">Chọn loại câu hỏi, trait, category và quy tắc chấm điểm.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Loại câu hỏi</span>
                    <select
                      className="select select-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.testCode}
                      onChange={(event) => {
                        const nextTestCode = normalizeQuestionTestCode(event.target.value);
                        setForm((previous) => ({
                          ...previous,
                          testCode: nextTestCode,
                          categoryId: "",
                          orderIndex: getNextOrderIndex(nextTestCode),
                          weight: isDiscQuestionBank(nextTestCode) ? 1 : previous.weight,
                        }));
                      }}
                      required
                    >
                      {getQuestionTypeOptions(form.testCode).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Category</span>
                    <select
                      className="select select-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.categoryId}
                      onChange={(event) => setForm((previous) => ({ ...previous, categoryId: event.target.value }))}
                    >
                      <option value="">Chưa gán category</option>
                      {modalCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-control md:col-span-2">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Nội dung câu hỏi</span>
                    <textarea
                      className="textarea textarea-bordered min-h-28 rounded-2xl border-slate-200 bg-white"
                      value={form.content}
                      onChange={(event) => setForm((previous) => ({ ...previous, content: event.target.value }))}
                      placeholder="Nhập nội dung câu hỏi..."
                      required
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text mb-2 text-sm font-semibold text-slate-700">Trait key</span>
                    <input
                      className="input input-bordered rounded-2xl border-slate-200 bg-white"
                      value={form.traitKey}
                      onChange={(event) => setForm((previous) => ({ ...previous, traitKey: event.target.value }))}
                      placeholder="VD: DISC_D / BIG5_O / IKIGAI_LOVE"
                      required
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Reverse scored</p>
                      <p className="text-xs text-slate-500">Bật nếu thang điểm cần đảo chiều khi tính kết quả.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={form.reverseScored}
                      onChange={(event) => setForm((previous) => ({ ...previous, reverseScored: event.target.checked }))}
                    />
                  </label>
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  {isDiscModal ? (
                    <p className="text-sm leading-6 text-slate-600">
                      Với <span className="font-semibold text-slate-900">DISC</span>, trọng số mặc định là <strong>1</strong>. Thứ tự câu hỏi sẽ tự lấy theo thứ tự hiện có nếu bạn để trống.
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="form-control">
                        <span className="label-text mb-2 text-sm font-semibold text-slate-700">Order index</span>
                        <input
                          type="number"
                          min="1"
                          className="input input-bordered rounded-2xl border-slate-200 bg-white"
                          value={form.orderIndex}
                          onChange={(event) => setForm((previous) => ({ ...previous, orderIndex: event.target.value }))}
                          required
                        />
                      </label>

                      <label className="form-control">
                        <span className="label-text mb-2 text-sm font-semibold text-slate-700">Weight</span>
                        <input
                          type="number"
                          min="0.0001"
                          step="0.0001"
                          className="input input-bordered rounded-2xl border-slate-200 bg-white"
                          value={form.weight}
                          onChange={(event) => setForm((previous) => ({
                            ...previous,
                            weight: event.target.value.replace(",", "."),
                          }))}
                          required
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                      <Hash className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">Lựa chọn trả lời</h3>
                      <p className="text-sm text-slate-500">Mỗi lựa chọn có score và trait override riêng nếu cần.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm gap-2"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        options: [
                          ...(previous.options || []),
                          {
                            id: null,
                            label: `Lựa chọn ${(previous.options || []).length + 1}`,
                            value: Math.min(5, (previous.options || []).length + 1),
                            discDimension: "",
                            traitOverride: "",
                            orderIndex: (previous.options || []).length + 1,
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Thêm đáp án
                  </button>
                </div>

                <div className="space-y-4">
                  {(form.options || []).map((option, index) => (
                    <div
                      key={option.id || `${form.id || "new"}-${index}`}
                      className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),120px]">
                        <label className="form-control">
                          <span className="label-text mb-2 text-sm font-semibold text-slate-700">Nội dung đáp án</span>
                          <input
                            className="input input-bordered rounded-2xl border-slate-200 bg-white"
                            value={option.label}
                            onChange={(event) => {
                              const nextLabel = event.target.value;
                              setForm((previous) => {
                                const nextOptions = [...previous.options];
                                nextOptions[index] = { ...nextOptions[index], label: nextLabel };
                                return { ...previous, options: nextOptions };
                              });
                            }}
                            required
                          />
                        </label>

                        <label className="form-control">
                          <span className="label-text mb-2 text-sm font-semibold text-slate-700">Score</span>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="1"
                            className="input input-bordered rounded-2xl border-slate-200 bg-white"
                            value={option.value}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setForm((previous) => {
                                const nextOptions = [...previous.options];
                                nextOptions[index] = { ...nextOptions[index], value: nextValue };
                                return { ...previous, options: nextOptions };
                              });
                            }}
                            required
                          />
                        </label>
                      </div>

                      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <label className="form-control md:min-w-[260px]">
                          <span className="label-text mb-2 text-sm font-semibold text-slate-700">Trait override</span>
                          <select
                            className="select select-bordered rounded-2xl border-slate-200 bg-white"
                            value={option.traitOverride || ""}
                            onChange={(event) => {
                              const nextTrait = event.target.value;
                              setForm((previous) => {
                                const nextOptions = [...previous.options];
                                nextOptions[index] = {
                                  ...nextOptions[index],
                                  traitOverride: nextTrait,
                                  discDimension: nextTrait.startsWith("DISC_")
                                    ? nextTrait.replace("DISC_", "")
                                    : nextOptions[index].discDimension,
                                };
                                return { ...previous, options: nextOptions };
                              });
                            }}
                          >
                            {traitOptions.map((trait) => (
                              <option key={trait.value || "default"} value={trait.value}>
                                {trait.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        {form.options.length > 2 ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
                            onClick={() =>
                              setForm((previous) => ({
                                ...previous,
                                options: previous.options.filter((_, optionIndex) => optionIndex !== index),
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            Xoá đáp án
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </EditorModal>

      <ConfirmModal
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (!confirmTarget) return;
          if (confirmTarget.type === 'question') executeDelete(confirmTarget.id);
          else executeCategoryDelete(confirmTarget.id);
        }}
        loading={deleting}
        title={confirmTarget?.type === 'category' ? "Xoá category" : "Xoá câu hỏi"}
        description={
          confirmTarget?.type === 'category'
            ? "Category này sẽ bị xoá vĩnh viễn. Các câu hỏi đã gắn category này sẽ không bị xoá."
            : "Câu hỏi này sẽ bị xoá vĩnh viễn và không thể khôi phục."
        }
        confirmLabel={confirmTarget?.type === 'category' ? "Xoá category" : "Xoá câu hỏi"}
      />
    </div>
  );
};

export default QuestionManagementPage;
