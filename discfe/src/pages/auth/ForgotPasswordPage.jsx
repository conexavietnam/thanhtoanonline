import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router";
import api from "../../lib/api.js";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError("");
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Quốc Trí: gọi API thật để backend tạo reset token và gửi email.
      await api.post("/auth/forgot", { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
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
            <h2 className="card-title">Email đã được gửi!</h2>
            <p className="text-base-content/70">
              Vui lòng kiểm tra email <strong>{email}</strong> để đặt lại mật khẩu.
            </p>
            <Link to="/login" className="btn btn-primary mt-4">
              Quay lại đăng nhập
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
          <h2 className="card-title text-2xl mb-4">Quên mật khẩu</h2>
          <p className="text-base-content/70 mb-4">
            Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="form-control">
              <span className="label-text">Email *</span>
              <input
                type="email"
                className="input input-bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </label>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
            </button>
          </form>

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

export default ForgotPasswordPage;
