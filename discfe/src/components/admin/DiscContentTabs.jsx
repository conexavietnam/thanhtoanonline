import clsx from "clsx";
import { BrainCircuit, Briefcase, ClipboardList, Route, X } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

const tabs = [
  {
    path: "/admin/questions",
    label: "Câu hỏi",
    icon: ClipboardList,
    accent: {
      active: "bg-emerald-600 text-white shadow-sm shadow-emerald-300",
      dot: "bg-emerald-400",
    },
  },
  {
    path: "/admin/insights",
    label: "Insights",
    icon: BrainCircuit,
    accent: {
      active: "bg-violet-600 text-white shadow-sm shadow-violet-300",
      dot: "bg-violet-400",
    },
  },
  {
    path: "/admin/careers",
    label: "Nghề nghiệp",
    icon: Briefcase,
    accent: {
      active: "bg-amber-500 text-white shadow-sm shadow-amber-300",
      dot: "bg-amber-400",
    },
  },
  {
    path: "/admin/development-plans",
    label: "Lộ trình",
    icon: Route,
    accent: {
      active: "bg-sky-600 text-white shadow-sm shadow-sky-300",
      dot: "bg-sky-400",
    },
  },
];

const SHARED_FILTER_KEYS = ["testCode", "dimension"];
const contextChipLabels = { testCode: "Loại", dimension: "Dimension" };

const DiscContentTabs = ({ controls = null, actions = null, controlsLabel = "Phạm vi đang thao tác" }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const buildTabUrl = (path) => {
    const nextParams = new URLSearchParams();
    SHARED_FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) nextParams.set(key, value);
    });
    const query = nextParams.toString();
    return query ? `${path}?${query}` : path;
  };

  const activeContext = SHARED_FILTER_KEYS
    .map((key) => {
      const value = searchParams.get(key);
      return value ? { key, label: contextChipLabels[key], value } : null;
    })
    .filter(Boolean);

  const clearSharedFilters = () => {
    setSearchParams((previous) => {
      const nextParams = new URLSearchParams(previous);
      SHARED_FILTER_KEYS.forEach((key) => nextParams.delete(key));
      return nextParams;
    });
  };

  return (
    <div className="space-y-3">
      {/* Compact Tab Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={buildTabUrl(tab.path)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                  isActive
                    ? tab.accent.active
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className={clsx("h-1.5 w-1.5 rounded-full", tab.accent.dot)} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Active context chips */}
        <div className="flex flex-wrap items-center gap-2">
          {activeContext.length > 0 ? (
            <>
              {activeContext.map((chip) => (
                <span
                  key={`${chip.key}-${chip.value}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  <span className="text-slate-400">{chip.label}:</span>
                  <span className="font-semibold">{chip.value}</span>
                </span>
              ))}
              <button
                type="button"
                title="Xóa bộ lọc"
                onClick={clearSharedFilters}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-500">
              Chọn module cần sửa, sau đó lọc theo loại nội dung hoặc dimension ngay trong màn hình.
            </span>
          )}
        </div>
      </div>

      {/* Controls strip (test code tabs / dimension filter) */}
      {(controls || actions) && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                {controlsLabel}
              </p>
              {controls}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscContentTabs;
