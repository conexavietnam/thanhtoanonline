import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Download, Pencil, Plus, Save, Trash2, Upload } from "lucide-react";
import {
  PDF_VARIABLE_PROFILE_TYPES,
  formatPdfVariableToken,
  getPdfVariableDefaults,
  getPdfVariableMetricLabel,
  getPdfVariableMetricOptions,
  getPdfVariableProfileMeta,
  normalizePdfCustomVariables,
  normalizePdfVariableMetric,
  normalizePdfVariableProfileType,
  parsePdfVariableOptions,
  serializePdfCustomVariables,
  variableOptionsToTextarea,
} from "../pdfVariableUtils.js";

const PROFILE_BADGE_CLASS = {
  DISC: "badge-primary",
  BIG5: "badge-info",
  IKIGAI: "badge-accent",
};

const TOKEN_PLACEHOLDER = {
  DISC: "{disc_chinh}",
  BIG5: "{big5_noi_bat}",
  IKIGAI: "{ikigai_dinh_huong}",
};

const createEmptyDraft = (profileType = "DISC") => {
  const defaults = getPdfVariableDefaults(profileType);
  return {
    id: null,
    token: "",
    profileType,
    primaryMetric: defaults.primaryMetric,
    primaryMin: "",
    primaryMax: "",
    secondaryMetric: defaults.secondaryMetric,
    secondaryMin: "",
    secondaryMax: "",
    optionsText: "",
  };
};

const escapeCsvCell = (value) => {
  const text = `${value ?? ""}`;
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const parseCsvRow = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
};

const normalizeHeaderKey = (value) => `${value ?? ""}`.trim().toLowerCase().replace(/[\s_-]+/g, "");

const formatRangeValue = (value, fallback) => (value === "" || value === null || value === undefined ? fallback : value);

const buildConditionSummary = (item, slot) => {
  const profileMeta = getPdfVariableProfileMeta(item.profileType);
  const metric = slot === "primary" ? item.primaryMetric : item.secondaryMetric;
  const min = slot === "primary" ? item.primaryMin : item.secondaryMin;
  const max = slot === "primary" ? item.primaryMax : item.secondaryMax;

  if (!metric) {
    return "Không dùng";
  }

  return `${getPdfVariableMetricLabel(item.profileType, metric)}: ${formatRangeValue(min, profileMeta.minPlaceholder)} - ${formatRangeValue(max, profileMeta.maxPlaceholder)}`;
};

const getCellValue = (row, headerMap, aliases) => {
  for (const alias of aliases) {
    const index = headerMap[normalizeHeaderKey(alias)];
    if (index !== undefined) {
      return row[index] ?? "";
    }
  }
  return "";
};

