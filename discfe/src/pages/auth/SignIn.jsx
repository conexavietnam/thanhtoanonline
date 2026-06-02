import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";

const REMEMBER_ME_KEY = "disc_remembered_credentials";

// Backend only knows USER, PARTNER, ADMIN. Map ADMIN as an admin-capable role for UI routing.
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "CONTENT_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN"];

const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, googleLogin } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdminChoice, setShowAdminChoice] = useState(false);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  // Load saved credentials on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_ME_KEY);
      if (saved) {
        const credentials = JSON.parse(saved);
        setForm({ email: credentials.email || "", password: credentials.password || "" });
        setRememberMe(true);
      }
    } catch (error) {
      console.warn("Failed to load remembered credentials:", error);
    }
  }, []);

  const handleGoogleSuccess = async (codeResponse) => {
    const code = codeResponse?.code;
    if (!code) {
      setError("Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
      return;
    }

    try {
      setLoading(true);
      const user = await googleLogin({ code, redirectUri: window.location.origin });
      if (user?.roles?.some(role => ADMIN_ROLES.includes(role))) {
        setShowAdminChoice(true);
      } else {
        const redirectTo = searchParams.get("from") ?? "/dashboard";
        navigate(redirectTo, { replace: true });
      }
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
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Send rememberMe flag to backend for longer refresh token expiration
      const loggedInUser = await login({
        ...form,
        rememberMe: rememberMe
      });

      // Save credentials to localStorage for auto-fill (optional convenience feature)
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
          email: form.email,
          password: form.password,
        }));
      } else {
        // Remove saved credentials if unchecked
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      // Check if user is admin using the returned user data
      const isAdmin = loggedInUser?.roles?.some(role => ADMIN_ROLES.includes(role));

      if (isAdmin) {
        // Show admin choice modal
        setShowAdminChoice(true);
      } else {
        // Normal user - redirect normally
        const redirectTo = searchParams.get("from") ?? "/dashboard";
        navigate(redirectTo, { replace: true });
      }
      setLoading(false);
    } catch (err) {
      const errorCode = err?.response?.data?.code;
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error;
      if (errorCode === "EMAIL_NOT_VERIFIED" || /xác thực|not verified/i.test(errorMsg || "")) {
        setError("Email chưa được xác thực. Vui lòng kiểm tra hộp thư và nhấn vào liên kết xác thực.");
      } else {
        setError("Đăng nhập thất bại. Vui lòng kiểm tra email hoặc mật khẩu.");
      }
      setLoading(false);
    }
  };

  const handleAdminChoice = (choice) => {
    setShowAdminChoice(false);
    if (choice === "admin") {
      navigate("/admin", { replace: true });
    } else {
      const redirectTo = searchParams.get("from") ?? "/dashboard";
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <>
      {/* Admin Choice Modal */}
      {showAdminChoice && (
        <div
          className="modal modal-open"
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              handleAdminChoice("website");
            }
          }}
        >
          <div className="modal-box max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="text-3xl">🛡️</span>
              Chào mừng Admin!
            </h3>
            <p className="text-base-content/70 mb-6">
              Bạn muốn vào đâu?
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="btn btn-primary w-full h-14 text-base font-semibold"
                onClick={() => handleAdminChoice("admin")}
              >
                <span className="text-xl">🛡️</span>
                Vào Quản trị
              </button>
              <button
                className="btn btn-outline w-full h-14 text-base font-semibold"
                onClick={() => handleAdminChoice("website")}
              >
                <span className="text-xl">🌐</span>
                Vào Website
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <header className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Chào mừng quay lại
          </h1>
          <p className="text-sm text-base-content/70 max-w-sm mx-auto">
            Đăng nhập để xem kết quả DISC, lộ trình nghề nghiệp và bảng điều khiển cộng tác viên.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <label className="form-control">
              <span className="label-text font-medium mb-2">Email</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="label cursor-pointer gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="label-text text-base-content/70">Ghi nhớ đăng nhập</span>
            </label>
            <a href="/forgot-password" className="link link-primary text-sm">
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
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
              text="signin_with"
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
          Chưa có tài khoản?{" "}
          <a href="/register" className="link link-primary font-semibold hover:underline">
            Tạo tài khoản
          </a>
        </p>
      </div>
    </>
  );
};

export default SignIn;
