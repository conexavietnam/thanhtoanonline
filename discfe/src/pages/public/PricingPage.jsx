import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  FileText,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api.js";

const BillingLabels = {
  ONE_TIME: "Thanh toán một lần",
  MONTHLY: "Thanh toán hàng tháng",
  QUARTERLY: "Thanh toán hàng quý",
  YEARLY: "Thanh toán hàng năm",
};

const planSections = {
  user: {
    id: "user-plans",
    title: "Gói User",
    subtitle: "Dành cho cá nhân",
    description:
      "Phù hợp khi bạn muốn làm test DISC, mở khóa báo cáo sâu hơn và nhận gợi ý nghề nghiệp, lộ trình phát triển rõ ràng.",
    emptyText: "Hiện chưa có gói User nào được kích hoạt.",
    icon: User,
    iconClasses: "bg-primary/12 text-primary",
    accentClasses: "from-primary/12 via-white to-white",
    badgeClasses: "border-primary/20 bg-primary/10 text-primary",
  },
  partner: {
    id: "partner-plans",
    title: "Gói Partner",
    subtitle: "Dành cho đối tác",
    description:
      "Phù hợp cho coach, cộng tác viên và đơn vị triển khai DISC cho khách hàng, cần quản lý vận hành và mở rộng dịch vụ.",
    emptyText: "Hiện chưa có gói Partner nào được kích hoạt.",
    icon: Users,
    iconClasses: "bg-secondary/12 text-secondary",
    accentClasses: "from-secondary/12 via-white to-white",
    badgeClasses: "border-secondary/20 bg-secondary/10 text-secondary",
  },
};

const selectionGuides = [
  {
    title: "Bạn muốn hiểu mình trước",
    description: "Bắt đầu từ gói User để nhận insight cá nhân, nghề nghiệp và roadmap hành động rõ ràng.",
    icon: User,
    href: "#user-plans",
    cta: "Xem gói User",
    panelClasses: "border-primary/15 bg-white/80",
    iconClasses: "bg-primary/10 text-primary",
  },
  {
    title: "Bạn đang bán hoặc triển khai DISC",
    description: "Đi thẳng vào gói Partner nếu bạn cần mô hình vận hành, theo dõi khách hàng và mở rộng doanh thu.",
    icon: BriefcaseBusiness,
    href: "#partner-plans",
    cta: "Xem gói Partner",
    panelClasses: "border-secondary/15 bg-white/80",
    iconClasses: "bg-secondary/10 text-secondary",
  },
];

const faqs = [
  {
    question: "Tôi nên chọn gói User hay Partner?",
    answer:
      "Nếu bạn mua cho nhu cầu cá nhân, ưu tiên gói User. Nếu bạn cần dùng DISC như một dịch vụ cho khách hàng hoặc đội nhóm, gói Partner sẽ phù hợp hơn.",
  },
  {
    question: "Sau khi chọn gói, tôi thanh toán như thế nào?",
    answer:
      "Bạn sẽ được chuyển sang trang checkout để chọn phương thức thanh toán đang được hệ thống hỗ trợ. Nếu chưa đăng nhập, hệ thống sẽ yêu cầu đăng nhập trước.",
  },
  {
    question: "Nếu đang có gói rồi thì có đổi được không?",
    answer:
      "Trang này sẽ tự nhận biết gói hiện tại của bạn. Trong trường hợp tài khoản không được phép đổi gói, nút mua sẽ được khóa để tránh thao tác sai.",
  },
];

const viewportOptions = { once: true, amount: 0.2 };

