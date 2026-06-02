import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api, { uploadAPI, buildAssetUrl } from "../../lib/api.js";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_COMPANY_INFO } from "../../constants/companyInfo.js";
import LandingPageEditor from "../../features/admin/settings/components/LandingPageEditor";
import PdfTemplateEditor from "../../features/admin/settings/components/PdfTemplateEditor";
import PdfVariableManager from "../../features/admin/settings/components/PdfVariableManager";
import { cloneHomepageSlides } from "../../constants/homepageSlides.js";
import {
  createDefaultPdfTemplateConfig,
  createDefaultPdfTemplateConfigPaid,
} from "../../features/admin/settings/pdfTemplateDefaults.js";


const BANKS = [
  { code: "ICB", name: "VietinBank", bin: "970415" },
  { code: "VCB", name: "Vietcombank", bin: "970436" },
  { code: "BIDV", name: "BIDV", bin: "970418" },
  { code: "VBA", name: "Agribank", bin: "970405" },
  { code: "OCB", name: "OCB", bin: "970448" },
  { code: "MB", name: "MBBank", bin: "970422" },
  { code: "TCB", name: "Techcombank", bin: "970407" },
  { code: "ACB", name: "ACB", bin: "970416" },
  { code: "VPB", name: "VPBank", bin: "970432" },
  { code: "TPB", name: "TPBank", bin: "970423" },
  { code: "STB", name: "Sacombank", bin: "970403" },
  { code: "HDB", name: "HDBank", bin: "970437" },
  { code: "VCCB", name: "VietCapitalBank", bin: "970454" },
  { code: "SCB", name: "SCB", bin: "970429" },
  { code: "VIB", name: "VIB", bin: "970441" },
  { code: "SHB", name: "SHB", bin: "970443" },
  { code: "EIB", name: "Eximbank", bin: "970431" },
  { code: "MSB", name: "MSB", bin: "970426" },
  { code: "CAKE", name: "CAKE", bin: "546034" },
  { code: "Ubank", name: "Ubank", bin: "546035" },
  { code: "VTLMONEY", name: "ViettelMoney", bin: "971005" },
  { code: "TIMO", name: "Timo", bin: "963388" },
  { code: "VNPTMONEY", name: "VNPTMoney", bin: "971011" },
  { code: "SGICB", name: "SaigonBank", bin: "970400" },
  { code: "BAB", name: "BacABank", bin: "970409" },
  { code: "momo", name: "MoMo", bin: "971025" },
  { code: "PVDB", name: "PVcomBank Pay", bin: "971133" },
  { code: "PVCB", name: "PVcomBank", bin: "970412" },
  { code: "MBV", name: "MBV", bin: "970414" },
  { code: "NCB", name: "NCB", bin: "970419" },
  { code: "SHBVN", name: "ShinhanBank", bin: "970424" },
  { code: "ABB", name: "ABBANK", bin: "970425" },
  { code: "VAB", name: "VietABank", bin: "970427" },
  { code: "NAB", name: "NamABank", bin: "970428" },
  { code: "PGB", name: "PGBank", bin: "970430" },
  { code: "VIETBANK", name: "VietBank", bin: "970433" },
  { code: "BVB", name: "BaoVietBank", bin: "970438" },
  { code: "SEAB", name: "SeABank", bin: "970440" },
  { code: "COOPBANK", name: "COOPBANK", bin: "970446" },
  { code: "LPB", name: "LPBank", bin: "970449" },
  { code: "KLB", name: "KienLongBank", bin: "970452" },
  { code: "KBank", name: "KBank", bin: "668888" },
  { code: "MAFC", name: "MAFC", bin: "977777" },
  { code: "HLBVN", name: "HongLeong", bin: "970442" },
  { code: "KEBHANAHN", name: "KEBHANAHN", bin: "970467" },
  { code: "KEBHANAHCM", name: "KEBHanaHCM", bin: "970466" },
  { code: "CITIBANK", name: "Citibank", bin: "533948" },
  { code: "CBB", name: "CBBank", bin: "970444" },
  { code: "CIMB", name: "CIMB", bin: "422589" },
  { code: "DBS", name: "DBSBank", bin: "796500" },
  { code: "Vikki", name: "Vikki", bin: "970406" },
  { code: "VBSP", name: "VBSP", bin: "999888" },
  { code: "GPB", name: "GPBank", bin: "970408" },
  { code: "KBHCM", name: "KookminHCM", bin: "970463" },
  { code: "KBHN", name: "KookminHN", bin: "970462" },
  { code: "WVN", name: "Woori", bin: "970457" },
  { code: "VRB", name: "VRB", bin: "970421" },
  { code: "HSBC", name: "HSBC", bin: "458761" },
  { code: "IBK - HN", name: "IBKHN", bin: "970455" },
  { code: "IBK - HCM", name: "IBKHCM", bin: "970456" },
  { code: "IVB", name: "IndovinaBank", bin: "970434" },
  { code: "UOB", name: "UnitedOverseas", bin: "970458" },
  { code: "NHB HN", name: "Nonghyup", bin: "801011" },
  { code: "SCVN", name: "StandardChartered", bin: "970410" },
  { code: "PBVN", name: "PublicBank", bin: "970439" }
];

const createEmptyQuestionDistribution = () => ({
  disc: 0,
  bigFive: 0,
  ikigai: 0,
});

const createEmptyQuestionAvailability = () => ({
  free: createEmptyQuestionDistribution(),
  paid: createEmptyQuestionDistribution(),
});

