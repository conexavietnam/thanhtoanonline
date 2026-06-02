export const DISC_CONTENT_TEST_CODES = [
  "DISC",
  "DISC_PAID",
  "DISC_FREE",
  "BIG_FIVE",
  "IKIGAI",
];

export const DISC_CONTENT_PRIMARY_TEST_CODES = [
  { value: "DISC", label: "DISC" },
  { value: "BIG_FIVE", label: "Big Five" },
  { value: "IKIGAI", label: "Ikigai" },
];

export const getContentTypeOptions = (currentValue) => {
  const options = [...DISC_CONTENT_PRIMARY_TEST_CODES];

  if (currentValue && !options.some((option) => option.value === currentValue)) {
    options.push({ value: currentValue, label: currentValue });
  }

  return options;
};

const createDimension = (value, label, shortLabel, styles) => ({
  value,
  label,
  shortLabel,
  ...styles,
});

export const dimensionSets = {
  DISC: [
    createDimension("DOMINANCE", "D - Dominance", "D", {
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      dotClass: "bg-rose-500",
      softClass: "bg-rose-50 text-rose-700",
    }),
    createDimension("INFLUENCE", "I - Influence", "I", {
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      dotClass: "bg-amber-500",
      softClass: "bg-amber-50 text-amber-700",
    }),
    createDimension("STEADINESS", "S - Steadiness", "S", {
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dotClass: "bg-emerald-500",
      softClass: "bg-emerald-50 text-emerald-700",
    }),
    createDimension("COMPLIANCE", "C - Compliance", "C", {
      badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
      dotClass: "bg-sky-500",
      softClass: "bg-sky-50 text-sky-700",
    }),
  ],
  DISC_FREE: [
    createDimension("DOMINANCE", "D - Dominance", "D", {
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      dotClass: "bg-rose-500",
      softClass: "bg-rose-50 text-rose-700",
    }),
    createDimension("INFLUENCE", "I - Influence", "I", {
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      dotClass: "bg-amber-500",
      softClass: "bg-amber-50 text-amber-700",
    }),
    createDimension("STEADINESS", "S - Steadiness", "S", {
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dotClass: "bg-emerald-500",
      softClass: "bg-emerald-50 text-emerald-700",
    }),
    createDimension("COMPLIANCE", "C - Compliance", "C", {
      badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
      dotClass: "bg-sky-500",
      softClass: "bg-sky-50 text-sky-700",
    }),
  ],
  DISC_PAID: [
    createDimension("DOMINANCE", "D - Dominance", "D", {
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      dotClass: "bg-rose-500",
      softClass: "bg-rose-50 text-rose-700",
    }),
    createDimension("INFLUENCE", "I - Influence", "I", {
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      dotClass: "bg-amber-500",
      softClass: "bg-amber-50 text-amber-700",
    }),
    createDimension("STEADINESS", "S - Steadiness", "S", {
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dotClass: "bg-emerald-500",
      softClass: "bg-emerald-50 text-emerald-700",
    }),
    createDimension("COMPLIANCE", "C - Compliance", "C", {
      badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
      dotClass: "bg-sky-500",
      softClass: "bg-sky-50 text-sky-700",
    }),
  ],
  BIG_FIVE: [
    createDimension("OPENNESS", "O - Openness", "O", {
      badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700",
      dotClass: "bg-indigo-500",
      softClass: "bg-indigo-50 text-indigo-700",
    }),
    createDimension("CONSCIENTIOUSNESS", "C - Conscientiousness", "C", {
      badgeClass: "border-violet-200 bg-violet-50 text-violet-700",
      dotClass: "bg-violet-500",
      softClass: "bg-violet-50 text-violet-700",
    }),
    createDimension("EXTRAVERSION", "E - Extraversion", "E", {
      badgeClass: "border-orange-200 bg-orange-50 text-orange-700",
      dotClass: "bg-orange-500",
      softClass: "bg-orange-50 text-orange-700",
    }),
    createDimension("AGREEABLENESS", "A - Agreeableness", "A", {
      badgeClass: "border-teal-200 bg-teal-50 text-teal-700",
      dotClass: "bg-teal-500",
      softClass: "bg-teal-50 text-teal-700",
    }),
    createDimension("NEUROTICISM", "N - Neuroticism", "N", {
      badgeClass: "border-red-200 bg-red-50 text-red-700",
      dotClass: "bg-red-500",
      softClass: "bg-red-50 text-red-700",
    }),
  ],
  IKIGAI: [
    createDimension("LOVE", "Love", "Love", {
      badgeClass: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
      dotClass: "bg-fuchsia-500",
      softClass: "bg-fuchsia-50 text-fuchsia-700",
    }),
    createDimension("SKILL", "Skill", "Skill", {
      badgeClass: "border-cyan-200 bg-cyan-50 text-cyan-700",
      dotClass: "bg-cyan-500",
      softClass: "bg-cyan-50 text-cyan-700",
    }),
    createDimension("NEED", "Need", "Need", {
      badgeClass: "border-lime-200 bg-lime-50 text-lime-700",
      dotClass: "bg-lime-500",
      softClass: "bg-lime-50 text-lime-700",
    }),
    createDimension("PAID", "Paid", "Paid", {
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dotClass: "bg-emerald-500",
      softClass: "bg-emerald-50 text-emerald-700",
    }),
  ],
};

