import { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Check, Search, Sparkles, X } from "lucide-react";
import { DISC_CONTENT_TEST_CODES, getDimensionMeta } from "./config.js";
import { contentSurfaceClassName } from "./meta.js";

const heroToneClasses = {
  violet: {
    panel: "bg-[linear-gradient(135deg,rgba(245,243,255,0.96),rgba(255,255,255,0.92),rgba(250,245,255,0.94))]",
    accent: "from-violet-500/18 via-violet-500/6 to-transparent",
    icon: "bg-violet-500/12 text-violet-700",
  },
  sky: {
    panel: "bg-[linear-gradient(135deg,rgba(240,249,255,0.96),rgba(255,255,255,0.92),rgba(224,242,254,0.92))]",
    accent: "from-sky-500/18 via-sky-500/6 to-transparent",
    icon: "bg-sky-500/12 text-sky-700",
  },
  emerald: {
    panel: "bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.92),rgba(236,253,245,0.94))]",
    accent: "from-emerald-500/18 via-emerald-500/6 to-transparent",
    icon: "bg-emerald-500/12 text-emerald-700",
  },
  amber: {
    panel: "bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,255,255,0.92),rgba(255,247,237,0.94))]",
    accent: "from-amber-500/18 via-amber-500/6 to-transparent",
    icon: "bg-amber-500/12 text-amber-700",
  },
  rose: {
    panel: "bg-[linear-gradient(135deg,rgba(255,241,242,0.96),rgba(255,255,255,0.92),rgba(255,245,245,0.94))]",
    accent: "from-rose-500/18 via-rose-500/6 to-transparent",
    icon: "bg-rose-500/12 text-rose-700",
  },
};

const statToneClasses = {
  slate: {
    panel: "border-slate-200/70 bg-slate-50/80",
    icon: "bg-slate-900/10 text-slate-700",
    value: "text-slate-950",
  },
  violet: {
    panel: "border-violet-200/70 bg-violet-50/80",
    icon: "bg-violet-500/15 text-violet-700",
    value: "text-violet-950",
  },
  sky: {
    panel: "border-sky-200/70 bg-sky-50/80",
    icon: "bg-sky-500/15 text-sky-700",
    value: "text-sky-950",
  },
  emerald: {
    panel: "border-emerald-200/70 bg-emerald-50/80",
    icon: "bg-emerald-500/15 text-emerald-700",
    value: "text-emerald-950",
  },
  amber: {
    panel: "border-amber-200/70 bg-amber-50/80",
    icon: "bg-amber-500/15 text-amber-700",
    value: "text-amber-950",
  },
  rose: {
    panel: "border-rose-200/70 bg-rose-50/80",
    icon: "bg-rose-500/15 text-rose-700",
    value: "text-rose-950",
  },
};

export function Surface({ className, children }) {
  return <section className={clsx(contentSurfaceClassName, className)}>{children}</section>;
}

function StatCard({ label, value, hint, tone = "slate", icon: Icon = Sparkles }) {
  const toneStyles = statToneClasses[tone] || statToneClasses.slate;

  return (
    <div className={clsx("rounded-[24px] border p-4", toneStyles.panel)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {label}
          </p>
          <p className={clsx("text-2xl font-bold tracking-tight", toneStyles.value)}>{value}</p>
        </div>
        <span className={clsx("inline-flex h-10 w-10 items-center justify-center rounded-2xl", toneStyles.icon)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {hint ? <p className="mt-3 text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}

export function ContentHero({
  icon: Icon = Sparkles,
  eyebrow,
  title,
  description,
  tone = "violet",
  stats = [],
  actions,
  children,
}) {
  const toneStyles = heroToneClasses[tone] || heroToneClasses.violet;

  return (
    <section className={clsx(contentSurfaceClassName, "relative overflow-hidden p-6 lg:p-8", toneStyles.panel)}>
      <div className={clsx("pointer-events-none absolute inset-0 bg-gradient-to-br", toneStyles.accent)} />
      <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/55 blur-3xl" />
      <div className="relative space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            {eyebrow ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </div>
            ) : null}
            <div className="flex items-start gap-4">
              <span className={clsx("inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px]", toneStyles.icon)}>
                <Icon className="h-7 w-7" />
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 lg:text-4xl">{title}</h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 lg:text-[15px]">{description}</p>
              </div>
            </div>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
        </div>
        {children}
        {stats.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PillTabs({
  options,
  value,
  onChange,
  className,
  compact = false,
}) {
  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={`${option.label}-${option.value ?? "empty"}`}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all",
              compact ? "text-xs" : null,
              isActive
                ? "border-violet-300 bg-violet-600 text-white shadow-[0_10px_30px_rgba(124,58,237,0.25)]"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            )}
          >
            {option.dotClass ? <span className={clsx("h-2 w-2 rounded-full", option.dotClass)} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function TestCodeTabs({ value, onChange, options = DISC_CONTENT_TEST_CODES }) {
  return (
    <PillTabs
      value={value}
      onChange={onChange}
      options={options.map((testCode) => ({ value: testCode, label: testCode }))}
      compact
    />
  );
}

export function SearchField({ value, onChange, placeholder = "Tìm kiếm...", className }) {
  return (
    <label className={clsx("flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm", className)}>
      <Search className="h-4 w-4 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
    </label>
  );
}

export function DimensionBadge({ value, compact = false }) {
  const meta = getDimensionMeta(value);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold",
        compact ? "text-[11px]" : "text-xs",
        meta.badgeClass
      )}
    >
      <span className={clsx("h-2 w-2 rounded-full", meta.dotClass)} />
      {compact ? meta.shortLabel : meta.label}
    </span>
  );
}

export function StatusBadge({ active, activeLabel = "Đang bật", inactiveLabel = "Đã tắt" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-500"
      )}
    >
      <span className={clsx("h-2 w-2 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function EmptyState({ icon: Icon = Sparkles, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-slate-500 shadow-sm">
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function PlanCodePicker({
  plans,
  value = [],
  onChange,
  emptyLabel = "Chưa có gói hoặc chưa tải được danh sách gói.",
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {plans.length === 0 ? (
          <span className="text-sm text-slate-500">{emptyLabel}</span>
        ) : (
          plans.map((plan) => {
            const checked = value.includes(plan.code);

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  const next = new Set(value);
                  if (checked) {
                    next.delete(plan.code);
                  } else {
                    next.add(plan.code);
                  }
                  onChange(Array.from(next));
                }}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-medium transition-all",
                  checked
                    ? "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                )}
              >
                <span
                  className={clsx(
                    "inline-flex h-4 w-4 items-center justify-center rounded-full border",
                    checked ? "border-violet-300 bg-violet-600 text-white" : "border-slate-300 bg-white text-transparent"
                  )}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span>{plan.name}</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{plan.code}</span>
              </button>
            );
          })
        )}
      </div>
      <p className="text-xs text-slate-500">Bỏ trống để áp dụng cho tất cả gói.</p>
    </div>
  );
}

export function KeyValuePill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
      <span className="font-semibold text-slate-900">{label}</span>
      <span>{value}</span>
    </span>
  );
}

export function EditorModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  maxWidth = "max-w-5xl",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={clsx(contentSurfaceClassName, "flex max-h-[92vh] w-full flex-col overflow-hidden", maxWidth)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-6 py-5">
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
            {description ? <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.65),rgba(255,255,255,0.96))] p-6">
          {children}
        </div>
        {footer ? <div className="border-t border-slate-200/80 bg-white/95 px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