const QUESTION_DISTRIBUTION_FIELDS = [
  { key: "disc", label: "DISC" },
  { key: "bigFive", label: "Big Five" },
  { key: "ikigai", label: "Ikigai" },
];

const normalizeQuestionCount = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return fallback;
};

const normalizeQuestionDistribution = (value, fallback = createEmptyQuestionDistribution()) => {
  const source = value && typeof value === "object" ? value : {};
  return {
    disc: normalizeQuestionCount(source.disc, fallback.disc ?? 0),
    bigFive: normalizeQuestionCount(source.bigFive, fallback.bigFive ?? 0),
    ikigai: normalizeQuestionCount(source.ikigai, fallback.ikigai ?? 0),
  };
};

const sumQuestionDistribution = (distribution) => (
  normalizeQuestionCount(distribution?.disc)
  + normalizeQuestionCount(distribution?.bigFive)
  + normalizeQuestionCount(distribution?.ikigai)
);


const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showPdfEditor, setShowPdfEditor] = useState(false);
  const [showPdfVariableManager, setShowPdfVariableManager] = useState(false);
  const [showLandingPageEditor, setShowLandingPageEditor] = useState(false);
  const unauthorizedToastShown = useRef(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState(null);
  const logoInputRef = useRef(null);
  const [availableQuestionCounts, setAvailableQuestionCounts] = useState(createEmptyQuestionAvailability());

  const [settings, setSettings] = useState({
    siteName: "DISCWAKE",
    siteDescription: "Hệ thống đánh giá DISC",
    primaryColor: "",
    secondaryColor: "",
    logoUrl: "",
    maintenanceMode: false,
    allowRegistration: true,
    maxUsersPerPlan: 1000,
    defaultSubscriptionDays: 30,
    referralCommissionRate: 10,
    maxQuestionsPerTest: 28,
    maxQuestionsPerTestFree: 14,
    questionDistributionFree: createEmptyQuestionDistribution(),
    questionDistributionPaid: createEmptyQuestionDistribution(),
    emailNotifications: true,
    smsNotifications: false,
    zaloGroupLink: "",
    adminFeatureVisibility: {
      showUsers: true,
      showPlans: true,
      showQuestions: true,
      showCareers: true,
      showInsights: true,
      showDevelopmentPlans: true,
      showSubscriptions: true,
      showPayments: true,
      showReferrals: true,
      showPartners: true,
      showPartnerCustomizations: true,
      showReports: true,
      showAuditLogs: true,
      showSettings: true,
    },
    customHomepageHtml: "",
    footerDescription: "",
    companyName: DEFAULT_COMPANY_INFO.companyName,
    companyAddress: DEFAULT_COMPANY_INFO.companyAddress,
    contactPhone: DEFAULT_COMPANY_INFO.contactPhone,
    contactZalo: DEFAULT_COMPANY_INFO.contactZalo,
    contactEmail: "",
    socialFacebook: "",
    socialYoutube: "",
    homepageSlides: cloneHomepageSlides(),
    landingPageConfig: {},
    pdfTemplateConfig: createDefaultPdfTemplateConfig(),
    pdfTemplateConfigPaid: createDefaultPdfTemplateConfigPaid(),
    pdfCustomVariables: [],
    bankId: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  useEffect(() => {
    if (!user?.roles?.includes("SUPER_ADMIN")) {
      if (!unauthorizedToastShown.current) {
        toast.error("⛔ Bạn không có quyền truy cập trang này");
        unauthorizedToastShown.current = true;
      }
    }
  }, [user]);

  const tabs = [
    {
      id: "general", label: "Chung", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },

    {
      id: "branding", label: "Giao diện", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      id: "contact", label: "Liên hệ & Footer", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: "payment", label: "Thanh toán", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: "system", label: "Hệ thống", icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { id: "landing_page", label: "Trang chủ", icon: <i className="ri-layout-line text-xl"></i> },
    { id: "config_pdf", label: "Cấu hình PDF", icon: <i className="ri-file-pdf-line text-xl"></i> },
    { id: "slideshow", label: "Slideshow", icon: <i className="ri-slideshow-line text-xl"></i> },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadAvailableQuestionCounts = async () => {
    const results = await Promise.allSettled([
      api.get("/admin/questions", { params: { testCode: "DISC_FREE" } }),
      api.get("/admin/questions", { params: { testCode: "DISC_PAID" } }),
      api.get("/admin/questions", { params: { testCode: "BIG_FIVE" } }),
      api.get("/admin/questions", { params: { testCode: "IKIGAI" } }),
    ]);

    const getCount = (result) => (
      result.status === "fulfilled" && Array.isArray(result.value?.data)
        ? result.value.data.length
        : 0
    );

    const discFreeCount = getCount(results[0]);
    const discPaidCount = getCount(results[1]);
    const bigFiveCount = getCount(results[2]);
    const ikigaiCount = getCount(results[3]);

    return {
      free: {
        disc: discFreeCount,
        bigFive: bigFiveCount,
        ikigai: ikigaiCount,
      },
      paid: {
        disc: discPaidCount > 0 ? discPaidCount : discFreeCount,
        bigFive: bigFiveCount,
        ikigai: ikigaiCount,
      },
    };
  };

  const buildSettingsPayload = (sourceSettings, fallbackAvailability = availableQuestionCounts) => {
    const questionDistributionFree = normalizeQuestionDistribution(
      sourceSettings.questionDistributionFree,
      fallbackAvailability.free
    );
    const questionDistributionPaid = normalizeQuestionDistribution(
      sourceSettings.questionDistributionPaid,
      fallbackAvailability.paid
    );

    return {
      ...sourceSettings,
      questionDistributionFree,
      questionDistributionPaid,
      maxQuestionsPerTestFree: sumQuestionDistribution(questionDistributionFree),
      maxQuestionsPerTest: sumQuestionDistribution(questionDistributionPaid),
    };
  };

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data }, counts] = await Promise.all([
        api.get("/admin/settings"),
        loadAvailableQuestionCounts(),
      ]);
      const resolvedCounts = counts || createEmptyQuestionAvailability();
      const questionDistributionFree = normalizeQuestionDistribution(
        data.questionDistributionFree,
        resolvedCounts.free
      );
      const questionDistributionPaid = normalizeQuestionDistribution(
        data.questionDistributionPaid,
        resolvedCounts.paid
      );

      setAvailableQuestionCounts(resolvedCounts);
      setSettings({
        siteName: data.siteName || "DISCWAKE",
        siteDescription: data.siteDescription || "Hệ thống đánh giá DISC",
        primaryColor: data.primaryColor || "",
        secondaryColor: data.secondaryColor || "",
        logoUrl: data.logoUrl || "",
        maintenanceMode: data.maintenanceMode || false,
        allowRegistration: data.allowRegistration !== undefined ? data.allowRegistration : true,
        maxUsersPerPlan: data.maxUsersPerPlan || 1000,
        defaultSubscriptionDays: data.defaultSubscriptionDays || 30,
        referralCommissionRate: data.referralCommissionRate || 10,
        maxQuestionsPerTest: sumQuestionDistribution(questionDistributionPaid),
        maxQuestionsPerTestFree: sumQuestionDistribution(questionDistributionFree),
        questionDistributionFree,
        questionDistributionPaid,
        emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : true,
        smsNotifications: data.smsNotifications || false,
        zaloGroupLink: data.zaloGroupLink || "",
        adminFeatureVisibility: data.adminFeatureVisibility || {
          showUsers: true,
          showPlans: true,
          showQuestions: true,
          showCareers: true,
          showInsights: true,
          showDevelopmentPlans: true,
          showSubscriptions: true,
          showPayments: true,
          showReferrals: true,
          showPartners: true,
          showPartnerCustomizations: true,
          showReports: true,
          showAuditLogs: true,
          showSettings: true,
        },
        customHomepageHtml: data.customHomepageHtml || "",
        footerDescription: data.footerDescription || "",
        companyName: data.companyName || DEFAULT_COMPANY_INFO.companyName,
        companyAddress: data.companyAddress || DEFAULT_COMPANY_INFO.companyAddress,
        contactPhone: data.contactPhone || DEFAULT_COMPANY_INFO.contactPhone,
        contactZalo: data.contactZalo || DEFAULT_COMPANY_INFO.contactZalo,
        contactEmail: data.contactEmail || "",
        socialFacebook: data.socialFacebook || "",
        socialYoutube: data.socialYoutube || "",
        homepageSlides: Array.isArray(data.homepageSlides) ? data.homepageSlides : cloneHomepageSlides(),
        landingPageConfig: data.landingPageConfig || {},
        pdfTemplateConfig: data.pdfTemplateConfig ?? createDefaultPdfTemplateConfig(),
        pdfTemplateConfigPaid: data.pdfTemplateConfigPaid ?? createDefaultPdfTemplateConfigPaid(),
        pdfCustomVariables: data.pdfCustomVariables || [],
        bankId: data.bankId || "",
        bankName: data.bankName || "",
        accountNumber: data.accountNumber || "",
        accountName: data.accountName || "",
      });
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateSettings = (newSettings) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const handleQuestionDistributionChange = (field, framework, value) => {
    setSettings((prev) => {
      const nextDistribution = {
        ...normalizeQuestionDistribution(prev[field]),
        [framework]: normalizeQuestionCount(value),
      };

      return {
        ...prev,
        [field]: nextDistribution,
        ...(field === "questionDistributionPaid"
          ? { maxQuestionsPerTest: sumQuestionDistribution(nextDistribution) }
          : { maxQuestionsPerTestFree: sumQuestionDistribution(nextDistribution) }),
      };
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate request
    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error("File quá lớn. Vui lòng chọn ảnh dưới 2MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh.");
      return;
    }

    setUploadingLogo(true);
    try {
      const { data } = await uploadAPI.upload(file);
      // Backend returns { url: "/uploads/filename..." }
      handleChange("logoUrl", data.url);
      toast.success("Upload logo thành công!");
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload thất bại. Vui lòng thử lại.");
    } finally {
      setUploadingLogo(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleAddSlide = () => {
    setSettings((prev) => ({
      ...prev,
      homepageSlides: [
        ...(Array.isArray(prev.homepageSlides) ? prev.homepageSlides : []),
        { imageUrl: "", link: "", title: "", altText: "" },
      ],
    }));
  };

  const handleSlideChange = (index, field, value) => {
    setSettings((prev) => ({
      ...prev,
      homepageSlides: (Array.isArray(prev.homepageSlides) ? prev.homepageSlides : []).map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: value } : slide
      ),
    }));
  };

  const handleRemoveSlide = (index) => {
    setSettings((prev) => ({
      ...prev,
      homepageSlides: (Array.isArray(prev.homepageSlides) ? prev.homepageSlides : []).filter((_, slideIndex) => slideIndex !== index),
    }));
  };

  const handleMoveSlide = (index, direction) => {
    setSettings((prev) => {
      const slides = [...(Array.isArray(prev.homepageSlides) ? prev.homepageSlides : [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= slides.length) {
        return prev;
      }
      [slides[index], slides[targetIndex]] = [slides[targetIndex], slides[index]];
      return { ...prev, homepageSlides: slides };
    });
  };

  const handleSlideImageUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File quá lớn. Vui lòng chọn ảnh dưới 2MB.");
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh.");
      e.target.value = "";
      return;
    }

    setUploadingSlideIndex(index);
    try {
      const { data } = await uploadAPI.upload(file);
      handleSlideChange(index, "imageUrl", data.url);
      toast.success("Upload ảnh slide thành công!");
    } catch (err) {
      console.error("Slide upload failed", err);
      toast.error("Upload ảnh slide thất bại. Vui lòng thử lại.");
    } finally {
      setUploadingSlideIndex(null);
      e.target.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = buildSettingsPayload(settings);
      await api.put('/admin/settings', payload);
      setMessage("Cài đặt đã được lưu thành công!");
      await loadSettings();
    } catch (err) {
      console.error("Failed to save settings:", err);
      setMessage("Cài đặt đã được lưu (Simulation)");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Bạn chắc chắn muốn đặt lại về mặc định? Tất cả cài đặt sẽ được khôi phục về giá trị mặc định.")) return;

    setSaving(true);
    setError(null);
    try {
      const defaultSettings = buildSettingsPayload({
        siteName: "DISCWAKE",
        siteDescription: "Hệ thống đánh giá DISC",
        primaryColor: "",
        secondaryColor: "",
        logoUrl: "",
        maintenanceMode: false,
        allowRegistration: true,
        maxUsersPerPlan: 1000,
        defaultSubscriptionDays: 30,
        referralCommissionRate: 10,
        maxQuestionsPerTest: sumQuestionDistribution(availableQuestionCounts.paid),
        maxQuestionsPerTestFree: sumQuestionDistribution(availableQuestionCounts.free),
        questionDistributionFree: availableQuestionCounts.free,
        questionDistributionPaid: availableQuestionCounts.paid,
        emailNotifications: true,
        smsNotifications: false,
        zaloGroupLink: "",
        adminFeatureVisibility: settings.adminFeatureVisibility,
        companyName: DEFAULT_COMPANY_INFO.companyName,
        companyAddress: DEFAULT_COMPANY_INFO.companyAddress,
        homepageSlides: cloneHomepageSlides(),
        landingPageConfig: {},
        contactPhone: DEFAULT_COMPANY_INFO.contactPhone,
        contactZalo: DEFAULT_COMPANY_INFO.contactZalo,
        contactEmail: "",
        footerDescription: "",
        pdfTemplateConfig: createDefaultPdfTemplateConfig(),
        pdfTemplateConfigPaid: createDefaultPdfTemplateConfigPaid(),
        pdfCustomVariables: [],
        bankId: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
      }, availableQuestionCounts);

      await api.put('/admin/settings', defaultSettings);
      setMessage("Đã đặt lại về mặc định thành công!");
      await loadSettings();
    } catch (err) {
      setMessage("Đã reset (Simulation)");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveData = async (dataToMerge) => {
    const updatedSettings = buildSettingsPayload({ ...settings, ...dataToMerge });
    setSettings(updatedSettings);

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await api.put('/admin/settings', updatedSettings);
      setMessage("Cài đặt đã được lưu thành công!");
      await loadSettings();
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Lỗi khi lưu cài đặt: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (!user?.roles?.includes("SUPER_ADMIN")) {
    toast.error("⛔ Bạn không có quyền truy cập trang này");
    return (
      <div className="text-center py-10 text-base-content/60">
        ⛔ Bạn không có quyền truy cập trang này
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 px-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Cài đặt hệ thống
          </h2>
          <p className="text-base-content/60 mt-2">
            Quản lý cấu hình chung, giao diện và các thông số mặc định của hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleReset}
            disabled={saving}
          >
            Đặt lại mặc định
          </button>
          <button
            type="button"
            className="btn btn-primary px-6 shadow-lg shadow-primary/30"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <span className="loading loading-spinner"></span> : "Lưu thay đổi"}
          </button>
        </div>
      </header>

      {/* Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="alert alert-success bg-success/10 border-success/20 shadow-lg mb-4"
          >
            <span>{message}</span>
            <button className="btn btn-ghost btn-xs" onClick={() => setMessage(null)}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-base-100 rounded-2xl shadow-lg p-2 sticky top-24">
            <ul className="menu w-full gap-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`${activeTab === tab.id ? "active bg-primary text-primary-content font-bold" : "text-base-content/70"}`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="space-y-6">

            {/* General Settings */}
            {activeTab === "general" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <section className="card bg-base-100 shadow-xl overflow-hidden">
                  <div className="card-body p-6 space-y-6">
                    <h3 className="card-title text-lg flex items-center gap-2 text-primary border-b border-base-200 pb-4 mb-4">
                      Thông tin chung
                    </h3>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Tên hệ thống</label>
                        <input
                          type="text"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.siteName}
                          onChange={(e) => handleChange("siteName", e.target.value)}
                          placeholder="DISCWAKE"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Mô tả hệ thống</label>
                        <input
                          type="text"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.siteDescription}
                          onChange={(e) => handleChange("siteDescription", e.target.value)}
                          placeholder="Hệ thống đánh giá DISC"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* Branding Settings */}
            {activeTab === "branding" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <section className="card bg-base-100 shadow-xl overflow-hidden">
                  <div className="card-body p-6 space-y-6">
                    <h3 className="card-title text-lg flex items-center gap-2 text-primary border-b border-base-200 pb-4 mb-4">
                      Màu sắc & Logo
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Màu chính (Primary)</label>
                        <div className="flex gap-3 items-center p-3 border border-base-200 rounded-lg bg-base-200/50">
                          <div
                            className="w-10 h-10 rounded-full shadow-sm border border-base-300"
                            style={{ backgroundColor: settings.primaryColor || "#570df8" }}
                          />
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              className="input input-ghost input-sm w-full"
                              value={settings.primaryColor || ""}
                              onChange={(e) => handleChange("primaryColor", e.target.value)}
                              placeholder="#570df8"
                            />
                            <input
                              type="color"
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                              value={settings.primaryColor || "#570df8"}
                              onChange={(e) => handleChange("primaryColor", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Màu phụ (Secondary)</label>
                        <div className="flex gap-3 items-center p-3 border border-base-200 rounded-lg bg-base-200/50">
                          <div
                            className="w-10 h-10 rounded-full shadow-sm border border-base-300"
                            style={{ backgroundColor: settings.secondaryColor || "#f000b8" }}
                          />
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              className="input input-ghost input-sm w-full"
                              value={settings.secondaryColor || ""}
                              onChange={(e) => handleChange("secondaryColor", e.target.value)}
                              placeholder="#f000b8"
                            />
                            <input
                              type="color"
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                              value={settings.secondaryColor || "#f000b8"}
                              onChange={(e) => handleChange("secondaryColor", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label text-xs font-bold uppercase text-base-content/50">Logo Hệ thống</label>
                      <div className="flex flex-col gap-4">
                        {/* Preview */}
                        <div className="flex items-center gap-6 p-4 border border-base-200 rounded-xl bg-base-200/30">
                          <div className="w-24 h-24 flex items-center justify-center bg-base-100 rounded-lg border border-base-200 shadow-sm overflow-hidden relative">
                            {settings.logoUrl ? (
                              <img
                                src={buildAssetUrl(settings.logoUrl)}
                                alt="Logo"
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/150?text=No+Logo";
                                }}
                              />
                            ) : (
                              <span className="text-xs text-base-content/40">No Logo</span>
                            )}
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary gap-2"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={uploadingLogo}
                              >
                                {uploadingLogo ? <span className="loading loading-spinner loading-xs"></span> : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                Upload Logo mới
                              </button>
                              <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoUpload}
                              />
                              {settings.logoUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleChange("logoUrl", "")}
                                  className="btn btn-sm btn-ghost text-error"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-base-content/60">
                              Hỗ trợ định dạng PNG, JPG. Kích thước tối ưu: chiều cao 40-60px.
                            </p>
                          </div>
                        </div>

                        {/* URL Input Fallback */}
                        <div className="collapse collapse-arrow bg-base-100 border border-base-200 rounded-lg">
                          <input type="checkbox" />
                          <div className="collapse-title text-sm font-medium">
                            Hoặc nhập URL ảnh thủ công
                          </div>
                          <div className="collapse-content">
                            <input
                              type="text"
                              className="input input-bordered input-sm w-full focus:input-primary"
                              value={settings.logoUrl || ""}
                              onChange={(e) => handleChange("logoUrl", e.target.value)}
                              placeholder="https://example.com/logo.png"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="card bg-base-100 shadow-xl overflow-hidden">
                  <div className="card-body p-6 space-y-6">
                    <h3 className="card-title text-lg flex items-center gap-2 text-accent border-b border-base-200 pb-4 mb-4">
                      Custom HTML (Landing Page)
                    </h3>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold uppercase text-base-content/50">Mã HTML tùy chỉnh</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-48 font-mono text-sm w-full leading-normal bg-base-200/50"
                        value={settings.customHomepageHtml || ""}
                        onChange={(e) => handleChange("customHomepageHtml", e.target.value)}
                        placeholder="<!-- Mã HTML sẽ thay thế toàn bộ Landing Page -->"
                      ></textarea>
                      <label className="label">
                        <span className="label-text-alt text-base-content/60">
                          <span className="text-warning">Lưu ý:</span> Mã này sẽ thay thế hoàn toàn giao diện Landing Page mặc định.
                        </span>
                      </label>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* Contact Settings */}
            {activeTab === "contact" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <section className="card bg-base-100 shadow-xl overflow-hidden">
                  <div className="card-body p-6 space-y-6">
                    <h3 className="card-title text-lg flex items-center gap-2 text-secondary border-b border-base-200 pb-4 mb-4">
                      Thông tin liên hệ & Footer
                    </h3>

                    <div className="form-control">
                      <label className="label text-xs font-bold uppercase text-base-content/50">Tên công ty</label>
                      <input
                        type="text"
                        className="input input-bordered focus:input-primary bg-base-200/50"
                        value={settings.companyName || ""}
                        onChange={(e) => handleChange("companyName", e.target.value)}
                        placeholder={DEFAULT_COMPANY_INFO.companyName}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label text-xs font-bold uppercase text-base-content/50">Mô tả Footer</label>
                      <input
                        type="text"
                        className="input input-bordered focus:input-primary bg-base-200/50"
                        value={settings.footerDescription || ""}
                        onChange={(e) => handleChange("footerDescription", e.target.value)}
                        placeholder="Mô tả ngắn về hệ thống..."
                      />
                    </div>

                    <div className="form-control">
                      <label className="label text-xs font-bold uppercase text-base-content/50">Địa chỉ công ty</label>
                      <textarea
                        className="textarea textarea-bordered focus:textarea-primary bg-base-200/50 min-h-28"
                        value={settings.companyAddress || ""}
                        onChange={(e) => handleChange("companyAddress", e.target.value)}
                        placeholder={DEFAULT_COMPANY_INFO.companyAddress}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Số điện thoại</label>
                        <input
                          type="text"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.contactPhone || ""}
                          onChange={(e) => handleChange("contactPhone", e.target.value)}
                          placeholder={DEFAULT_COMPANY_INFO.contactPhone}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Zalo liên hệ</label>
                        <input
                          type="text"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.contactZalo || ""}
                          onChange={(e) => handleChange("contactZalo", e.target.value)}
                          placeholder={DEFAULT_COMPANY_INFO.contactZalo}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Email liên hệ</label>
                        <input
                          type="email"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.contactEmail || ""}
                          onChange={(e) => handleChange("contactEmail", e.target.value)}
                          placeholder="support@domain.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Link Facebook</label>
                        <input
                          type="url"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.socialFacebook || ""}
                          onChange={(e) => handleChange("socialFacebook", e.target.value)}
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Link Youtube</label>
                        <input
                          type="url"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.socialYoutube || ""}
                          onChange={(e) => handleChange("socialYoutube", e.target.value)}
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* Payment Settings */}
            {activeTab === "payment" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <section className="card bg-base-100 shadow-xl overflow-hidden">
                  <div className="card-body p-6 space-y-6">
                    <h3 className="card-title text-lg flex items-center gap-2 text-success border-b border-base-200 pb-4 mb-4">
                      Thông tin chuyển khoản
                    </h3>

                    <div className="alert alert-info bg-info/10 border-info/20 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>Thông tin này sẽ được hiển thị cho người dùng khi họ chọn thanh toán chuyển khoản.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Ngân hàng</label>
                        <select
                          className="select select-bordered w-full focus:select-primary bg-base-200/50"
                          value={settings.bankId || ""}
                          onChange={(e) => {
                            const selectedBank = BANKS.find(b => b.code === e.target.value);
                            handleChange("bankId", e.target.value);
                            if (selectedBank) {
                              handleChange("bankName", selectedBank.name);
                            }
                          }}
                        >
                          <option value="">-- Chọn ngân hàng --</option>
                          {BANKS.map((bank) => (
                            <option key={bank.code} value={bank.code}>
                              ({bank.bin}) {bank.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Số tài khoản</label>
                        <input
                          type="text"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.accountNumber || ""}
                          onChange={(e) => handleChange("accountNumber", e.target.value)}
                          placeholder="VD: 1903..."
                        />
                      </div>

                      <div className="form-control md:col-span-2">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Tên chủ tài khoản</label>
                        <input
                          type="text"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.accountName || ""}
                          onChange={(e) => handleChange("accountName", e.target.value)}
                          placeholder="VD: NGUYEN VAN A"
                        />
                      </div>
                    </div>

                    {settings.bankId && settings.accountNumber && (
                      <div className="mt-4 p-4 bg-base-200 rounded-lg flex items-center gap-4">
                        <div className="text-sm font-medium">QR Preview:</div>
                        <img
                          src={`https://img.vietqr.io/image/${settings.bankId}-${settings.accountNumber}-compact2.png?amount=0&addInfo=Thanh toan dich vu&accountName=${encodeURIComponent(settings.accountName || "")}`}
                          alt="VietQR"
                          className="h-32 object-contain bg-white p-2 rounded border"
                        />

                      </div>
                    )}

                  </div>
                </section>
              </motion.div>
            )}

            {/* System Settings */}
            {activeTab === "system" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <section className="card bg-base-100 shadow-xl overflow-hidden">
                  <div className="card-body p-6 space-y-6">
                    <h3 className="card-title text-lg flex items-center gap-2 text-warning border-b border-base-200 pb-4 mb-4">
                      Cấu hình hệ thống
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-control p-4 border border-base-200 rounded-xl hover:border-warning/30 transition-colors bg-warning/5">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input
                            type="checkbox"
                            className="toggle toggle-warning"
                            checked={settings.maintenanceMode}
                            onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                          />
                          <div>
                            <span className="label-text font-bold text-base text-warning-content/80">Chế độ bảo trì</span>
                            <p className="text-xs text-base-content/60 mt-0.5">Chỉ Admin mới có thể đăng nhập</p>
                          </div>
                        </label>
                      </div>

                      <div className="form-control p-4 border border-base-200 rounded-xl hover:border-primary/30 transition-colors">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={settings.allowRegistration}
                            onChange={(e) => handleChange("allowRegistration", e.target.checked)}
                          />
                          <div>
                            <span className="label-text font-bold text-base">Cho phép đăng ký</span>
                            <p className="text-xs text-base-content/60 mt-0.5">Người dùng mới có thể tạo tài khoản</p>
                          </div>
                        </label>
                      </div>

                      <div className="form-control p-4 border border-base-200 rounded-xl hover:border-primary/30 transition-colors">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={settings.emailNotifications}
                            onChange={(e) => handleChange("emailNotifications", e.target.checked)}
                          />
                          <div>
                            <span className="label-text font-bold text-base">Thông báo Email</span>
                            <p className="text-xs text-base-content/60 mt-0.5">Gửi email hệ thống</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="divider opacity-50">Giới hạn & Tham số</div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Subscription mặc định (Ngày)</label>
                        <input
                          type="number"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.defaultSubscriptionDays}
                          onChange={(e) => handleChange("defaultSubscriptionDays", parseInt(e.target.value))}
                          min={1}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Hoa hồng Referral (%)</label>
                        <input
                          type="number"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.referralCommissionRate}
                          onChange={(e) => handleChange("referralCommissionRate", parseFloat(e.target.value))}
                          min={0} max={100}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Link nhóm Zalo</label>
                        <input
                          type="text"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.zaloGroupLink}
                          onChange={(e) => handleChange("zaloGroupLink", e.target.value)}
                          placeholder="https://zalo.me/..."
                        />
                      </div>

                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Số câu hỏi (VIP)</label>
                        <input
                          type="number"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.maxQuestionsPerTest}
                          readOnly
                          min={1}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label text-xs font-bold uppercase text-base-content/50">Số câu hỏi (Free)</label>
                        <input
                          type="number"
                          className="input input-bordered focus:input-primary bg-base-200/50"
                          value={settings.maxQuestionsPerTestFree}
                          readOnly
                          min={1}
                        />
                      </div>

                      <div className="md:col-span-3 grid gap-4 xl:grid-cols-2">
                        <div className="rounded-2xl border border-base-200 bg-base-200/30 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold uppercase text-base-content/70">Bo cau hoi Free</p>
                              <p className="text-xs text-base-content/60 mt-1">Cau hinh rieng so cau DISC, Big Five va Ikigai cho bai free.</p>
                            </div>
                            <span className="badge badge-outline">{sumQuestionDistribution(settings.questionDistributionFree)} cau</span>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {QUESTION_DISTRIBUTION_FIELDS.map((item) => (
                              <div key={`free-${item.key}`} className="form-control">
                                <label className="label text-xs font-bold uppercase text-base-content/50">{item.label}</label>
                                <input
                                  type="number"
                                  className="input input-bordered focus:input-primary bg-base-100"
                                  value={settings.questionDistributionFree?.[item.key] ?? 0}
                                  onChange={(e) => handleQuestionDistributionChange("questionDistributionFree", item.key, e.target.value)}
                                  min={0}
                                />
                                <span className="mt-2 text-xs text-base-content/60">
                                  Dang co {availableQuestionCounts.free?.[item.key] ?? 0} cau trong bank.
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-base-200 bg-base-200/30 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold uppercase text-base-content/70">Bo cau hoi VIP</p>
                              <p className="text-xs text-base-content/60 mt-1">Cau hinh rieng so cau DISC, Big Five va Ikigai cho bai tra phi.</p>
                            </div>
                            <span className="badge badge-outline">{sumQuestionDistribution(settings.questionDistributionPaid)} cau</span>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {QUESTION_DISTRIBUTION_FIELDS.map((item) => (
                              <div key={`paid-${item.key}`} className="form-control">
                                <label className="label text-xs font-bold uppercase text-base-content/50">{item.label}</label>
                                <input
                                  type="number"
                                  className="input input-bordered focus:input-primary bg-base-100"
                                  value={settings.questionDistributionPaid?.[item.key] ?? 0}
                                  onChange={(e) => handleQuestionDistributionChange("questionDistributionPaid", item.key, e.target.value)}
                                  min={0}
                                />
                                <span className="mt-2 text-xs text-base-content/60">
                                  Dang co {availableQuestionCounts.paid?.[item.key] ?? 0} cau trong bank.
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* Landing Page Settings */}
            {activeTab === "landing_page" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body items-center text-center py-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <i className="ri-layout-line text-4xl text-primary"></i>
                    </div>
                    <h3 className="card-title text-2xl mb-2">Trình biên tập Landing Page</h3>
                    <p className="text-base-content/60 max-w-md mb-6">
                      Chỉnh các section thực tế đang dùng ở trang chủ hiện tại:
                      hero mặc định, khối tính năng, đánh giá và CTA cuối trang.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-wide shadow-lg shadow-primary/30"
                      onClick={() => setShowLandingPageEditor(true)}
                    >
                      <i className="ri-edit-circle-line mr-2"></i>
                      Mở trình biên tập
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "config_pdf" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center text-center py-10">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <i className="ri-file-pdf-line text-4xl text-primary"></i>
                      </div>
                      <h3 className="card-title text-2xl mb-2">Trình biên tập PDF Custom</h3>
                      <p className="text-base-content/60 max-w-md mb-6">
                        Chỉnh sửa vị trí các trường dữ liệu trên mẫu báo cáo PDF.
                        Mở trình biên tập toàn màn hình để có trải nghiệm tốt nhất.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary btn-wide shadow-lg shadow-primary/30"
                        onClick={() => setShowPdfEditor(true)}
                      >
                        <i className="ri-edit-circle-line mr-2"></i>
                        Mở trình biên tập
                      </button>
                    </div>
                  </div>

                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center text-center py-10">
                      <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                        <i className="ri-braces-line text-4xl text-secondary"></i>
                      </div>
                      <h3 className="card-title text-2xl mb-2">Quản lý biến PDF</h3>
                      <p className="text-base-content/60 max-w-md mb-6">
                        Tạo các biến động theo điều kiện DISC, Big Five hoặc IKIGAI để tái sử dụng trong PDF.
                        Biến mới sẽ xuất hiện trực tiếp trong danh sách data source của editor.
                      </p>
                      <div className="badge badge-outline mb-5">
                        {settings.pdfCustomVariables?.length || 0} biến đang có
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-wide shadow-lg shadow-secondary/30"
                        onClick={() => setShowPdfVariableManager(true)}
                      >
                        <i className="ri-magic-line mr-2"></i>
                        Mở quản lý biến
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "slideshow" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <section className="card bg-base-100 shadow-xl overflow-hidden">
                  <div className="card-body p-6 space-y-6">
                    <h3 className="card-title text-lg flex items-center gap-2 text-info border-b border-base-200 pb-4 mb-4">
                      Cấu hình Slideshow
                    </h3>
                    <div className="alert alert-info">
                      <span>Slideshow này sẽ hiển thị trực tiếp ở đầu landing page. Nếu không có slide hợp lệ, trang chủ sẽ fallback về hero mặc định.</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-base-content/60">
                        Có {(Array.isArray(settings.homepageSlides) ? settings.homepageSlides : []).filter((slide) => slide?.imageUrl).length} slide hợp lệ.
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleAddSlide}
                        >
                          <i className="ri-add-line mr-1"></i>
                          Thêm slide
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => handleSaveData({ homepageSlides: settings.homepageSlides })}
                          disabled={saving}
                        >
                          <i className="ri-save-line mr-1"></i>
                          Lưu slideshow
                        </button>
                      </div>
                    </div>

                    {(Array.isArray(settings.homepageSlides) ? settings.homepageSlides : []).length === 0 && (
                      <div className="rounded-2xl border border-dashed border-base-300 p-8 text-center text-base-content/60">
                        Chưa có slide nào. Thêm slide để landing page hiển thị banner carousel.
                      </div>
                    )}

                    <div className="space-y-4">
                      {(Array.isArray(settings.homepageSlides) ? settings.homepageSlides : []).map((slide, index) => (
                        <div key={`slide-${index}`} className="rounded-2xl border border-base-300 bg-base-50 p-4 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold">Slide {index + 1}</div>
                              <div className="text-xs text-base-content/60">Thứ tự trong danh sách là thứ tự hiển thị trên landing.</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => handleMoveSlide(index, -1)}
                                disabled={index === 0}
                              >
                                <i className="ri-arrow-up-line"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => handleMoveSlide(index, 1)}
                                disabled={index === settings.homepageSlides.length - 1}
                              >
                                <i className="ri-arrow-down-line"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-error btn-outline"
                                onClick={() => handleRemoveSlide(index)}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                            <div className="space-y-3">
                              <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-base-300 bg-base-200 flex items-center justify-center">
                                {slide.imageUrl ? (
                                  <img
                                    src={buildAssetUrl(slide.imageUrl)}
                                    alt={slide.altText || slide.title || `Slide ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm text-base-content/50">Chưa có ảnh</span>
                                )}
                              </div>
                              <label className="btn btn-outline btn-sm w-full">
                                {uploadingSlideIndex === index ? "Đang upload..." : "Upload ảnh"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleSlideImageUpload(index, e)}
                                  disabled={uploadingSlideIndex === index}
                                />
                              </label>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="form-control md:col-span-2">
                                <label className="label text-xs font-bold uppercase text-base-content/50">URL ảnh</label>
                                <input
                                  type="text"
                                  className="input input-bordered focus:input-primary bg-base-100"
                                  value={slide.imageUrl || ""}
                                  onChange={(e) => handleSlideChange(index, "imageUrl", e.target.value)}
                                  placeholder="/uploads/banner-1.jpg"
                                />
                              </div>
                              <div className="form-control">
                                <label className="label text-xs font-bold uppercase text-base-content/50">Tiêu đề nội bộ</label>
                                <input
                                  type="text"
                                  className="input input-bordered focus:input-primary bg-base-100"
                                  value={slide.title || ""}
                                  onChange={(e) => handleSlideChange(index, "title", e.target.value)}
                                  placeholder="Banner tháng 3"
                                />
                              </div>
                              <div className="form-control">
                                <label className="label text-xs font-bold uppercase text-base-content/50">Alt text</label>
                                <input
                                  type="text"
                                  className="input input-bordered focus:input-primary bg-base-100"
                                  value={slide.altText || ""}
                                  onChange={(e) => handleSlideChange(index, "altText", e.target.value)}
                                  placeholder="Mô tả ảnh slide"
                                />
                              </div>
                              <div className="form-control md:col-span-2">
                                <label className="label text-xs font-bold uppercase text-base-content/50">Link khi click</label>
                                <input
                                  type="text"
                                  className="input input-bordered focus:input-primary bg-base-100"
                                  value={slide.link || ""}
                                  onChange={(e) => handleSlideChange(index, "link", e.target.value)}
                                  placeholder="https://example.com hoặc /plans"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

          </form>
        </div>
      </div>

      {/* Full Screen Editors */}
      <AnimatePresence>
        {showPdfEditor && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-base-100 flex flex-col"
          >
            <PdfTemplateEditor
              settings={settings}
              onUpdate={handleUpdateSettings}
              onSave={handleSaveData}
              loading={saving}
              onClose={() => setShowPdfEditor(false)}
            />
          </motion.div>
        )}

        {showPdfVariableManager && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-base-100 flex flex-col"
          >
            <PdfVariableManager
              variables={settings.pdfCustomVariables}
              onSave={handleSaveData}
              loading={saving}
              onClose={() => setShowPdfVariableManager(false)}
            />
          </motion.div>
        )}

        {showLandingPageEditor && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-base-100 flex flex-col"
          >
            <LandingPageEditor
              config={settings.landingPageConfig}
              onUpdate={(config) => handleUpdateSettings(config)}
              onSave={handleSaveData}
              loading={saving}
              onClose={() => setShowLandingPageEditor(false)}
              siteName={settings.siteName}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default SettingsPage;