const PdfVariableManager = ({ variables, onSave, loading, onClose }) => {
  const fileInputRef = useRef(null);
  const [items, setItems] = useState(() => normalizePdfCustomVariables(variables));
  const [draft, setDraft] = useState(createEmptyDraft());
  const [selectedId, setSelectedId] = useState(null);
  const [savingLocal, setSavingLocal] = useState(false);

  useEffect(() => {
    const normalized = normalizePdfCustomVariables(variables);
    setItems(normalized);
    if (!normalized.some((item) => item.id === selectedId)) {
      setSelectedId(null);
      setDraft(createEmptyDraft());
    }
  }, [variables, selectedId]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  );

  const profileMeta = getPdfVariableProfileMeta(draft.profileType);
  const primaryMetricOptions = getPdfVariableMetricOptions(draft.profileType);
  const secondaryMetricOptions = getPdfVariableMetricOptions(draft.profileType);

  const resetDraft = (profileType = "DISC") => {
    setSelectedId(null);
    setDraft(createEmptyDraft(profileType));
  };

  const loadDraft = (item) => {
    setSelectedId(item.id);
    setDraft({
      id: item.id,
      token: item.token,
      profileType: item.profileType,
      primaryMetric: item.primaryMetric,
      primaryMin: item.primaryMin,
      primaryMax: item.primaryMax,
      secondaryMetric: item.secondaryMetric,
      secondaryMin: item.secondaryMin,
      secondaryMax: item.secondaryMax,
      optionsText: variableOptionsToTextarea(item),
    });
  };

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileTypeChange = (nextType) => {
    const normalizedType = normalizePdfVariableProfileType(nextType);
    const defaults = getPdfVariableDefaults(normalizedType);

    setDraft((prev) => ({
      ...prev,
      profileType: normalizedType,
      primaryMetric: defaults.primaryMetric,
      primaryMin: "",
      primaryMax: "",
      secondaryMetric: defaults.secondaryMetric,
      secondaryMin: "",
      secondaryMax: "",
    }));
  };

  const validateDraft = () => {
    const token = draft.token.trim();
    if (!token) {
      toast.error("Tên biến không được để trống");
      return null;
    }

    const profileType = normalizePdfVariableProfileType(draft.profileType);
    const primaryMetric = normalizePdfVariableMetric(profileType, draft.primaryMetric);
    const secondaryMetric = normalizePdfVariableMetric(profileType, draft.secondaryMetric);

    if (!primaryMetric) {
      toast.error("Cần chọn điều kiện chính cho biến");
      return null;
    }

    const options = parsePdfVariableOptions(draft.optionsText);
    if (!options.length) {
      toast.error("Cần ít nhất một nội dung cho biến");
      return null;
    }

    const toNumber = (value) => (value === "" ? "" : Number(value));
    const primaryMin = toNumber(draft.primaryMin);
    const primaryMax = toNumber(draft.primaryMax);
    const secondaryMin = toNumber(draft.secondaryMin);
    const secondaryMax = toNumber(draft.secondaryMax);

    if (primaryMin !== "" && primaryMax !== "" && primaryMin > primaryMax) {
      toast.error("Điều kiện chính: Min phải nhỏ hơn hoặc bằng Max");
      return null;
    }

    if (secondaryMetric === "" && (secondaryMin !== "" || secondaryMax !== "")) {
      toast.error("Điều kiện phụ cần chọn chỉ số trước khi nhập Min/Max");
      return null;
    }

    if (secondaryMin !== "" && secondaryMax !== "" && secondaryMin > secondaryMax) {
      toast.error("Điều kiện phụ: Min phải nhỏ hơn hoặc bằng Max");
      return null;
    }

    return {
      id: draft.id || `pdf-var-${Date.now()}`,
      token,
      profileType,
      primaryMetric,
      primaryMin,
      primaryMax,
      secondaryMetric,
      secondaryMin,
      secondaryMax,
      options,
    };
  };

  const handleSaveRow = () => {
    const nextItem = validateDraft();
    if (!nextItem) return;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === nextItem.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = nextItem;
        return next;
      }
      return [...prev, nextItem];
    });

    setSelectedId(nextItem.id);
    setDraft((prev) => ({
      ...prev,
      id: nextItem.id,
      token: nextItem.token,
      profileType: nextItem.profileType,
      primaryMetric: nextItem.primaryMetric,
      primaryMin: nextItem.primaryMin,
      primaryMax: nextItem.primaryMax,
      secondaryMetric: nextItem.secondaryMetric,
      secondaryMin: nextItem.secondaryMin,
      secondaryMax: nextItem.secondaryMax,
      optionsText: nextItem.options.join("\n"),
    }));
    toast.success(draft.id ? "Đã cập nhật biến" : "Đã thêm biến mới");
  };

  const handleDelete = (id) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;
    if (!window.confirm(`Xóa biến ${formatPdfVariableToken(target.token)}?`)) return;

    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) {
      resetDraft();
    }
  };

  const handlePersist = async () => {
    if (!onSave) return;

    setSavingLocal(true);
    try {
      await onSave({ pdfCustomVariables: serializePdfCustomVariables(items) });
      toast.success("Đã lưu danh sách biến");
    } catch (error) {
      toast.error(`Không thể lưu biến: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      setSavingLocal(false);
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ["token", "profileType", "primaryMetric", "primaryMin", "primaryMax", "secondaryMetric", "secondaryMin", "secondaryMax", "options"],
      ...items.map((item) => [
        formatPdfVariableToken(item.token),
        item.profileType,
        item.primaryMetric,
        item.primaryMin,
        item.primaryMax,
        item.secondaryMetric,
        item.secondaryMin,
        item.secondaryMax,
        item.options.join(" | "),
      ]),
    ];

    const csv = `\uFEFF${rows
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n")}`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pdf-custom-variables.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/g)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length <= 1) {
        toast.error("File import không có dữ liệu hợp lệ");
        return;
      }

      const headerRow = parseCsvRow(lines[0]);
      const headerMap = headerRow.reduce((acc, header, index) => {
        acc[normalizeHeaderKey(header)] = index;
        return acc;
      }, {});

      const imported = lines.slice(1).map((line, index) => {
        const row = parseCsvRow(line);
        return {
          id: `pdf-var-import-${Date.now()}-${index}`,
          token: getCellValue(row, headerMap, ["token", "name", "key"]),
          profileType: getCellValue(row, headerMap, ["profileType", "sourceType", "profile", "type"]),
          primaryMetric: getCellValue(row, headerMap, ["primaryMetric", "primaryGroup", "discMain"]),
          primaryMin: getCellValue(row, headerMap, ["primaryMin"]),
          primaryMax: getCellValue(row, headerMap, ["primaryMax"]),
          secondaryMetric: getCellValue(row, headerMap, ["secondaryMetric", "secondaryGroup", "discSecondary"]),
          secondaryMin: getCellValue(row, headerMap, ["secondaryMin"]),
          secondaryMax: getCellValue(row, headerMap, ["secondaryMax"]),
          options: getCellValue(row, headerMap, ["options", "content", "contents", "contentText"]),
        };
      });

      const normalized = normalizePdfCustomVariables(imported);
      if (!normalized.length) {
        toast.error("Không đọc được biến nào từ file");
        return;
      }

      setItems((prev) => [...prev, ...normalized]);
      toast.success(`Đã import ${normalized.length} biến`);
    } catch (error) {
      toast.error(`Import thất bại: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="flex h-full flex-col bg-base-100">
      <div className="flex items-center justify-between border-b border-base-200 bg-base-100 px-6 py-4">
        <div>
          <h2 className="text-2xl font-bold">Quản lý biến PDF</h2>
          <p className="text-sm text-base-content/60">
            Tạo biến theo điều kiện DISC, Big Five hoặc IKIGAI để dùng lại trong PDF template.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <button type="button" className="btn btn-sm btn-outline" onClick={() => resetDraft(draft.profileType)}>
            <Plus className="h-4 w-4" /> Thêm biến mới
          </button>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button type="button" className="btn btn-sm btn-outline" onClick={handleExportCsv} disabled={!items.length}>
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={handlePersist} disabled={loading || savingLocal}>
            <Save className="h-4 w-4" /> Lưu hệ thống
          </button>
          {onClose && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
              Đóng
            </button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="min-h-0 overflow-auto border-r border-base-200 bg-base-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Danh sách biến</h3>
              <p className="text-sm text-base-content/55">Mỗi dòng là một rule nội dung có thể tái sử dụng trong editor.</p>
            </div>
            <span className="badge badge-neutral">{items.length} biến</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-base-200 bg-base-100 shadow-sm">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên biến</th>
                  <th>Nguồn</th>
                  <th>Điều kiện áp dụng</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-base-content/50">
                      Chưa có biến nào. Tạo một biến ở form bên phải.
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={selectedItem?.id === item.id ? "bg-primary/5" : ""}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <div className="font-medium">{formatPdfVariableToken(item.token)}</div>
                      <div className="text-xs text-base-content/55">{item.options.length} nội dung</div>
                    </td>
                    <td>
                      <span className={`badge badge-outline ${PROFILE_BADGE_CLASS[item.profileType] || "badge-neutral"}`}>
                        {PDF_VARIABLE_PROFILE_TYPES.find((type) => type.value === item.profileType)?.label || item.profileType}
                      </span>
                    </td>
                    <td>
                      <div className="space-y-1 text-sm">
                        <div>{buildConditionSummary(item, "primary")}</div>
                        <div className="text-base-content/55">{buildConditionSummary(item, "secondary")}</div>
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-xs btn-ghost" onClick={() => loadDraft(item)}>
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-h-0 overflow-auto bg-base-100 p-6">
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="rounded-[28px] border border-base-200 bg-base-100 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
              <div className="mb-6">
                <h3 className="text-3xl font-semibold">{draft.id ? "Cập nhật biến" : "Thêm biến mới"}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/60">
                  Một biến có thể chứa nhiều nội dung. Hệ thống sẽ chọn ngẫu nhiên một nội dung khi rule khớp với dữ liệu DISC, Big Five hoặc IKIGAI.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.16em] text-base-content/45">Nguồn điều kiện</span>
                    <span className="text-xs text-base-content/45">{profileMeta.description}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {PDF_VARIABLE_PROFILE_TYPES.map((type) => {
                      const active = draft.profileType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleProfileTypeChange(type.value)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            active
                              ? "border-primary bg-primary/8 shadow-sm"
                              : "border-base-200 bg-base-50 hover:border-base-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold">{type.label}</span>
                            <span className={`badge badge-sm badge-outline ${PROFILE_BADGE_CLASS[type.value] || "badge-neutral"}`}>
                              {type.value}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-5 text-base-content/60">{type.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <label className="form-control">
                    <span className="label-text mb-2 font-medium">Tên biến</span>
                    <input
                      type="text"
                      className="input input-bordered input-lg"
                      placeholder={TOKEN_PLACEHOLDER[draft.profileType] || "{ten_bien}"}
                      value={draft.token}
                      onChange={(event) => updateDraft("token", event.target.value)}
                    />
                  </label>

                  <div className="rounded-2xl border border-base-200 bg-base-50 px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-base-content/45">Token dùng trong editor</div>
                    <div className="mt-2 text-xl font-semibold">{formatPdfVariableToken(draft.token) || "{ten_bien}"}</div>
                    <p className="mt-2 text-sm leading-5 text-base-content/60">
                      Sau khi lưu, token này sẽ xuất hiện trong danh sách data source của PDF editor.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-base-200 bg-base-50 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-base font-semibold">{profileMeta.primaryLabel}</div>
                        <div className="text-sm text-base-content/55">{profileMeta.rangeLabel} dùng để match nội dung này.</div>
                      </div>
                      <span className="badge badge-ghost">Bắt buộc</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_0.7fr_0.7fr]">
                      <label className="form-control">
                        <span className="label-text mb-2 font-medium">Chỉ số</span>
                        <select
                          className="select select-bordered select-lg"
                          value={draft.primaryMetric}
                          onChange={(event) => updateDraft("primaryMetric", event.target.value)}
                        >
                          {primaryMetricOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="form-control">
                        <span className="label-text mb-2 font-medium">Min</span>
                        <input
                          type="number"
                          step={profileMeta.step}
                          className="input input-bordered input-lg"
                          placeholder={profileMeta.minPlaceholder}
                          value={draft.primaryMin}
                          onChange={(event) => updateDraft("primaryMin", event.target.value)}
                        />
                      </label>

                      <label className="form-control">
                        <span className="label-text mb-2 font-medium">Max</span>
                        <input
                          type="number"
                          step={profileMeta.step}
                          className="input input-bordered input-lg"
                          placeholder={profileMeta.maxPlaceholder}
                          value={draft.primaryMax}
                          onChange={(event) => updateDraft("primaryMax", event.target.value)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-base-200 bg-base-50 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-base font-semibold">{profileMeta.secondaryLabel}</div>
                        <div className="text-sm text-base-content/55">Có thể bỏ trống nếu chỉ cần một điều kiện.</div>
                      </div>
                      <span className="badge badge-outline">Tuỳ chọn</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_0.7fr_0.7fr]">
                      <label className="form-control">
                        <span className="label-text mb-2 font-medium">Chỉ số</span>
                        <select
                          className="select select-bordered select-lg"
                          value={draft.secondaryMetric}
                          onChange={(event) => updateDraft("secondaryMetric", event.target.value)}
                        >
                          <option value="">Không dùng</option>
                          {secondaryMetricOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="form-control">
                        <span className="label-text mb-2 font-medium">Min</span>
                        <input
                          type="number"
                          step={profileMeta.step}
                          className="input input-bordered input-lg"
                          placeholder={profileMeta.minPlaceholder}
                          value={draft.secondaryMin}
                          onChange={(event) => updateDraft("secondaryMin", event.target.value)}
                        />
                      </label>

                      <label className="form-control">
                        <span className="label-text mb-2 font-medium">Max</span>
                        <input
                          type="number"
                          step={profileMeta.step}
                          className="input input-bordered input-lg"
                          placeholder={profileMeta.maxPlaceholder}
                          value={draft.secondaryMax}
                          onChange={(event) => updateDraft("secondaryMax", event.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <label className="form-control">
                  <span className="label-text mb-2 font-medium">Nội dung</span>
                  <textarea
                    className="textarea textarea-bordered min-h-56 text-base leading-7"
                    placeholder={"Mỗi dòng là một nội dung, hoặc ngăn cách bằng dấu |\nVí dụ:\nBạn chủ động và quyết đoán\nBạn tạo nhịp rất nhanh cho tập thể"}
                    value={draft.optionsText}
                    onChange={(event) => updateDraft("optionsText", event.target.value)}
                  />
                </label>

                <div className="rounded-2xl border border-info/30 bg-info/10 px-4 py-4 text-sm leading-6 text-base-content/75">
                  <div className="font-semibold">
                    Dùng trong PDF editor với token <strong>{formatPdfVariableToken(draft.token) || "{ten_bien}"}</strong>.
                  </div>
                  <div className="mt-1">
                    Rule hiện tại đọc theo <strong>{PDF_VARIABLE_PROFILE_TYPES.find((type) => type.value === draft.profileType)?.label || draft.profileType}</strong>.
                    Khi export PDF, hệ thống sẽ chọn 1 nội dung ngẫu nhiên trong danh sách phù hợp với điều kiện bạn đã cấu hình.
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn btn-primary min-w-52 flex-1 sm:flex-none" onClick={handleSaveRow}>
                    <Save className="h-4 w-4" />
                    {draft.id ? "Cập nhật biến" : "Thêm biến mới"}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => resetDraft(draft.profileType)}>
                    Làm mới form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PdfVariableManager;
