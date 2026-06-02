import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router";
import api from "../../lib/api.js";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const token = searchParams.get("token");

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  useEffect(() => {
    if (!token) {
      setError("Link xác thực không hợp lệ. Thiếu token.");
      setVerifying(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        await api.get("/auth/verify", {
          params: { token },
        });
        setSuccess(true);
        setTimeout(() => {
          navigate("/login?verified=true", { replace: true });
        }, 3000);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          "Link xác thực không hợp lệ hoặc đã hết hạn.";
        setError(errorMessage);
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 via-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-base-content mb-2">
            Đang xác thực email...
          </h2>
          <p className="text-base-content/70">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 via-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card bg-base-100 shadow-2xl">
            <div className="card-body text-center p-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary shadow-xl mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-base-content mb-4">
                Xác thực thành công!
              </h2>
              <p className="text-base-content/70 mb-6">
                Email của bạn đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ.
              </p>
              <div className="card-actions justify-center">
                <Link to="/login?verified=true" className="btn btn-primary btn-lg">
                  Đăng nhập ngay
                </Link>
              </div>
              <p className="text-sm text-base-content/60 mt-4">
                Bạn sẽ được chuyển đến trang đăng nhập sau 3 giây...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body text-center p-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-error/20 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-error"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-base-content mb-4">
              Xác thực thất bại
            </h2>
            <p className="text-base-content/70 mb-6">
              Xác thực không thành công. Vui lòng thử lại hoặc liên hệ quản trị viên.
            </p>
            <div className="card-actions justify-center flex-col gap-2">
              <Link to="/login" className="btn btn-primary">
                Về trang đăng nhập
              </Link>
              <p className="text-sm text-base-content/60">
                Nếu bạn cần gửi lại email xác thực, vui lòng liên hệ quản trị viên.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
