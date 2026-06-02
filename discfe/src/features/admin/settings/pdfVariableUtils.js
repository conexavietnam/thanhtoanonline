export const PDF_VARIABLE_PROFILE_TYPES = [
  {
    value: "DISC",
    label: "DISC",
    description: "Match theo nhóm chính/phụ và phần trăm DISC.",
  },
  {
    value: "BIG5",
    label: "Big Five",
    description: "Match theo điểm 5 đặc điểm tính cách.",
  },
  {
    value: "IKIGAI",
    label: "IKIGAI",
    description: "Match theo 4 trụ cột định hướng nghề nghiệp.",
  },
];

export const PDF_VARIABLE_METRIC_OPTIONS = {
  DISC: [
    { value: "D", label: "D" },
    { value: "I", label: "I" },
    { value: "S", label: "S" },
    { value: "C", label: "C" },
  ],
  BIG5: [
    { value: "openness", label: "Openness" },
    { value: "conscientiousness", label: "Conscientiousness" },
    { value: "extraversion", label: "Extraversion" },
    { value: "agreeableness", label: "Agreeableness" },
    { value: "neuroticism", label: "Neuroticism" },
  ],
  IKIGAI: [
    { value: "passion", label: "Passion" },
    { value: "strength", label: "Strength" },
    { value: "value", label: "Value" },
    { value: "opportunity", label: "Opportunity" },
  ],
};

const PDF_VARIABLE_PROFILE_META = {
  DISC: {
    primaryLabel: "Nhóm DISC chính",
    secondaryLabel: "Nhóm DISC phụ",
    rangeLabel: "Phần trăm",
    minPlaceholder: "0",
    maxPlaceholder: "100",
    step: "1",
    description: "Phù hợp khi bạn muốn bám theo nhóm đứng đầu và nhóm hỗ trợ trong kết quả DISC.",
  },
  BIG5: {
    primaryLabel: "Chỉ số Big Five 1",
    secondaryLabel: "Chỉ số Big Five 2",
    rangeLabel: "Điểm",
    minPlaceholder: "0",
    maxPlaceholder: "5",
    step: "0.1",
    description: "Phù hợp khi nội dung phụ thuộc vào mức độ nổi bật của từng trait Big Five.",
  },
  IKIGAI: {
    primaryLabel: "Chỉ số IKIGAI 1",
    secondaryLabel: "Chỉ số IKIGAI 2",
    rangeLabel: "Điểm",
    minPlaceholder: "0",
    maxPlaceholder: "5",
    step: "0.1",
    description: "Phù hợp khi nội dung phụ thuộc vào các trụ cột Passion, Strength, Value, Opportunity.",
  },
};

const PDF_VARIABLE_DEFAULTS = {
  DISC: {
    primaryMetric: "D",
    secondaryMetric: "I",
  },
  BIG5: {
    primaryMetric: "openness",
    secondaryMetric: "",
  },
  IKIGAI: {
    primaryMetric: "passion",
    secondaryMetric: "",
  },
};

const normalizeProfileTypeValue = (value) => {
  const normalized = `${value ?? ""}`.trim().toUpperCase().replace(/[\s_-]+/g, "");
  if (normalized === "BIGFIVE" || normalized === "BIG5") return "BIG5";
  if (normalized === "IKIGAI") return "IKIGAI";
  return "DISC";
};

const canonicalBigFiveMetric = (value) => {
  const normalized = `${value ?? ""}`.trim().toUpperCase().replace(/[\s_-]+/g, "");
  switch (normalized) {
    case "O":
    case "OPENNESS":
      return "openness";
    case "C":
    case "CONSCIENTIOUSNESS":
      return "conscientiousness";
    case "E":
    case "EXTRAVERSION":
      return "extraversion";
    case "A":
    case "AGREEABLENESS":
      return "agreeableness";
    case "N":
    case "NEUROTICISM":
      return "neuroticism";
    default:
      return "";
  }
};

const canonicalIkigaiMetric = (value) => {
  const normalized = `${value ?? ""}`.trim().toUpperCase().replace(/[\s_-]+/g, "");
  switch (normalized) {
    case "LOVE":
    case "PASSION":
      return "passion";
    case "SKILL":
    case "STRENGTH":
      return "strength";
    case "NEED":
    case "VALUE":
      return "value";
    case "PAID":
    case "OPPORTUNITY":
      return "opportunity";
    default:
      return "";
  }
};

const canonicalDiscMetric = (value) => {
  const normalized = `${value ?? ""}`.trim().toUpperCase();
  return ["D", "I", "S", "C"].includes(normalized) ? normalized : "";
};