export const TEST_CODE_COPY = {
  DISC: "Bộ chuẩn cho trắc nghiệm DISC nội bộ.",
  DISC_PAID: "Phiên bản nội dung mở rộng cho người dùng trả phí.",
  DISC_FREE: "Phiên bản rút gọn cho luồng dùng thử hoặc onboarding.",
  BIG_FIVE: "Kho nội dung dành cho Big Five với dimension chuẩn OCEAN.",
  IKIGAI: "Kho nội dung định hướng mục tiêu và nghề nghiệp theo Ikigai.",
};

const uniqueDimensions = (dimensions) =>
  Array.from(new Map(dimensions.map((dimension) => [dimension.value, dimension])).values());

export const allDimensions = uniqueDimensions(Object.values(dimensionSets).flat());

export const dimensionLookup = allDimensions.reduce((accumulator, dimension) => {
  accumulator[dimension.value] = dimension;
  return accumulator;
}, {});

export const mapLegacyDimension = (value) => {
  if (!value) return value;

  const key = String(value).toUpperCase();
  const legacyMap = {
    D: "DOMINANCE",
    I: "INFLUENCE",
    S: "STEADINESS",
    C: "COMPLIANCE",
    O: "OPENNESS",
    E: "EXTRAVERSION",
    A: "AGREEABLENESS",
    N: "NEUROTICISM",
    L: "LOVE",
    K: "SKILL",
    P: "PAID",
    BIG5_O: "OPENNESS",
    BIG5_C: "CONSCIENTIOUSNESS",
    BIG5_E: "EXTRAVERSION",
    BIG5_A: "AGREEABLENESS",
    BIG5_N: "NEUROTICISM",
    IKIGAI_LOVE: "LOVE",
    IKIGAI_SKILL: "SKILL",
    IKIGAI_NEED: "NEED",
    IKIGAI_PAID: "PAID",
  };

  return legacyMap[key] || key;
};

export const getDimensionsByTest = (testCode) => dimensionSets[testCode] || allDimensions;

export const getDimensionMeta = (value) => {
  const canonicalValue = mapLegacyDimension(value);

  return (
    dimensionLookup[canonicalValue] || {
      value: canonicalValue || "UNKNOWN",
      label: canonicalValue || "Khác",
      shortLabel: canonicalValue || "Khác",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
      dotClass: "bg-slate-500",
      softClass: "bg-slate-50 text-slate-700",
    }
  );
};

export const getDefaultDimension = (testCode) =>
  getDimensionsByTest(testCode)[0]?.value || "DOMINANCE";

export const detectTestCodeFromDimension = (dimension) => {
  const canonicalValue = mapLegacyDimension(dimension);

  if (["OPENNESS", "CONSCIENTIOUSNESS", "EXTRAVERSION", "AGREEABLENESS", "NEUROTICISM"].includes(canonicalValue)) {
    return "BIG_FIVE";
  }

  if (["LOVE", "SKILL", "NEED", "PAID"].includes(canonicalValue)) {
    return "IKIGAI";
  }

  return "DISC";
};
