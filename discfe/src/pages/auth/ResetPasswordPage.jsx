import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router";
import api from "../../lib/api.js";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError("");
  }, [error]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Link đặt lại mật khẩu không hợp lệ.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Quốc Trí: dùng token trong email để đổi mật khẩu trực tiếp qua public auth API.
      await api.post("/auth/reset", {
        token,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login?reset=success", { replace: true });
      }, 2500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="card-title">Đặt lại mật khẩu thành công</h2>
            <p className="text-base-content/70">
              Bạn có thể đăng nhập lại bằng mật khẩu mới.
            </p>
            <Link to="/login?reset=success" className="btn btn-primary mt-4">
              Về trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Đặt lại mật khẩu</h2>
          <p className="text-base-content/70 mb-4">
            Nhập mật khẩu mới để hoàn tất việc khôi phục tài khoản.
          </p>

          {!token ? (
            <div className="alert alert-error">
              <span>Link đặt lại mật khẩu không hợp lệ hoặc đã bị thiếu token.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="form-control">
                <span className="label-text">Mật khẩu mới *</span>
                <input
                  type="password"
                  name="newPassword"
                  className="input input-bordered"
                  value={form.newPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="Ít nhất 8 ký tự"
                />
              </label>

              <label className="form-control">
                <span className="label-text">Xác nhận mật khẩu *</span>
                <input
                  type="password"
                  name="confirmPassword"
                  className="input input-bordered"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>
            </form>
          )}

          <div className="divider">hoặc</div>

          <div className="text-center">
            <Link to="/login" className="link link-primary">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
