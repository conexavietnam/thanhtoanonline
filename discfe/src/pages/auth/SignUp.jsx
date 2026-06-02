import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, googleLogin } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: searchParams.get("ref") ?? "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  const handleGoogleSuccess = async (codeResponse) => {
    const code = codeResponse?.code;
    if (!code) {
      setError("Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
      return;
    }

    try {
      setLoading(true);
      await googleLogin({
        code,
        redirectUri: window.location.origin,
        referralCode: form.referralCode || undefined,
      });
      // Auto-verified, so redirect to dashboard immediately
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Đăng nhập bằng Google thất bại. Vui lòng thử lại."),
    flow: "auth-code",
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không trùng khớp.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        referralCode: form.referralCode || undefined,
        acceptTerms: form.acceptTerms,
      });
      setSuccess(true);
    } catch (err) {
      console.error("Registration error:", err);

      // Extract error message from response
      let errorMessage = "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";

      if (err?.response?.data) {
        const data = err.response.data;

        // Handle validation errors (array of messages)
        if (Array.isArray(data.message)) {
          errorMessage = data.message.join(", ");
        }
        // Handle single message string
        else if (typeof data.message === 'string') {
          errorMessage = data.message;
        }
        // Handle error field (Spring Boot format)
        else if (data.error) {
          errorMessage = typeof data.error === 'string' ? data.error : "Dữ liệu không hợp lệ";
        }
        // Handle validation errors object
        else if (data.errors) {
          const errorList = Object.values(data.errors).flat();
          errorMessage = errorList.length > 0
            ? errorList.join(", ")
            : "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
        }
      }
      // Handle network errors
      else if (err?.message) {
        errorMessage = err.message.includes('Network')
          ? "Lỗi kết nối. Vui lòng kiểm tra kết nối internet và thử lại."
          : err.message;
      }

      // Handle specific HTTP status codes
      if (err?.response?.status === 400 && !errorMessage.includes(":")) {
        errorMessage = errorMessage || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
      } else if (err?.response?.status === 409) {
        errorMessage = "Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.";
      } else if (err?.response?.status === 500) {
        errorMessage = "Lỗi hệ thống. Vui lòng thử lại sau.";
      }

      setError(errorMessage);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
          Kiểm tra email của bạn
        </h2>
        <p className="text-base-content/80 text-lg">
          Chúng tôi đã gửi một liên kết xác nhận đến <strong>{form.email}</strong>.
          Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) và nhấn vào liên kết để bắt đầu sử dụng tài khoản.
        </p>
        <div className="pt-6">
          <button
            onClick={() => navigate("/login")}
            className="btn btn-primary px-8 h-12 text-base font-semibold"
          >
            Về trang Đăng nhập
          </button>
        </div>
        <p className="text-sm text-base-content/60 pt-4">
          Nếu vẫn chưa nhận được thư, vui lòng chờ vài phút rồi kiểm tra lại.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Tạo tài khoản mới
        </h1>
        <p className="text-sm text-base-content/70 max-w-sm mx-auto">
          Tạo tài khoản để mua gói DISC, làm bài test trả phí và xem báo cáo đầy đủ.
        </p>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <label className="form-control">
            <span className="label-text font-medium mb-2">Họ và tên</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                name="fullName"
                className="input input-bordered w-full pl-10 h-12"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <label className="form-control">
            <span className="label-text font-medium mb-2">Email</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="email"
                name="email"
                className="input input-bordered w-full pl-10 h-12"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="form-control">
              <span className="label-text font-medium mb-2">Mật khẩu</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="input input-bordered w-full pl-10 pr-10 h-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 text-base-content/60 hover:text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-base-content/60 hover:text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
            <label className="form-control">
              <span className="label-text font-medium mb-2">Xác nhận mật khẩu</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="input input-bordered w-full pl-10 pr-10 h-12"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5 text-base-content/60 hover:text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-base-content/60 hover:text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
          </div>

          <label className="form-control">
            <span className="label-text font-medium mb-2">Mã giới thiệu (nếu có)</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                name="referralCode"
                className="input input-bordered w-full pl-10 h-12"
                placeholder="Nhập mã được cộng tác viên chia sẻ"
                value={form.referralCode}
                onChange={handleChange}
              />
            </div>
          </label>
        </div>

        <label className="label cursor-pointer items-start gap-3 rounded-xl bg-base-200/60 px-4 py-3">
          <input
            type="checkbox"
            name="acceptTerms"
            className="checkbox checkbox-primary checkbox-sm"
            checked={form.acceptTerms}
            onChange={handleChange}
            required
          />
          <span className="text-xs text-base-content/70">
            Tôi đồng ý với <a href="#" className="link link-primary">Điều khoản dịch vụ</a> và <a href="#" className="link link-primary">Chính sách bảo mật</a>.
          </span>
        </label>

        <button
          type="submit"
          className="btn btn-primary w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Đang tạo tài khoản...
            </>
          ) : (
            "Tạo tài khoản"
          )}
        </button>
      </form>

      <div className="divider text-base-content/50 text-xs">HOẶC</div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`min-h-12 rounded-xl border border-base-300 bg-base-100 px-2 py-1 ${loading ? "pointer-events-none opacity-70" : ""}`}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Đăng nhập bằng Google thất bại. Vui lòng thử lại.")}
            theme="outline"
            size="large"
            text="signup_with"
            shape="pill"
            width="220"
          />
        </div>
        <button className="btn btn-outline h-12" disabled>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </button>
      </div>

      <p className="text-center text-sm text-base-content/70">
        Đã có tài khoản?{" "}
        <a href="/login" className="link link-primary font-semibold hover:underline">
          Đăng nhập
        </a>
      </p>
    </div>
  );
};

export default SignUp;
