import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { partnerRegistrationAPI } from "../../lib/api";

const BecomePartnerPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [referralLink, setReferralLink] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  // Kiểm tra user đã là Partner chưa
  const isPartner = user?.roles?.includes("PARTNER");

  const handleRegister = async () => {
    if (isPartner) {
      setError("Bạn đã là Partner rồi!");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await partnerRegistrationAPI.register();
      setSuccess(data.message || "Đăng ký làm Partner thành công!");
      setReferralLink(data.referralLink);

      // Refresh user để cập nhật roles
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Đăng ký thất bại!";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!referralLink) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isPartner) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="alert alert-success shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Bạn đã là Partner!</h3>
            <div className="text-sm">Truy cập dashboard Partner để quản lý hoa hồng và khách hàng.</div>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/dashboard/partner")}
        >
          Đi đến Dashboard Partner
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Đăng ký làm Partner</h1>
        <p className="text-base-content/70">
          Trở thành đối tác và nhận hoa hồng khi khách hàng của bạn nâng cấp gói trả phí
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <h2 className="card-title">Lợi ích khi trở thành Partner</h2>

          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-primary text-xl">💰</span>
              <div>
                <strong>Hoa hồng tự động:</strong> Nhận hoa hồng khi khách hàng được giới thiệu nâng cấp gói trả phí
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary text-xl">🔗</span>
              <div>
                <strong>Link giới thiệu độc quyền:</strong> Mỗi Partner có 1 link giới thiệu duy nhất
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary text-xl">📊</span>
              <div>
                <strong>Dashboard riêng:</strong> Theo dõi doanh thu, hoa hồng và khách hàng đã giới thiệu
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary text-xl">⚡</span>
              <div>
                <strong>Không cần duyệt:</strong> Đăng ký và sử dụng ngay, không cần chờ admin xét duyệt
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary text-xl">👤</span>
              <div>
                <strong>Giữ quyền user:</strong> Bạn vẫn giữ đầy đủ quyền user thường sau khi trở thành Partner
              </div>
            </li>
          </ul>

          {success && (
            <div className="alert alert-success shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-bold">{success}</h3>
                {referralLink && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm">Link giới thiệu của bạn:</p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-base-200 px-4 py-2 rounded-lg text-sm break-all">
                        {referralLink}
                      </code>
                      <button
                        className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
                        onClick={handleCopyLink}
                      >
                        {copied ? "Đã copy!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card-actions justify-end">
            <button
              className="btn btn-primary"
              onClick={handleRegister}
              disabled={loading || isPartner}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Đang xử lý...
                </>
              ) : (
                "Đăng ký làm Partner"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title text-lg">Lưu ý</h3>
          <ul className="text-sm space-y-2 text-base-content/70">
            <li>• Hoa hồng chỉ tính khi khách hàng được giới thiệu nâng cấp gói trả phí</li>
            <li>• Hoa hồng có trạng thái: pending → paid (tự động xử lý)</li>
            <li>• Partner không được chỉnh giá, không can thiệp nội dung bài test</li>
            <li>• Partner chỉ xem dữ liệu của mình</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BecomePartnerPage;