const formatCurrency = (value, currency = "VND") => {
  const amount = Number(value) || 0;
  if (currency === "VND") {
    return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
  }
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ${currency}`;
};

const isPaidPlan = (plan) => Number(plan?.price) > 0 && String(plan?.code ?? "").trim().toUpperCase() !== "FREE";

const getStartingPrice = (plans) => {
  if (!Array.isArray(plans) || plans.length === 0) return null;

  const lowest = plans.reduce((currentLowest, plan) => {
    const price = Number(plan?.price);
    if (!Number.isFinite(price)) return currentLowest;
    return Math.min(currentLowest, price);
  }, Number.POSITIVE_INFINITY);

  return Number.isFinite(lowest) ? lowest : null;
};

const normalizeFeatures = (features) =>
  Array.from(features ?? [])
    .map((feature) => feature?.toString().trim())
    .filter(Boolean);

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userPlans, setUserPlans] = useState([]);
  const [partnerPlans, setPartnerPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchPlans = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const [userResponse, partnerResponse] = await Promise.all([
          api.get("/public/plans"),
          api.get("/public/plans/partner"),
        ]);

        if (cancelled) return;

        setUserPlans(Array.isArray(userResponse.data) ? userResponse.data.filter(isPaidPlan) : []);
        setPartnerPlans(Array.isArray(partnerResponse.data) ? partnerResponse.data.filter(isPaidPlan) : []);
      } catch (error) {
        console.error("Error loading plans:", error);
        if (cancelled) return;

        const message = "Không thể tải thông tin gói. Vui lòng thử lại.";
        setUserPlans([]);
        setPartnerPlans([]);
        setLoadError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPlans();

    return () => {
      cancelled = true;
    };
  }, [reloadSeed]);

  const hasAnyPlans = useMemo(
    () => (userPlans?.length || 0) + (partnerPlans?.length || 0) > 0,
    [userPlans, partnerPlans]
  );

  const userStartingPrice = useMemo(() => getStartingPrice(userPlans), [userPlans]);
  const partnerStartingPrice = useMemo(() => getStartingPrice(partnerPlans), [partnerPlans]);

  const spotlightPlan = useMemo(() => {
    const allPlans = [...userPlans, ...partnerPlans];
    return allPlans.find((plan) => plan.highlighted) ?? allPlans[0] ?? null;
  }, [partnerPlans, userPlans]);

  const stats = useMemo(
    () => [
      {
        label: "Gói User",
        value: userPlans.length > 0 ? `${userPlans.length} lựa chọn` : "Đang cập nhật",
        hint: userStartingPrice !== null ? `Từ ${formatCurrency(userStartingPrice)}` : "Sẽ hiển thị khi có gói",
      },
      {
        label: "Gói Partner",
        value: partnerPlans.length > 0 ? `${partnerPlans.length} lựa chọn` : "Đang cập nhật",
        hint:
          partnerStartingPrice !== null
            ? `Từ ${formatCurrency(partnerStartingPrice)}`
            : "Sẽ hiển thị khi có gói",
      },
      {
        label: "Trạng thái tài khoản",
        value: user?.activeSubscription?.planName ?? (hasAnyPlans ? "Sẵn sàng chọn gói" : "Chưa có dữ liệu"),
        hint: user?.activeSubscription?.preventPlanChange
          ? "Tài khoản hiện không hỗ trợ đổi gói"
          : "Checkout sẽ mở ngay khi bạn chọn gói",
      },
    ],
    [hasAnyPlans, partnerPlans.length, partnerStartingPrice, user?.activeSubscription?.planName, user?.activeSubscription?.preventPlanChange, userPlans.length, userStartingPrice]
  );

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-gradient-to-b from-primary/[0.09] via-white/50 to-transparent" />
      <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-32 h-80 w-80 rounded-full bg-secondary/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-10 sm:pt-14 lg:pt-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-2xl shadow-primary/10 backdrop-blur sm:p-8 lg:p-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Pricing
            </div>

            {user?.activeSubscription && (
              <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
                <BadgeCheck className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  Bạn đang dùng {user.activeSubscription.planName || user.activeSubscription.planCode}.
                </span>
              </div>
            )}

            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight text-base-content sm:text-5xl lg:text-6xl">
              Chọn gói DISC đúng nhịp phát triển của bạn.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-base-content/70">
              Bắt đầu từ nhu cầu cá nhân hoặc triển khai cho khách hàng. Trang này gom toàn bộ gói User và
              Partner vào một luồng chọn mua rõ ràng, để bạn đi từ tìm hiểu sang checkout nhanh hơn.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#user-plans" className="btn btn-primary btn-lg rounded-full px-6 shadow-lg shadow-primary/25">
                Xem gói User
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#partner-plans" className="btn btn-outline btn-lg rounded-full px-6">
                Xem gói Partner
              </a>
              <Link to="/contact" className="btn btn-ghost btn-lg rounded-full px-5 text-base-content/70">
                Cần tư vấn
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.08, duration: 0.4 }}
                  className="rounded-3xl border border-base-200/80 bg-white/80 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/45">{stat.label}</p>
                  <p className="mt-3 text-lg font-semibold text-base-content">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-base-content/60">{stat.hint}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="relative overflow-hidden rounded-[2rem] border border-base-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8"
          >
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute -right-16 top-12 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
            <div className="absolute -left-10 bottom-8 h-32 w-32 rounded-full bg-secondary/20 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Zap className="h-3.5 w-3.5" />
                Chọn nhanh
              </div>

              <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                Đi đúng lane ngay từ đầu.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Nếu bạn đang mua cho bản thân, đi thẳng vào nhóm User. Nếu bạn đang xây mô hình triển khai DISC
                cho khách hàng hoặc đội ngũ, ưu tiên nhóm Partner.
              </p>

              <div className="mt-6 space-y-3">
                {selectionGuides.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <div className="group rounded-3xl border border-white/10 bg-white/[0.05] p-4 transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-white">{item.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-white/65">{item.description}</p>
                          <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-white">
                            {item.cta}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );

                  if (item.href.startsWith("#")) {
                    return (
                      <a key={item.title} href={item.href} className="block">
                        {content}
                      </a>
                    );
                  }

                  return (
                    <Link key={item.title} to={item.href} className="block">
                      {content}
                    </Link>
                  );
                })}
              </div>

              {spotlightPlan && (
                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Gợi ý hiện tại</p>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">{spotlightPlan.name}</p>
                      <p className="mt-1 text-sm text-white/65">
                        {`${formatCurrency(spotlightPlan.price, spotlightPlan.currency)} • ${BillingLabels[spotlightPlan.billingCycle] ?? spotlightPlan.billingCycle}`}
                      </p>
                    </div>
                    <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                      {spotlightPlan.code}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOptions}
          transition={{ duration: 0.45 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <a href="#user-plans" className="btn btn-sm rounded-full border-primary/15 bg-white/80 px-4 text-primary hover:border-primary hover:bg-primary hover:text-white">
            <User className="h-4 w-4" />
            Gói User
          </a>
          <a href="#partner-plans" className="btn btn-sm rounded-full border-secondary/15 bg-white/80 px-4 text-secondary hover:border-secondary hover:bg-secondary hover:text-white">
            <Users className="h-4 w-4" />
            Gói Partner
          </a>
          <a href="#faq" className="btn btn-sm rounded-full border-base-200 bg-white/80 px-4 text-base-content/70">
            Câu hỏi thường gặp
          </a>
        </motion.div>

        {loadError ? (
          <div className="mt-10 rounded-[2rem] border border-error/20 bg-error/5 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-error">Không thể tải dữ liệu</p>
                <h2 className="mt-2 text-2xl font-semibold text-base-content">Thông tin gói hiện chưa sẵn sàng.</h2>
                <p className="mt-2 max-w-2xl text-base-content/65">{loadError}</p>
              </div>
              <button type="button" className="btn btn-primary rounded-full px-6" onClick={() => setReloadSeed((value) => value + 1)}>
                Tải lại
              </button>
            </div>
          </div>
        ) : loading ? (
          <PricingSkeleton />
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOptions}
              transition={{ duration: 0.45 }}
              className="mt-10 grid gap-4 lg:grid-cols-3"
            >
              {selectionGuides.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`rounded-[1.75rem] border p-5 shadow-lg shadow-slate-900/5 ${item.panelClasses}`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconClasses}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold tracking-tight text-base-content">{item.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-base-content/65">{item.description}</p>
                  </div>
                );
              })}
            </motion.section>

            <PlanSection
              config={planSections.user}
              plans={userPlans}
              user={user}
              navigate={navigate}
            />

            <PlanSection
              config={planSections.partner}
              plans={partnerPlans}
              user={user}
              navigate={navigate}
            />

            {!hasAnyPlans && (
              <div className="mt-14 rounded-[2rem] border border-dashed border-base-300 bg-white/60 p-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-base-content/45">Chưa có gói nào</p>
                <h2 className="mt-3 text-2xl font-semibold text-base-content">Hệ thống hiện chưa bật bảng giá công khai.</h2>
                <p className="mt-3 text-base-content/65">
                  Bạn có thể quay lại sau hoặc liên hệ đội ngũ để được tư vấn gói phù hợp.
                </p>
              </div>
            )}

            <motion.section
              id="faq"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOptions}
              transition={{ duration: 0.45 }}
              className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
            >
              <div className="rounded-[2rem] border border-base-200 bg-white/80 p-6 shadow-xl shadow-slate-900/5 sm:p-8">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  FAQ
                </p>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-base-content">
                  Những câu hỏi hay gặp trước khi mua.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-base-content/65">
                  Chúng tôi giữ luồng mua đơn giản: hiểu nhu cầu, chọn đúng nhóm gói, rồi đi sang checkout.
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-[1.5rem] border border-base-200 bg-white/80 p-5 shadow-lg shadow-slate-900/5"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-base-content">
                      <span>{item.question}</span>
                      <span className="rounded-full bg-base-200 p-2 text-base-content/55 transition-transform group-open:rotate-45">
                        <ArrowRight className="h-4 w-4 rotate-[-45deg]" />
                      </span>
                    </summary>
                    <p className="mt-4 text-sm leading-7 text-base-content/65">{item.answer}</p>
                  </details>
                ))}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOptions}
              transition={{ duration: 0.45 }}
              className="mt-6 overflow-hidden rounded-[2rem] border border-base-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8"
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                    <FileText className="h-3.5 w-3.5" />
                    Cần tư vấn thêm
                  </p>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                    Bạn cần đội ngũ hỗ trợ chọn gói phù hợp?
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
                    Nếu đang cân nhắc giữa nhu cầu cá nhân và mô hình partner, hãy để đội ngũ hỗ trợ giúp bạn rút gọn
                    phương án trước khi vào checkout.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/contact" className="btn btn-primary rounded-full px-6 shadow-lg shadow-primary/30">
                    Liên hệ tư vấn
                  </Link>
                  <Link to="/plans" className="btn btn-outline rounded-full border-white/20 px-6 text-white hover:bg-white hover:text-slate-900">
                    Xem bảng giá
                  </Link>
                </div>
              </div>
            </motion.section>
          </>
        )}
      </section>
    </div>
  );
};

const PlanSection = ({ config, plans, user, navigate }) => {
  const Icon = config.icon;
  const startingPrice = getStartingPrice(plans);

  return (
    <motion.section
      id={config.id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOptions}
      transition={{ duration: 0.45 }}
      className="scroll-mt-28 mt-14"
    >
      <div className={`overflow-hidden rounded-[2rem] border border-base-200 bg-gradient-to-br ${config.accentClasses} p-6 shadow-xl shadow-slate-900/5 sm:p-8`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.iconClasses}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/45">{config.subtitle}</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">{config.title}</h2>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-base leading-8 text-base-content/68">{config.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${config.badgeClasses}`}>
              <BadgeCheck className="h-4 w-4" />
              {plans.length > 0 ? `${plans.length} gói đang mở` : "Đang cập nhật"}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-base-200 bg-white/85 px-4 py-2 text-sm font-medium text-base-content/70">
              <Zap className="h-4 w-4 text-primary" />
              {startingPrice !== null ? `Từ ${formatCurrency(startingPrice)}` : "Chưa có giá công khai"}
            </div>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-base-300 bg-white/80 p-8 text-center text-base-content/65">
            {config.emptyText}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 xl:grid-cols-3">
            {plans.map((plan, index) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                user={user}
                navigate={navigate}
                featured={plan.highlighted}
                delay={index * 0.06}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
};

const PricingCard = ({ plan, user, navigate, featured, delay }) => {
  const features = normalizeFeatures(plan.features);
  const visibleFeatures = features.slice(0, 6);
  const hiddenFeatures = Math.max(0, features.length - visibleFeatures.length);
  const isCurrentPlan = user?.activeSubscription?.planCode === plan.code;
  const preventPlanChange = user?.activeSubscription?.preventPlanChange;
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOptions}
      transition={{ duration: 0.45, delay }}
      className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-6 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        featured
          ? "border-primary/25 bg-gradient-to-br from-white via-primary/[0.06] to-white"
          : "border-base-200 bg-white/90"
      }`}
    >
      {featured && (
        <div className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-primary/20">
          Nổi bật
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-base-200 bg-base-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/55">
          {plan.code}
        </span>
        {Number(plan.pdfExportLimit) > 0 && (
          <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            {plan.pdfExportLimit} lượt PDF
          </span>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-2xl font-semibold tracking-tight text-base-content">{plan.name}</h3>
        <p className="mt-3 min-h-[72px] text-sm leading-7 text-base-content/65">
          {plan.description || "Chưa có mô tả chi tiết cho gói này."}
        </p>
      </div>

      <div className="mt-6 flex items-end gap-2">
        <p className="text-4xl font-bold tracking-tight text-base-content">
          {formatCurrency(plan.price, plan.currency)}
        </p>
      </div>
      <p className="mt-2 text-sm text-base-content/55">
        {BillingLabels[plan.billingCycle] ?? plan.billingCycle}
      </p>

      <div className="mt-6 rounded-3xl border border-base-200/80 bg-base-100/80 p-4">
        <p className="text-sm font-semibold text-base-content">Những gì bạn nhận được</p>
        <ul className="mt-4 space-y-3 text-sm text-base-content/75">
          {visibleFeatures.length > 0 ? (
            visibleFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{feature.replace(/^[-*]\s*/, "")}</span>
              </li>
            ))
          ) : (
            <li className="text-base-content/55">Tính năng chi tiết sẽ hiển thị khi gói được cấu hình đầy đủ.</li>
          )}
        </ul>
        {hiddenFeatures > 0 && (
          <div className="mt-4 inline-flex rounded-full border border-base-200 bg-white px-3 py-1 text-xs font-medium text-base-content/55">
            +{hiddenFeatures} tính năng khác
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-3xl border border-base-200/80 bg-base-100/70 px-4 py-3 text-sm">
        <span className="text-base-content/55">Phù hợp cho</span>
        <span className="font-medium text-base-content">
          {Number(plan.pdfExportLimit) > 0 ? "Mở thêm báo cáo & tài nguyên" : "Nâng cấp trải nghiệm DISC"}
        </span>
      </div>

      <div className="mt-auto pt-6">
        {isCurrentPlan ? (
          <button
            type="button"
            className="btn btn-disabled w-full rounded-full border-none bg-base-300 text-base-content/50"
          >
            Đang sử dụng
          </button>
        ) : preventPlanChange ? (
          <button
            type="button"
            className="btn btn-disabled w-full rounded-full border-none bg-base-300 text-base-content/50"
          >
            Gói hiện tại không hỗ trợ chuyển đổi
          </button>
        ) : (
          <button
            type="button"
            className={`btn w-full rounded-full ${featured ? "btn-primary shadow-lg shadow-primary/20" : "btn-neutral"}`}
            onClick={() => navigate(`/checkout?plan=${plan.code}`)}
          >
            Chọn gói này
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.article>
  );
};

const PricingSkeleton = () => (
  <div className="mt-10 space-y-10">
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`summary-${index}`} className="h-44 animate-pulse rounded-[1.75rem] border border-base-200 bg-white/75" />
      ))}
    </div>

    {Array.from({ length: 2 }).map((_, sectionIndex) => (
      <div key={`section-${sectionIndex}`} className="rounded-[2rem] border border-base-200 bg-white/70 p-6 sm:p-8">
        <div className="h-24 animate-pulse rounded-[1.5rem] bg-base-200/70" />
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((__, cardIndex) => (
            <div key={`card-${sectionIndex}-${cardIndex}`} className="h-[430px] animate-pulse rounded-[1.75rem] bg-base-200/70" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default PricingPage;
