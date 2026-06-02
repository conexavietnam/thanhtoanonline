import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router";
import api, { discTestAPI, pdfExportAPI } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthModal from "../../components/landing/v2/AuthModal.jsx";

const FREE_MODE = "FREE";
const PAID_MODE = "PAID";

const DiscTestPage = ({ embedded = false }) => {
  const { user, isAuthenticated, loadProfile } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [testMode, setTestMode] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [testTakerName, setTestTakerName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasPaidQuota, setHasPaidQuota] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [exportingSessionId, setExportingSessionId] = useState(null);

  const hasPersonalCredits = useMemo(
    () => (user?.pdfExportCredits ?? 0) > 0,
    [user?.pdfExportCredits]
  );
  const hasPaidAccess = isAuthenticated && (hasPersonalCredits || hasPaidQuota);
  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((Object.keys(selectedOptions).length / questions.length) * 100);
  }, [questions.length, selectedOptions]);

  const openAuthModal = (mode = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setTestHistory([]);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);
    try {
      const { data } = await discTestAPI.getHistory();
      setTestHistory(data);
    } catch (err) {
      console.error("Failed to load test history", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    fetchHistory();
  }, [fetchHistory, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTestHistory([]);
      setLoadingHistory(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setHasPaidQuota(false);
      setEligibilityChecked(true);
      return;
    }

    const checkPaidAvailability = async () => {
      setEligibilityChecked(false);
      try {
        const { data } = await api.get("/pdf-exports/check");
        if (cancelled) return;
        setHasPaidQuota(Boolean(data?.canExportPaid));
      } catch (err) {
        if (cancelled) return;
        setHasPaidQuota(false);
      } finally {
        if (!cancelled) setEligibilityChecked(true);
      }
    };

    checkPaidAvailability();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, hasPersonalCredits]);

  useEffect(() => {
    if (!isAuthenticated || user?.fullName) return;
    loadProfile().catch((err) => {
      console.warn("Failed to refresh profile before prefill test taker name", err);
    });
  }, [isAuthenticated, loadProfile, user?.fullName]);

  useEffect(() => {
    if (!isAuthenticated || !user?.fullName || testTakerName) return;
    setTestTakerName(user.fullName);
  }, [isAuthenticated, testTakerName, user?.fullName]);

  const isComplete = useMemo(
    () => questions.length > 0 && Object.keys(selectedOptions).length === questions.length,
    [questions.length, selectedOptions]
  );

  const resetTestState = useCallback(() => {
    setResult(null);
    setQuestions([]);
    setSelectedOptions({});
    setCurrentIndex(0);
  }, []);

  const fetchQuestionsForMode = useCallback(async (mode) => {
    resetTestState();
    setLoading(true);
    setTestMode(mode);

    try {
      const { data } = await discTestAPI.getQuestions(mode);
      setQuestions(data);
    } catch (err) {
      setTestMode(null);
      setError("Không thể tải câu hỏi DISC. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [resetTestState]);

  const startFreeTest = useCallback(() => {
    void fetchQuestionsForMode(FREE_MODE);
  }, [fetchQuestionsForMode]);

  const startPaidTest = useCallback(() => {
    if (!hasPaidAccess) {
      toast.error("Tài khoản hiện chưa có quyền làm bài test trả phí.");
      return;
    }
    void fetchQuestionsForMode(PAID_MODE);
  }, [fetchQuestionsForMode, hasPaidAccess]);

  const exitCurrentTest = useCallback(() => {
    setQuestions([]);
    setSelectedOptions({});
    setCurrentIndex(0);
    setResult(null);
    setTestMode(null);
    setLoading(false);
  }, []);

  const triggerTestFlow = useCallback(() => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    startPaidTest();
  }, [isAuthenticated, startPaidTest]);

  const handleSelect = (questionId, optionId) => {
    setSelectedOptions((prev) => ({ ...prev, [questionId]: optionId }));
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx >= 0 && idx < questions.length - 1) {
      setTimeout(() => setCurrentIndex(idx + 1), 120);
    }
  };

  const handleExportPdf = async (testSessionId, testMode) => {
    setExportingSessionId(testSessionId);
    try {
      const response = await pdfExportAPI.download(testSessionId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filePrefix = testMode === PAID_MODE ? "DISC_Paid_Report" : "DISC_Free_Report";
      link.setAttribute('download', `${filePrefix}_${testSessionId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Bạn không đủ lượt xuất PDF. Vui lòng nâng cấp gói hoặc mua thêm lượt.");
      } else {
        toast.error("Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.");
      }
    } finally {
      setExportingSessionId(null);
    }
  };

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    if (!isComplete) return;
    setSubmitting(true);
    setError(null);

    try {
      const normalizedMode = (testMode || FREE_MODE).toUpperCase();
      const payload = {
        answers: Object.entries(selectedOptions).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
        category: "general",
        testTakerName: testTakerName.trim(),
        testMode: normalizedMode,
      };

      try {
        if (!isAuthenticated && normalizedMode === FREE_MODE) {
          localStorage.setItem(
            "disc_pending_test_result",
            JSON.stringify({
              timestamp: new Date().toISOString(),
              answers: payload.answers,
              testMode: normalizedMode,
              testTakerName: payload.testTakerName,
            })
          );
        } else {
          localStorage.removeItem("disc_pending_test_result");
        }
      } catch (storageError) {
        console.warn("Failed to persist pending DISC result", storageError);
      }

      const { data } = await discTestAPI.submit(payload);
      setResult(data);
      if (isAuthenticated) {
        await Promise.allSettled([fetchHistory(), loadProfile()]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Vui lòng đăng nhập để tiếp tục phiên test này.");
      } else if (err.response?.status === 403) {
        setError("Tài khoản hiện chưa có quyền mở bài test trả phí.");
      } else {
        setError("Gửi bài test thất bại. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-scroll to results when result is available
  useEffect(() => {
    if (result && resultsRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [result]);

  if (loading && testMode) {
    return (
      <div className={`flex items-center justify-center ${embedded ? "min-h-[20vh]" : "min-h-[40vh]"}`}>
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className={embedded ? "mx-auto max-w-4xl space-y-8" : "mx-auto max-w-4xl space-y-8 px-4 py-8"}>
        {!result && !testMode && (
          embedded ? (
            <section className="overflow-hidden rounded-[2rem] border border-base-200 bg-base-100 shadow-xl">
              <div className="bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 px-6 py-8 sm:px-8">
                <div className="mx-auto max-w-3xl space-y-5">
                  <div className="space-y-3 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                      DISC Free Test
                    </p>
                    <p className="text-base leading-8 text-base-content/70">
                      Bài free đã sẵn ngay trên trang chủ. Chọn bắt đầu để làm bộ câu hỏi DISC, Big Five
                      và IKIGAI trước, sau đó nâng cấp nếu bạn muốn mở thêm phần phân tích chuyên sâu.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={startFreeTest}
                      className="btn btn-primary rounded-full px-8"
                    >
                      Bắt đầu test miễn phí
                    </button>
                    <button
                      type="button"
                      onClick={triggerTestFlow}
                      className="btn btn-outline rounded-full px-8"
                      disabled={!isAuthenticated || !eligibilityChecked || !hasPaidAccess}
                    >
                      {isAuthenticated ? "Mở bài test trả phí" : "Đăng nhập để làm bản trả phí"}
                    </button>
                    {isAuthenticated && !hasPaidAccess && (
                      <Link to="/plans" className="btn btn-ghost rounded-full px-8">
                        Xem gói nâng cấp
                      </Link>
                    )}
                  </div>

                  {!isAuthenticated && (
                    <div className="flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => openAuthModal("login")}
                        className="btn btn-ghost rounded-full px-6"
                      >
                        Đăng nhập
                      </button>
                      <button
                        type="button"
                        onClick={() => openAuthModal("register")}
                        className="btn btn-outline rounded-full px-6"
                      >
                        Tạo tài khoản
                      </button>
                    </div>
                  )}

                  {isAuthenticated && !eligibilityChecked && (
                    <p className="text-center text-sm text-base-content/60">
                      Đang kiểm tra quyền mở bài test trả phí trên tài khoản của bạn.
                    </p>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-[2rem] border border-base-200 bg-base-100 shadow-xl">
              <div className="bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 px-6 py-10 sm:px-10">
                <div className="mx-auto max-w-3xl space-y-5 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                    DISC Free Test
                  </p>
                  <h1 className="text-3xl font-bold text-base-content sm:text-5xl">
                    Làm bài test miễn phí trước, mở bản phân tích đầy đủ khi cần.
                  </h1>
                  <p className="text-base leading-8 text-base-content/70 sm:text-lg">
                    Bản free cho phép người dùng làm ngay bộ câu hỏi DISC, Big Five và IKIGAI để xem
                    hồ sơ nổi bật. Bản trả phí mở thêm báo cáo chuyên sâu, gợi ý nghề nghiệp và lộ trình phát triển.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={startFreeTest}
                      className="btn btn-primary rounded-full px-8"
                    >
                      Bắt đầu test miễn phí
                    </button>
                    <button
                      type="button"
                      onClick={triggerTestFlow}
                      className="btn btn-outline rounded-full px-8"
                      disabled={!isAuthenticated || !eligibilityChecked || !hasPaidAccess}
                    >
                      {isAuthenticated ? "Mở bài test trả phí" : "Đăng nhập để làm bản trả phí"}
                    </button>
                    {isAuthenticated && !hasPaidAccess && (
                      <Link to="/plans" className="btn btn-ghost rounded-full px-8">
                        Xem gói nâng cấp
                      </Link>
                    )}
                  </div>

                  {!isAuthenticated && (
                    <div className="flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => openAuthModal("login")}
                        className="btn btn-ghost rounded-full px-6"
                      >
                        Đăng nhập
                      </button>
                      <button
                        type="button"
                        onClick={() => openAuthModal("register")}
                        className="btn btn-outline rounded-full px-6"
                      >
                        Tạo tài khoản
                      </button>
                    </div>
                  )}

                  {isAuthenticated && !eligibilityChecked && (
                    <p className="text-sm text-base-content/60">
                      Đang kiểm tra quyền mở bài test trả phí trên tài khoản của bạn.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )
        )}

        {isAuthenticated && loadingHistory && !result && !testMode && (
        <div className="flex justify-center p-12">
          <span className="loading loading-spinner text-primary"></span>
        </div>
        )}

        {isAuthenticated && !loadingHistory && testHistory.length > 0 && !testMode && (
          <section className="space-y-6 animate-fade-in py-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold">Lịch sử bài test</h2>
              <p className="text-sm text-base-content/80">
                Các phiên DISC bạn đã hoàn thành sẽ hiển thị tại đây.
              </p>

              <div className="overflow-x-auto rounded-xl border border-base-200 bg-base-100 shadow-sm">
                <table className="table table-zebra table-md w-full text-center">
                  <thead className="bg-[#FFE5E5] text-base-content whitespace-nowrap text-base">
                    <tr>
                      <th>STT</th>
                      <th>Người test</th>
                      <th>Ngày test</th>
                      <th>Chi phí</th>
                      <th>Xuất File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testHistory.map((item, index) => (
                      <tr key={item.id}>
                        <td className="text-base">{index + 1}</td>
                        <td className="font-medium text-left text-base">
                          {item.testTakerName || user?.fullName || "Khách"}
                        </td>
                        <td className="text-base">
                          {new Date(item.completedAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="text-base">
                          {item.testMode === PAID_MODE ? "300.000đ" : "Miễn phí"}
                        </td>
                        <td className="space-y-1">
                          {item.testMode === PAID_MODE ? (
                            <>
                              <button
                                onClick={() => handleExportPdf(item.id, item.testMode)}
                                disabled={exportingSessionId === item.id}
                                className="btn btn-sm bg-[#E31837] hover:bg-[#C4122C] text-white border-0 gap-2 px-6 shadow-sm rounded-full w-full max-w-[140px]"
                              >
                                {exportingSessionId === item.id ? (
                                  <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    ĐANG XUẤT
                                  </>
                                ) : (
                                  <>
                                    EXPORT
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                  </>
                                )}
                              </button>
                              <p className="text-xs text-base-content/60">
                                {`Credit hiện tại: ${Math.max(0, user?.pdfExportCredits ?? 0).toString().padStart(2, "0")}`}
                              </p>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleExportPdf(item.id, item.testMode)}
                                disabled={exportingSessionId === item.id}
                                className="btn btn-sm btn-outline gap-2 px-6 shadow-sm rounded-full w-full max-w-[140px]"
                              >
                                {exportingSessionId === item.id ? (
                                  <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    ĐANG XUẤT
                                  </>
                                ) : (
                                  <>
                                    FREE PDF
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                  </>
                                )}
                              </button>
                              <p className="text-xs text-base-content/60">Phiên miễn phí được xuất PDF và không trừ lượt.</p>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="bg-base-50 text-center py-6">
                        <h3 className="font-bold text-lg uppercase tracking-wide text-base-content">
                          Làm bài test mới
                        </h3>
                        <p className="text-sm text-base-content/70 mt-1">
                          Chọn nhanh bài miễn phí hoặc bản trả phí ngay từ trang lịch sử.
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-3">
                          <button
                            type="button"
                            className="btn btn-outline btn-md rounded-full px-8"
                            onClick={startFreeTest}
                          >
                            Bắt đầu test free
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-md shadow-md font-bold px-8 rounded-full"
                            onClick={triggerTestFlow}
                            disabled={!hasPaidAccess}
                          >
                            Bắt đầu test trả phí
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </section>
        )}

        {testMode && !result && (
          <div className="animate-fade-in">
            <div className="mb-6 rounded-[2rem] border border-base-200 bg-base-100 p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                    {testMode === PAID_MODE ? "DISC Paid" : "DISC Free"}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-base-content">
                    {testMode === PAID_MODE
                      ? "Bài test đầy đủ dành cho tài khoản đã mở khóa"
                      : `Bài test miễn phí ${questions.length || ""}${questions.length ? " câu" : ""} gồm DISC, Big Five và IKIGAI`}
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost rounded-full"
                  onClick={exitCurrentTest}
                >
                  Quay lại lựa chọn bài test
                </button>
              </div>

              <label className="mt-5 flex flex-col gap-2">
                <span className="text-sm font-medium text-base-content">
                  Tên hiển thị trong kết quả
                </span>
                <input
                  type="text"
                  value={testTakerName}
                  onChange={(event) => setTestTakerName(event.target.value)}
                  className="input input-bordered w-full"
                  placeholder={user?.fullName || "Nhập tên của bạn"}
                />
              </label>
            </div>

            {questions.length === 0 && !loading && (
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Chưa có câu hỏi nào trong bài test này. Vui lòng chọn bài test khác.</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {questions.length > 0 && (
                <section id="step-testing" className="max-w-4xl mx-auto py-4">
                  <div className="mb-8 space-y-4 text-center">
                    <p className="text-3xl font-black text-slate-900">
                      Câu {currentIndex + 1}/{questions.length}
                    </p>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="relative h-full">
                        <div
                          className="absolute inset-0 h-full bg-indigo-600 rounded-full transition-all duration-500 shadow-lg"
                          style={{
                            width: `${progressPercent}%`,
                          }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-sm">
                          {progressPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100">
                    <h2 className="text-2xl md:text-3xl font-black mb-10 text-slate-900 leading-tight text-center md:text-left">
                      {questions[currentIndex].content || questions[currentIndex].prompt}
                    </h2>

                    <div className="space-y-3">
                      {(questions[currentIndex].options || []).map((option, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isSelected = selectedOptions[questions[currentIndex].id] === option.id;
                        const label = option.label || option.statement || option.content;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelect(questions[currentIndex].id, option.id)}
                            className={`w-full p-5 text-left rounded-3xl border-4 transition-all group flex items-center gap-5 ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/70"
                                : "border-slate-50 hover:border-indigo-600 hover:bg-indigo-50/50"
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-sm shrink-0 transition-colors ${
                                isSelected ? "bg-indigo-600 text-white" : "bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white"
                              }`}
                            >
                              {letter}
                            </div>
                            <span
                              className={`font-bold text-lg leading-tight text-left ${
                                isSelected ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"
                              }`}
                            >
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-10 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                      <div className="text-sm text-slate-500">
                        Đã hoàn thành {Object.keys(selectedOptions).length}/{questions.length} câu.
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            if (currentIndex === 0) {
                              exitCurrentTest();
                              return;
                            }
                            setCurrentIndex((index) => Math.max(0, index - 1));
                          }}
                        >
                          {currentIndex === 0 ? "Thoát bài test" : "Trở lại"}
                        </button>
                        {currentIndex < questions.length - 1 ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={selectedOptions[questions[currentIndex].id] === undefined}
                            onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
                          >
                            Câu tiếp
                          </button>
                        ) : (
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!isComplete || submitting}
                          >
                            {submitting ? (
                              <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Đang xử lý...
                              </>
                            ) : (
                              "Hoàn thành bài test"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </form>
          </div>
        )}

        {result && (
          <section ref={resultsRef} className="space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-base-content">Bài test DISC của bạn đã hoàn tất</h2>
              <p className="text-base-content/70">
                {result.fullDetailUnlocked
                  ? "Báo cáo chuyên sâu đã được mở khóa đầy đủ trên tài khoản của bạn."
                  : isAuthenticated
                    ? "Bạn đang xem bản kết quả miễn phí với DISC, Big Five và IKIGAI. Nâng cấp để mở khóa toàn bộ phân tích chuyên sâu."
                    : "Bạn đang xem bản kết quả miễn phí với DISC, Big Five và IKIGAI. Tạo tài khoản để lưu lại kết quả và mở khóa bản phân tích đầy đủ."}
              </p>
            </div>

            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-base-100 to-base-200/50 p-8 shadow-xl">
              <div className="mb-8 text-center">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60 mb-3">
                  Nhóm tính cách của bạn
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {result.topDimensions.map((dim, index) => (
                    <span key={dim}>
                      <span className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-2xl font-bold text-primary-content shadow-lg">
                        {dim}
                      </span>
                      {index < result.topDimensions.length - 1 && (
                        <span className="mx-2 text-2xl font-bold text-primary">&</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {result.dimensionScores.map((score) => {
                  const isTop = result.topDimensions.includes(score.dimension);
                  return (
                    <div
                      key={score.dimension}
                      className={`rounded-xl p-5 text-center transition-all ${
                        isTop
                          ? "bg-primary/20 border-2 border-primary/40 shadow-md"
                          : "bg-base-200/50 border border-base-300"
                      }`}
                    >
                      <div className="text-3xl font-bold mb-2">
                        {score.dimension.slice(0, 1)}
                      </div>
                      <div className={`text-2xl font-bold mb-1 ${isTop ? "text-primary" : "text-base-content/70"}`}>
                        {score.score}
                      </div>
                      <div className="text-xs font-medium text-base-content/60">
                        {score.dimension}
                      </div>
                      {isTop && (
                        <div className="mt-2">
                          <span className="badge badge-primary badge-sm">Top</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-xl bg-base-100 p-6 border border-base-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-base-content mb-2">Bước tiếp theo</h4>
                    <p className="text-sm text-base-content/70 mb-4">
                      {result.fullDetailUnlocked
                        ? "Truy cập mục Kết quả để xem chi tiết nghề nghiệp phù hợp, lộ trình phát triển và tài liệu luyện tập."
                        : "Nâng cấp gói để mở khóa danh sách nghề nghiệp phù hợp, phân tích điểm mạnh yếu chi tiết và lộ trình phát triển 3-6 tháng."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={startFreeTest} className="btn btn-outline btn-sm">
                        Làm lại test free
                      </button>
                      {result.fullDetailUnlocked ? (
                        <Link to="/dashboard/results" className="btn btn-primary btn-sm">
                          Xem kết quả chi tiết
                        </Link>
                      ) : isAuthenticated ? (
                        <>
                          {hasPaidAccess ? (
                            <button type="button" onClick={triggerTestFlow} className="btn btn-primary btn-sm">
                              Chuyển sang bản trả phí
                            </button>
                          ) : (
                            <Link to="/plans" className="btn btn-primary btn-sm">
                              Nâng cấp gói
                            </Link>
                          )}
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => openAuthModal("register")} className="btn btn-primary btn-sm">
                            Tạo tài khoản để lưu kết quả
                          </button>
                          <Link to="/plans" className="btn btn-outline btn-sm">
                            Xem gói nâng cấp
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={closeAuthModal}
        onSwitchMode={setAuthMode}
      />
    </>
  );
};

export default DiscTestPage;
