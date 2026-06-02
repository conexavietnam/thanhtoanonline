import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import api from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const ThankYouPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const paymentReference = searchParams.get("ref");
  const planCode = searchParams.get("plan");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await api.get("/public/settings");
        setSettings(data);
      } catch (err) {
        console.warn("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?from=${returnUrl}`, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !orderId) {
      setStatusLoading(false);
      return;
    }
    const fetchStatus = async () => {
      try {
        const { data } = await api.get(`/users/me/orders/${orderId}/status`);
        setOrderStatus(data.status);
      } catch {
        setOrderStatus(null);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, [isAuthenticated, orderId]);

  useEffect(() => {
    if (isAuthenticated && !loading && !statusLoading) {
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, statusLoading, navigate]);

  if (!isAuthenticated || loading || statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  const isCompleted = orderStatus === "COMPLETED" || !orderId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8 animate-fade-in">
          {isCompleted ? (
            <>
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary shadow-2xl mb-6 animate-bounce">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-white"
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
              <h1 className="text-4xl md:text-5xl font-bold text-base-content mb-4">
                Cam on ban da mua hang!
              </h1>
              <p className="text-lg text-base-content/70 mb-2">
                Don hang cua ban da duoc xu ly thanh cong
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-warning to-orange-400 shadow-2xl mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-base-content mb-4">
                Don hang dang cho xu ly
              </h1>
              <p className="text-lg text-base-content/70 mb-2">
                Thanh toan cua ban dang duoc xac nhan. Ban se nhan duoc email khi hoan tat.
              </p>
            </>
          )}
          {paymentReference && (
            <p className="text-sm text-base-content/60">
              Ma thanh toan: <span className="font-mono font-semibold">{paymentReference}</span>
            </p>
          )}
          {orderId && (
            <p className="text-sm text-base-content/60">
              Ma don hang: <span className="font-mono font-semibold">{orderId}</span>
            </p>
          )}
        </div>

        <div className="card bg-base-100 shadow-2xl mb-6">
          <div className="card-body p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-base-content mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                  </svg>
                  Buoc tiep theo
                </h2>
                <div className="space-y-3 text-base-content/80">
                  {isCompleted ? (
                    <>
                      <p>Don hang cua ban da duoc xu ly. Ban se nhan duoc email xac nhan trong vai phut.</p>
                      <p>Tai khoan cua ban da duoc nang cap tu dong.</p>
                    </>
                  ) : (
                    <>
                      <p>Don hang cua ban dang duoc xu ly. Ban se nhan duoc email xac nhan trong vai phut.</p>
                      <p>Sau khi thanh toan duoc xac nhan, tai khoan cua ban se duoc nang cap tu dong.</p>
                    </>
                  )}
                  <p>
                    Ban co the truy cap <Link to="/dashboard/results" className="link link-primary font-semibold">Ket qua chi tiet</Link> de xem toan bo bao cao DISC.
                  </p>
                </div>
              </div>

              {settings?.zaloGroupLink && (
                <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-primary"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-base-content mb-2">
                        Tham gia nhom Zalo de duoc tu van sau hon
                      </h3>
                      <p className="text-base-content/70 mb-4">
                        Tham gia nhom Zalo cua chung toi de nhan ho tro truc tiep, chia se kinh nghiem va duoc tu van chi tiet ve ket qua DISC cua ban.
                      </p>
                      <a
                        href={settings.zaloGroupLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-lg w-full sm:w-auto"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        Tham gia nhom Zalo ngay
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/dashboard" className="btn btn-primary btn-lg flex-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Ve Dashboard
                </Link>
                <Link to="/dashboard/results" className="btn btn-outline btn-lg flex-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Xem ket qua chi tiet
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-base-content/60">
          <p>Ban se duoc chuyen ve Dashboard sau <span className="font-semibold text-primary">10 giay</span></p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
