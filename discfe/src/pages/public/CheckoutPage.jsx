import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api.js";

const isPaidPlan = (plan) => Number(plan?.price) > 0 && String(plan?.code ?? "").trim().toUpperCase() !== "FREE";

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, initializing } = useAuth()
  const [searchParams] = useSearchParams()
  const [plans, setPlans] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [createdPayment, setCreatedPayment] = useState(null)
  const [pollStatus, setPollStatus] = useState("idle") // idle|waiting|completed|failed
  // Quốc Trí: khóa submit bằng ref để chặn double-click tạo nhiều order/pending payment.
  const submitLockRef = useRef(false)
  const pollRef = useRef(null)

  const pollOrderStatus = useCallback(async (orderId) => {
    try {
      const { data } = await api.get(`/users/me/orders/${orderId}/status`)
      if (data.status === "COMPLETED") {
        setPollStatus("completed")
        setTimeout(() => {
          navigate(`/thank-you?ref=${data.paymentReference}&plan=${selectedPlan?.code}`, { replace: true })
        }, 800)
        return true
      }
      if (data.status === "FAILED" || data.status === "CANCELLED") {
        setPollStatus("failed")
        return true
      }
      return false
    } catch {
      return false
    }
  }, [navigate, selectedPlan])

  useEffect(() => {
    if (pollStatus === "waiting" && createdPayment) {
      pollRef.current = setInterval(async () => {
        const done = await pollOrderStatus(createdPayment.id)
        if (done) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      }, 5000)
      // Also poll immediately
      pollOrderStatus(createdPayment.id)
      return () => {
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      }
    }
  }, [pollStatus, createdPayment, pollOrderStatus])

  const [form, setForm] = useState({
    phone: "",
    address: "",
    provider: "BANK_TRANSFER", // Default to BANK_TRANSFER
    note: "",
  })

  useEffect(() => {
    if (!error) return
    toast.error(error)
    setError(null)
  }, [error])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, partnerPlansRes, settingsRes] = await Promise.all([
          api.get("/public/plans"),
          api.get("/public/plans/partner"),
          api.get("/public/settings/general") // Fetch settings for bank info
        ])
        setPlans([...(plansRes.data || []), ...(partnerPlansRes.data || [])].filter(isPaidPlan))
        setSettings(settingsRes.data)
      } catch (err) {
        setError("Không thể tải thông tin. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      navigate(`/login?from=${returnUrl}`, { replace: true })
    }
  }, [isAuthenticated, initializing, navigate])

  const selectedPlan = useMemo(() => {
    if (!plans.length) return null
    const code = searchParams.get("plan")
    return plans.find((plan) => plan.code === code) ?? plans.find((plan) => plan.highlighted) ?? plans[0]
  }, [plans, searchParams])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (submitLockRef.current) {
      return
    }

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      navigate(`/login?from=${returnUrl}`)
      return
    }

    if (!selectedPlan) {
      setError("Vui lòng chọn gói thanh toán")
      return
    }

    submitLockRef.current = true
    setSubmitting(true)
    setError(null)

    try {
      const { data } = await api.post("/payments/checkout", {
        planCode: selectedPlan.code,
        phone: form.phone,
        address: form.address,
        provider: form.provider,
        note: form.note || null,
      })

      // Check if we need to redirect to payment provider (e.g. VNPay)
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      // If Bank Transfer, show QR Modal (but fail fast if bank info is missing)
      if (form.provider === "BANK_TRANSFER") {
        if (!settings?.bankId || !settings?.accountNumber) {
          setError("Hệ thống chưa cấu hình thông tin ngân hàng. Vui lòng liên hệ quản trị viên hoặc chọn phương thức khác.")
          return
        }
        setCreatedPayment(data)
        setShowQrModal(true)
        setPollStatus("waiting")
        return
      }

      // Success - redirect to thank you page
      navigate(`/thank-you?ref=${data.paymentReference}&plan=${selectedPlan.code}`, {
        replace: true,
      })
    } catch (err) {
      console.error("Checkout error:", err)
      const errorMessage = err.response?.data?.message || err.message || "Không thể tạo đơn hàng. Vui lòng thử lại."
      setError(errorMessage)
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  const handleCompleteTransfer = () => {
    // Do nothing - polling in background will navigate when status is COMPLETED
    toast.success("Đang kiểm tra trạng thái thanh toán...")
  }

  if (initializing || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!selectedPlan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100 p-4">
        <div className="alert alert-warning max-w-md shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Chưa có gói DISC trả phí nào được cấu hình. Vui lòng quay lại sau.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-12">
        {/* Header */}
        <header className="mb-8 text-center sm:mb-12 sm:text-left">
          <h1 className="text-balance text-3xl font-bold leading-tight text-base-content sm:text-4xl lg:text-5xl">
            Hoàn tất thanh toán
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-base-content/70 sm:text-base">
            Mở khóa toàn bộ báo cáo DISC nghề nghiệp, phân tích điểm mạnh/yếu và lộ trình phát triển cá nhân hóa.
          </p>
        </header>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* User Info Card */}
            {user && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-base-content/60">Thông tin tài khoản</p>
                      <p className="mt-1 truncate font-semibold text-base-content">{user.fullName || user.email}</p>
                      <p className="truncate text-sm text-base-content/70">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl">
              <div className="card-body p-5 sm:p-6 lg:p-8">
                <h2 className="card-title mb-4 text-xl sm:text-2xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Thông tin thanh toán
                </h2>

                <div className="flex flex-col gap-4">
                  {/* Phone Number Field */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Số điện thoại</span>
                      <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                      type="tel"
                      className="input input-bordered w-full focus:input-primary"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="0912 345 678"
                      pattern="[0-9]{10,11}"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">Dùng để nhận thông báo về đơn hàng</span>
                    </label>
                  </div>

                  {/* Address Field */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Địa chỉ</span>
                      <span className="label-text-alt text-error">*</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-20 w-full focus:textarea-primary"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">Dùng cho việc xuất hóa đơn nếu cần</span>
                    </label>
                  </div>

                  {/* Payment Method Select */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Phương thức thanh toán</span>
                      <span className="label-text-alt text-error">*</span>
                    </label>

                    {/* Bank Transfer Option */}
                    <div className="rounded-xl border border-primary bg-primary/5 p-4 mb-3 cursor-pointer" onClick={() => setForm(prev => ({ ...prev, provider: 'BANK_TRANSFER' }))}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl">
                          🏦
                        </div>
                        <div>
                          <p className="font-semibold text-base-content">Chuyển khoản ngân hàng</p>
                          <p className="text-xs text-base-content/60">Quét mã QR - Kích hoạt ngay</p>
                        </div>
                        <div className="ml-auto">
                          <input
                            type="radio"
                            name="provider"
                            className="radio radio-primary"
                            value="BANK_TRANSFER"
                            checked={form.provider === 'BANK_TRANSFER'}
                            onChange={handleChange}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    {/* VNPay Option (Commented out) */}
                    {/*
                    <div className="rounded-xl border border-base-200 p-4 cursor-pointer" onClick={() => setForm(prev => ({ ...prev, provider: 'VNPAY' }))}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-base-200 text-xl">
                          💳
                        </div>
                        <div>
                          <p className="font-semibold text-base-content">VNPay</p>
                          <p className="text-xs text-base-content/60">Thẻ ATM / Tài khoản ngân hàng / QR Pay</p>
                        </div>
                        <div className="ml-auto">
                          <input
                            type="radio"
                            name="provider"
                            className="radio radio-primary"
                            value="VNPAY"
                            checked={form.provider === 'VNPAY'}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                    */}
                  </div>

                  {/* Note Textarea */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Ghi chú</span>
                      <span className="label-text-alt text-base-content/60">(Tùy chọn)</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-24 w-full focus:textarea-primary"
                      name="note"
                      value={form.note}
                      onChange={handleChange}
                      placeholder="Ví dụ: Cần xuất hóa đơn VAT..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-full text-base shadow-lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        Đang xử lý thanh toán...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Xác nhận và thanh toán
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Order Summary (Sticky on desktop) */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Plan Summary Card */}
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl">
              <div className="card-body p-5 sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-base-content">Tóm tắt đơn hàng</h3>
                  <div className="badge badge-primary badge-lg">DISC</div>
                </div>

                <p className="text-pretty text-sm leading-relaxed text-base-content/80">{selectedPlan.description}</p>

                <div className="divider my-3"></div>

                {/* Price */}
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-base-content/60">Tổng thanh toán</p>
                    <p className="text-xs text-base-content/50">{selectedPlan.billingCycle}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className="text-3xl font-bold text-primary">
                      {new Intl.NumberFormat("vi-VN").format(selectedPlan.price)} {selectedPlan.currency}
                    </p>
                  </div>
                </div>

                {/* Features List */}
                {selectedPlan.features && selectedPlan.features.length > 0 && (
                  <>
                    <div className="divider my-3">Tính năng bao gồm</div>
                    <ul className="space-y-2.5">
                      {Array.from(selectedPlan.features).map((feature, index) => (
                        <li key={index} className="flex gap-3 text-sm leading-relaxed text-base-content/80">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="mt-0.5 h-5 w-5 shrink-0 text-success"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="card border-2 border-dashed border-base-300 bg-base-100 shadow-lg">
              <div className="card-body p-5">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-base-content">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-success"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cam kết của chúng tôi
                </h4>
                <ul className="space-y-2.5 text-sm leading-relaxed text-base-content/70">
                  <li className="flex gap-2">
                    <span className="text-success">✓</span>
                    <span>Nhận báo cáo qua email và Zalo trong vòng 5 phút</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success">✓</span>
                    <span>Hoàn phí 100% nếu không hài lòng trong 7 ngày</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success">✓</span>
                    <span>Tài liệu, video và checklist cập nhật liên tục</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-base-content/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Giao dịch được bảo mật và an toàn</span>
            </div>
          </aside>
        </div>
      </div>

      {/* QR Code Modal for Bank Transfer */}
      {showQrModal && createdPayment && settings && settings.bankId && settings.accountNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md bg-base-100 shadow-2xl">
            <div className="card-body items-center text-center">
              <h3 className="card-title text-2xl text-primary mb-2">Thanh toán chuyển khoản</h3>
              <p className="text-sm text-base-content/70 mb-4">
                Vui lòng quét mã QR bên dưới để hoàn tất thanh toán cho đơn hàng <strong>{createdPayment.paymentReference}</strong>
              </p>

              <div className="bg-white p-4 rounded-xl shadow-inner mb-4">
                <img
                  src={`https://img.vietqr.io/image/${settings.bankId}-${settings.accountNumber}-compact2.png?amount=${createdPayment.payment.amount}&addInfo=${createdPayment.paymentReference}&accountName=${encodeURIComponent(settings.accountName || "")}`}
                  alt="VietQR"
                  className="h-64 object-contain"
                />
              </div>

              <div className="w-full text-left space-y-2 mb-6 bg-base-200 p-4 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Ngân hàng:</span>
                  <span className="font-semibold">{settings.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Số tài khoản:</span>
                  <span className="font-semibold">{settings.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Chủ tài khoản:</span>
                  <span className="font-semibold">{settings.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Số tiền:</span>
                  <span className="font-semibold text-primary">{new Intl.NumberFormat("vi-VN").format(createdPayment.payment.amount)} VND</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Nội dung:</span>
                  <span className="font-bold text-secondary">{createdPayment.paymentReference}</span>
                </div>
              </div>

              <div className="card-actions w-full">
                {pollStatus === "waiting" && (
                  <div className="flex flex-col items-center w-full gap-2">
                    <div className="flex items-center gap-2 text-base-content/70">
                      <span className="loading loading-spinner loading-sm text-primary" />
                      <span>Đang chờ xác nhận thanh toán...</span>
                    </div>
                    <p className="text-xs text-base-content/50">Trang sẽ tự động chuyển khi thanh toán được xác nhận</p>
                  </div>
                )}
                {pollStatus === "completed" && (
                  <div className="flex flex-col items-center w-full gap-2">
                    <div className="flex items-center gap-2 text-success">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Thanh toán thành công! Đang chuyển hướng...</span>
                    </div>
                  </div>
                )}
                {pollStatus === "failed" && (
                  <div className="flex flex-col items-center w-full gap-2">
                    <div className="flex items-center gap-2 text-error">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Thanh toán thất bại. Vui lòng thử lại.</span>
                    </div>
                    <button
                      className="btn btn-outline btn-sm mt-2"
                      onClick={() => { setShowQrModal(false); setPollStatus("idle"); setCreatedPayment(null) }}
                    >
                      Thử lại
                    </button>
                  </div>
                )}
                {pollStatus === "idle" && (
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleCompleteTransfer}
                  >
                    Đã chuyển khoản xong
                  </button>
                )}
                <button
                  className="btn btn-ghost w-full btn-sm mt-2"
                  onClick={() => setShowQrModal(false)}
                >
                  Đóng và xem lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage
