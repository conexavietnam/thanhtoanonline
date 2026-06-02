import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { NavLink } from "react-router";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  BrainCircuit,
  ClipboardList,
  FileText,
  FolderKanban,
  HandCoins,
  Handshake,
  ReceiptText,
  RefreshCcw,
  ScrollText,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  adminAuditLogAPI,
  adminFinanceAPI,
  adminReferralAPI,
} from "../../lib/api.js";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  minimumFractionDigits: 0,
});
const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatNumber = (value) => {
  if (value == null) return "—";
  return numberFormatter.format(Number(value));
};

const formatMoney = (value) => {
  if (value == null) return "—";
  return moneyFormatter.format(Number(value));
};

const formatCompactMoney = (value) => {
  if (value == null) return "—";
  const numericValue = Number(value);
  const abs = Math.abs(numericValue);

  if (abs >= 1_000_000_000) {
    return `${(numericValue / 1_000_000_000).toFixed(1)} tỷ`;
  }

  if (abs >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(1)} triệu`;
  }

  return formatMoney(numericValue);
};

const formatPercent = (value) => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)}%`;
};

const formatDateTime = (value) => {
  if (!value) return "Chưa có dữ liệu";
  return dateTimeFormatter.format(new Date(value));
};

const titleCase = (value) => {
  if (!value) return "Khác";

  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const calculateRatio = (numerator, denominator) => {
  if (!denominator) return 0;
  return (Number(numerator) / Number(denominator)) * 100;
};

const metricToneClasses = {
  amber: {
    panel: "border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,247,237,0.92))]",
    icon: "bg-amber-500/15 text-amber-700",
    value: "text-amber-950",
  },
  emerald: {
    panel: "border-emerald-200/70 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(240,253,250,0.92))]",
    icon: "bg-emerald-500/15 text-emerald-700",
    value: "text-emerald-950",
  },
  sky: {
    panel: "border-sky-200/70 bg-[linear-gradient(180deg,rgba(240,249,255,0.96),rgba(239,246,255,0.92))]",
    icon: "bg-sky-500/15 text-sky-700",
    value: "text-sky-950",
  },
  rose: {
    panel: "border-rose-200/70 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,245,245,0.92))]",
    icon: "bg-rose-500/15 text-rose-700",
    value: "text-rose-950",
  },
  slate: {
    panel: "border-slate-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.92))]",
    icon: "bg-slate-900/10 text-slate-700",
    value: "text-slate-950",
  },
  violet: {
    panel: "border-violet-200/70 bg-[linear-gradient(180deg,rgba(245,243,255,0.96),rgba(250,245,255,0.92))]",
    icon: "bg-violet-500/15 text-violet-700",
    value: "text-violet-950",
  },
};

const actionToneClasses = {
  amber: "from-amber-500/18 via-transparent to-transparent text-amber-900",
  emerald: "from-emerald-500/18 via-transparent to-transparent text-emerald-900",
  sky: "from-sky-500/18 via-transparent to-transparent text-sky-900",
  rose: "from-rose-500/18 via-transparent to-transparent text-rose-900",
  slate: "from-slate-900/10 via-transparent to-transparent text-slate-900",
  violet: "from-violet-500/18 via-transparent to-transparent text-violet-900",
};

const surfaceClassName =
  "rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({
    overview: null,
    referrals: null,
    audits: [],
    refreshedAt: null,
    failedSections: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [overviewResult, referralsResult, auditsResult] = await Promise.allSettled([
        adminFinanceAPI.getOverview(),
        adminReferralAPI.getStats(),
        adminAuditLogAPI.getAll({ page: 0, size: 5 }),
      ]);

      const failedSections = [];
      let overviewLoaded = false;
      let referralsLoaded = false;
      let auditsLoaded = false;
      let overviewData = null;
      let referralsData = null;
      let auditsData = [];

      if (overviewResult.status === "fulfilled") {
        overviewLoaded = true;
        overviewData = overviewResult.value.data ?? null;
      } else {
        failedSections.push("tổng quan tài chính");
      }

      if (referralsResult.status === "fulfilled") {
        referralsLoaded = true;
        referralsData = referralsResult.value.data ?? null;
      } else {
        failedSections.push("pipeline referral");
      }

      if (auditsResult.status === "fulfilled") {
        auditsLoaded = true;
        auditsData = auditsResult.value.data?.content ?? [];
      } else {
        failedSections.push("nhật ký hệ thống");
      }

      setDashboard((previous) => ({
        overview: overviewLoaded ? overviewData : (silent ? previous.overview : null),
        referrals: referralsLoaded ? referralsData : (silent ? previous.referrals : null),
        audits: auditsLoaded ? auditsData : (silent ? previous.audits : []),
        refreshedAt: new Date().toISOString(),
        failedSections,
      }));

      if (failedSections.length === 3) {
        setError("Không thể tải dữ liệu dashboard.");
      } else if (failedSections.length > 0) {
        setError(`Một số khối dữ liệu chưa cập nhật: ${failedSections.join(", ")}.`);
      }
    } catch (fetchError) {
      console.error("Failed to fetch admin dashboard", fetchError);
      setDashboard((previous) => ({
        ...previous,
        failedSections: ["dashboard"],
      }));
      setError("Không thể tải dữ liệu dashboard.");
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const overview = dashboard.overview;
  const referrals = dashboard.referrals;
  const audits = dashboard.audits ?? [];

  const totalUsers = Number(overview?.totalUsers ?? 0);
  const totalPartners = Number(overview?.totalPartners ?? 0);
  const totalTests = Number(overview?.totalTests ?? 0);
  const totalExports = Number(overview?.totalExports ?? 0);
  const totalRevenue = Number(overview?.totalRevenueVnd ?? 0);
  const totalCost = Number(overview?.totalCostVnd ?? 0);
  const totalAffiliate = Number(overview?.totalAffiliateVnd ?? 0);
  const netRevenue = totalRevenue - totalCost - totalAffiliate;

  const partnerShare = calculateRatio(totalPartners, totalUsers);
  const exportRate = calculateRatio(totalExports, totalTests);
  const marginRate = calculateRatio(netRevenue, totalRevenue);
  const revenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

  const hasAnyData = Boolean(overview || referrals || audits.length > 0);
  const roleLabel = user?.roles?.includes("SUPER_ADMIN") ? "Super Admin" : "Admin";
  const firstName = user?.fullName?.trim()?.split(/\s+/).at(-1) || "Admin";

  const metricCards = useMemo(
    () => [
      {
        title: "Người dùng",
        value: formatNumber(overview?.totalUsers),
        description: `${formatPercent(partnerShare)} đang ở vai trò đối tác`,
        icon: Users,
        tone: "amber",
      },
      {
        title: "Bài test",
        value: formatNumber(overview?.totalTests),
        description: `${formatPercent(exportRate)} phát sinh lượt xuất PDF`,
        icon: ClipboardList,
        tone: "sky",
      },
      {
        title: "Doanh thu hoàn tất",
        value: formatMoney(overview?.totalRevenueVnd),
        description: `ARPU hiện tại ${formatCompactMoney(revenuePerUser)}`,
        icon: BadgeDollarSign,
        tone: "emerald",
      },
      {
        title: "Lợi nhuận ước tính",
        value: formatMoney(overview ? netRevenue : null),
        description: `Biên vận hành ${formatPercent(marginRate)}`,
        icon: TrendingUp,
        tone: netRevenue >= 0 ? "violet" : "rose",
      },
      {
        title: "Referrals chờ xử lý",
        value: formatNumber(referrals?.pendingCount),
        description: `${formatMoney(referrals?.totalPendingCommission)} đang chờ payout`,
        icon: Handshake,
        tone: "rose",
      },
      {
        title: "Audit logs gần nhất",
        value: formatNumber(audits.length),
        description: audits[0]?.createdAt
          ? `Mốc mới nhất ${formatDateTime(audits[0].createdAt)}`
          : "Chưa có bản ghi hoạt động gần đây",
        icon: ShieldCheck,
        tone: "slate",
      },
    ],
    [
      audits,
      marginRate,
      netRevenue,
      overview,
      partnerShare,
      referrals,
      exportRate,
      revenuePerUser,
    ]
  );

  const financeBreakdown = useMemo(() => {
    const base = Math.max(totalRevenue, totalCost, totalAffiliate, Math.abs(netRevenue), 1);

    return [
      {
        label: "Doanh thu hoàn tất",
        value: totalRevenue,
        tone: "bg-emerald-500",
        helper: "Nguồn thu từ đơn COMPLETED",
        trendIcon: TrendingUp,
      },
      {
        label: "Chi phí test",
        value: totalCost,
        tone: "bg-amber-500",
        helper: "Tổng cost phát sinh từ test session",
        trendIcon: TrendingDown,
      },
      {
        label: "Hoa hồng affiliate",
        value: totalAffiliate,
        tone: "bg-rose-500",
        helper: "Phần chia cho referral/affiliate",
        trendIcon: HandCoins,
      },
      {
        label: "Ròng sau chi phí",
        value: netRevenue,
        tone: netRevenue >= 0 ? "bg-slate-900" : "bg-rose-700",
        helper: netRevenue >= 0 ? "Còn lại để vận hành" : "Đang âm sau chi phí",
        trendIcon: netRevenue >= 0 ? TrendingUp : TrendingDown,
      },
    ].map((item) => ({
      ...item,
      width: `${Math.min(100, Math.max(item.value !== 0 ? 10 : 0, (Math.abs(item.value) / base) * 100))}%`,
    }));
  }, [netRevenue, totalAffiliate, totalCost, totalRevenue]);

  const referralDistribution = useMemo(() => {
    const totalReferrals = Number(referrals?.totalReferrals ?? 0);
    const items = [
      {
        label: "Pending",
        value: Number(referrals?.pendingCount ?? 0),
        tone: "bg-amber-400",
      },
      {
        label: "Qualified",
        value: Number(referrals?.qualifiedCount ?? 0),
        tone: "bg-sky-400",
      },
      {
        label: "Paid",
        value: Number(referrals?.paidCount ?? 0),
        tone: "bg-emerald-400",
      },
      {
        label: "Cancelled",
        value: Number(referrals?.cancelledCount ?? 0),
        tone: "bg-slate-300",
      },
    ];

    return {
      totalReferrals,
      items: items.map((item) => ({
        ...item,
        percent: totalReferrals > 0 ? (item.value / totalReferrals) * 100 : 0,
      })),
    };
  }, [referrals]);

  const quickActions = useMemo(
    () => [
      {
        title: "Người dùng",
        description: "Tra cứu hồ sơ, phân quyền và xử lý các tài khoản cần hỗ trợ.",
        to: "/admin/users",
        stat: `${formatNumber(overview?.totalUsers)} tài khoản`,
        icon: Users,
        tone: "amber",
      },
      {
        title: "Tài chính",
        description: "Đối soát đơn hàng, hoàn tất thanh toán và theo dõi dòng tiền.",
        to: "/admin/finance",
        stat: formatMoney(overview?.totalRevenueVnd),
        icon: ReceiptText,
        tone: "emerald",
      },
      {
        title: "Nội dung DISC",
        description: "Quản lý câu hỏi, insight, nghề nghiệp và development plan.",
        to: "/admin/questions",
        stat: `${formatNumber(overview?.totalTests)} lượt test`,
        icon: BrainCircuit,
        tone: "sky",
      },
      {
        title: "Referrals",
        description: "Kiểm soát pipeline đối tác, hoa hồng pending và các payout.",
        to: "/admin/referrals",
        stat: `${formatNumber(referrals?.pendingCount)} chờ xử lý`,
        icon: Handshake,
        tone: "rose",
      },
      {
        title: "Gói & cấu hình",
        description: "Điều chỉnh plan user, plan partner và gói PDF cho mạng lưới bán hàng.",
        to: "/admin/plans/user",
        stat: `${formatNumber(overview?.totalPartners)} partner`,
        icon: FolderKanban,
        tone: "violet",
      },
      {
        title: "Nhật ký hệ thống",
        description: "Rà soát hoạt động gần đây, audit trail và trạng thái cấu hình.",
        to: "/admin/audit-logs",
        stat: `${formatNumber(audits.length)} log gần nhất`,
        icon: ScrollText,
        tone: "slate",
      },
    ],
    [audits.length, overview, referrals]
  );

  const statusSignals = useMemo(
    () => [
      {
        label: "Phiên đang dùng",
        value: roleLabel,
        helper: user?.email || "Không có email",
      },
      {
        label: "Làm mới gần nhất",
        value: formatDateTime(dashboard.refreshedAt),
        helper:
          dashboard.failedSections.length === 0
            ? "3 luồng dữ liệu đã đồng bộ"
            : `Thiếu ${dashboard.failedSections.length} khối dữ liệu`,
      },
      {
        label: "Việc cần ưu tiên",
        value:
          Number(referrals?.pendingCount ?? 0) > 0
            ? `${formatNumber(referrals?.pendingCount)} referral pending`
            : "Không có hàng chờ nóng",
        helper:
          Number(referrals?.pendingCount ?? 0) > 0
            ? "Nên xử lý payout/status trước"
            : "Có thể đi thẳng vào tối ưu vận hành",
      },
    ],
    [dashboard.failedSections.length, dashboard.refreshedAt, referrals?.pendingCount, roleLabel, user?.email]
  );

  if (loading && !hasAnyData) {
    return <DashboardSkeleton />;
  }

  if (!loading && !hasAnyData) {
    return (
      <div className={`${surfaceClassName} flex min-h-[55vh] flex-col items-center justify-center px-6 text-center`}>
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white">
          <Activity className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-950">Dashboard chưa tải được dữ liệu</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Kiểm tra lại backend hoặc quyền truy cập của phiên hiện tại, sau đó thử đồng bộ lại.
        </p>
        <button
          className="btn mt-6 rounded-2xl border-0 bg-slate-950 px-5 text-white hover:bg-slate-800"
          onClick={() => fetchDashboard()}
        >
          Tải lại dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[36px] border border-slate-900/80 bg-[#0b1720] text-white shadow-[0_24px_80px_rgba(11,23,32,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(52,211,153,0.22),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_40%)]" />
        <div className="absolute -right-16 top-10 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative grid gap-8 p-6 lg:grid-cols-[1.3fr_0.85fr] lg:p-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Control Room
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                <Activity className="h-3.5 w-3.5" />
                {dashboard.failedSections.length === 0 ? "Dữ liệu trực tiếp" : "Dữ liệu cập nhật một phần"}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-white/60">Xin chào {firstName}</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
                Trung tâm điều phối cho toàn bộ vận hành admin.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                Theo dõi dòng doanh thu, pipeline referral và audit trail từ một màn hình, rồi nhảy
                thẳng vào module cần xử lý thay vì lướt qua từng menu.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NavLink
                to="/admin/finance"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                <ReceiptText className="h-4 w-4" />
                Mở tài chính
              </NavLink>
              <NavLink
                to="/admin/questions"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/14"
              >
                <BrainCircuit className="h-4 w-4" />
                Vào nội dung DISC
              </NavLink>
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10"
                onClick={() => fetchDashboard({ silent: true })}
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Đang đồng bộ" : "Đồng bộ lại"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Trạng thái phiên
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">Sẵn sàng cho tác vụ nóng</h2>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <ShieldCheck className="h-5 w-5 text-emerald-200" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {statusSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-2xl border border-white/8 bg-slate-950/25 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">{signal.label}</p>
                  <p className="mt-1 text-base font-semibold text-white">{signal.value}</p>
                  <p className="mt-1 text-sm text-white/58">{signal.helper}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {dashboard.failedSections.length > 0 && (
        <section className="rounded-[24px] border border-amber-200 bg-amber-50/90 px-5 py-4 text-sm text-amber-900">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Một phần dữ liệu chưa đồng bộ</p>
              <p className="text-amber-800/80">
                Các khối bị thiếu: {dashboard.failedSections.join(", ")}.
              </p>
            </div>
            <button
              className="btn btn-sm rounded-xl border-0 bg-amber-900 text-white hover:bg-amber-950"
              onClick={() => fetchDashboard({ silent: true })}
            >
              Thử lại
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((item) => (
          <MetricCard key={item.title} {...item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`${surfaceClassName} p-6`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Financial Snapshot
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Cấu trúc tiền đang chảy như thế nào</h2>
            </div>
            <NavLink
              to="/admin/finance"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
            >
              Xem chi tiết tài chính
              <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[24px] border border-slate-200/70 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Doanh thu ròng ước tính</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{formatMoney(overview ? netRevenue : null)}</p>
              <p className="mt-2 text-sm text-slate-600">
                Sau khi trừ chi phí test và phần chia hoa hồng affiliate.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <MiniStat
                  label="Tổng lượt xuất PDF"
                  value={formatNumber(overview?.totalExports)}
                  icon={FileText}
                />
                <MiniStat
                  label="Đối tác hoạt động"
                  value={formatNumber(overview?.totalPartners)}
                  icon={Users}
                />
              </div>
            </div>

            <div className="space-y-4">
              {financeBreakdown.map((item) => {
                const Icon = item.trendIcon;
                return (
                  <div key={item.label} className="rounded-[22px] border border-slate-200/70 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.helper}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Icon className="h-4 w-4" />
                        {formatMoney(item.value)}
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${item.tone}`} style={{ width: item.width }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`${surfaceClassName} p-6`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Referral Pipeline
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Tắc nghẽn đang nằm ở đâu</h2>
            </div>
            <NavLink
              to="/admin/referrals"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
            >
              Mở referrals
              <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>

          <div className="mt-6 rounded-[24px] bg-[#fff9f2] p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Tổng referrals</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {formatNumber(referrals?.totalReferrals)}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Pending payout</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {formatMoney(referrals?.totalPendingCommission)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white">
              {referralDistribution.items.map((item) => (
                <div
                  key={item.label}
                  className={item.tone}
                  style={{ width: `${item.percent}%` }}
                  title={`${item.label}: ${formatNumber(item.value)}`}
                />
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {referralDistribution.items.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/80 bg-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <span className="text-sm font-medium text-slate-500">{formatPercent(item.percent)}</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{formatNumber(item.value)}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/90 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Hoa hồng đã chi trả</p>
                  <p className="mt-1 text-sm text-slate-500">Phần đã hoàn tất so với pipeline hiện tại</p>
                </div>
                <p className="text-base font-semibold text-slate-950">
                  {formatMoney(referrals?.totalPaidCommission)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className={`${surfaceClassName} p-6`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Quick Launch
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Đi thẳng vào đúng module</h2>
            </div>
            <NavLink
              to="/admin/settings"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
            >
              <Settings2 className="h-4 w-4" />
              Cài đặt hệ thống
            </NavLink>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((item) => (
              <ActionCard key={item.title} {...item} />
            ))}
          </div>
        </div>

        <div className={`${surfaceClassName} p-6`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Recent Activity
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Nhật ký hành động mới nhất</h2>
            </div>
            <NavLink
              to="/admin/audit-logs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>

          <div className="mt-6 space-y-3">
            {audits.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm font-medium text-slate-600">Chưa có bản ghi audit nào để hiển thị.</p>
              </div>
            ) : (
              audits.map((log) => (
                <div key={log.id} className="rounded-[22px] border border-slate-200/70 bg-slate-50/70 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                      {titleCase(log.actionType)}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                      {titleCase(log.entityType)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {log.description || "Không có mô tả chi tiết cho hành động này."}
                  </p>

                  <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500">
                    <span>{log.userName || log.userEmail || "Hệ thống tự động"}</span>
                    <span>{formatDateTime(log.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({ title, value, description, icon: Icon, tone }) => {
  const classes = metricToneClasses[tone] ?? metricToneClasses.slate;

  return (
    <article className={`rounded-[26px] border p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)] ${classes.panel}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className={`mt-3 text-3xl font-semibold leading-none ${classes.value}`}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${classes.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
};

const MiniStat = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
    <div className="flex items-center gap-2 text-slate-500">
      <Icon className="h-4 w-4" />
      <span className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</span>
    </div>
    <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
  </div>
);

const ActionCard = ({ title, description, to, stat, icon: Icon, tone }) => {
  const overlayClassName = actionToneClasses[tone] ?? actionToneClasses.slate;

  return (
    <NavLink
      to={to}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_44px_rgba(15,23,42,0.09)]"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${overlayClassName} opacity-100`} />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat}</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </NavLink>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-72 rounded-[36px] bg-slate-200/80" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-40 rounded-[26px] bg-slate-100" />
      ))}
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="h-[28rem] rounded-[28px] bg-slate-100" />
      <div className="h-[28rem] rounded-[28px] bg-slate-100" />
    </div>
  </div>
);

export default AdminDashboardPage;
