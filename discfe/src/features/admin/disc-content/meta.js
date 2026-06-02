export const contentSurfaceClassName =
  "rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur";

export const formatListCount = (value) => {
  if (value == null) return "0";
  return new Intl.NumberFormat("vi-VN").format(Number(value));
};