const inferProfileType = (primaryMetric, secondaryMetric) => {
  if (canonicalBigFiveMetric(primaryMetric) || canonicalBigFiveMetric(secondaryMetric)) {
    return "BIG5";
  }
  if (canonicalIkigaiMetric(primaryMetric) || canonicalIkigaiMetric(secondaryMetric)) {
    return "IKIGAI";
  }
  return "DISC";
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
};

export const normalizePdfVariableToken = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^\{+|\}+$/g, "").trim();
};

export const formatPdfVariableToken = (value) => {
  const normalized = normalizePdfVariableToken(value);
  return normalized ? `{${normalized}}` : "";
};

export const parsePdfVariableOptions = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n|\|/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const normalizePdfVariableProfileType = (value) => normalizeProfileTypeValue(value);

export const getPdfVariableDefaults = (profileType) => {
  const normalizedType = normalizePdfVariableProfileType(profileType);
  return PDF_VARIABLE_DEFAULTS[normalizedType] || PDF_VARIABLE_DEFAULTS.DISC;
};

export const getPdfVariableProfileMeta = (profileType) => {
  const normalizedType = normalizePdfVariableProfileType(profileType);
  return PDF_VARIABLE_PROFILE_META[normalizedType] || PDF_VARIABLE_PROFILE_META.DISC;
};

export const getPdfVariableMetricOptions = (profileType) => {
  const normalizedType = normalizePdfVariableProfileType(profileType);
  return PDF_VARIABLE_METRIC_OPTIONS[normalizedType] || PDF_VARIABLE_METRIC_OPTIONS.DISC;
};

export const normalizePdfVariableMetric = (profileType, value) => {
  const normalizedType = normalizePdfVariableProfileType(profileType);
  if (normalizedType === "BIG5") return canonicalBigFiveMetric(value);
  if (normalizedType === "IKIGAI") return canonicalIkigaiMetric(value);
  return canonicalDiscMetric(value);
};

export const getPdfVariableMetricLabel = (profileType, metric) => {
  const normalizedMetric = normalizePdfVariableMetric(profileType, metric);
  return getPdfVariableMetricOptions(profileType).find((item) => item.value === normalizedMetric)?.label || normalizedMetric;
};

export const normalizePdfCustomVariables = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const token = normalizePdfVariableToken(item?.token || item?.name || item?.key);
      if (!token) return null;

      const rawPrimaryMetric = item?.primaryMetric ?? item?.primaryGroup ?? item?.discMain ?? "";
      const rawSecondaryMetric = item?.secondaryMetric ?? item?.secondaryGroup ?? item?.discSecondary ?? "";
      const profileType = normalizePdfVariableProfileType(
        item?.profileType || item?.sourceType || inferProfileType(rawPrimaryMetric, rawSecondaryMetric)
      );
      const defaults = getPdfVariableDefaults(profileType);
      const hasExplicitMetrics = !!(`${rawPrimaryMetric ?? ""}`.trim() || `${rawSecondaryMetric ?? ""}`.trim());
      const options = parsePdfVariableOptions(item?.options ?? item?.content ?? item?.contents ?? item?.contentText);

      return {
        id: item?.id || `pdf-var-${index + 1}`,
        token,
        profileType,
        primaryMetric: normalizePdfVariableMetric(profileType, rawPrimaryMetric) || (hasExplicitMetrics ? "" : defaults.primaryMetric),
        primaryMin: toNumber(item?.primaryMin),
        primaryMax: toNumber(item?.primaryMax),
        secondaryMetric: normalizePdfVariableMetric(profileType, rawSecondaryMetric) || (hasExplicitMetrics ? "" : defaults.secondaryMetric),
        secondaryMin: toNumber(item?.secondaryMin),
        secondaryMax: toNumber(item?.secondaryMax),
        options,
      };
    })
    .filter(Boolean);
};

export const serializePdfCustomVariables = (items) =>
  normalizePdfCustomVariables(items).map((item) => ({
    id: item.id,
    token: item.token,
    profileType: item.profileType,
    primaryMetric: item.primaryMetric,
    primaryMin: item.primaryMin,
    primaryMax: item.primaryMax,
    secondaryMetric: item.secondaryMetric,
    secondaryMin: item.secondaryMin,
    secondaryMax: item.secondaryMax,
    options: item.options,
  }));

export const variableOptionsToTextarea = (variable) =>
  Array.isArray(variable?.options) ? variable.options.join("\n") : "";
