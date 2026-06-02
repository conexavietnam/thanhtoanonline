import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { Link } from "react-router";

const MySubscriptionsPage = () => {
  const { user } = useAuth();
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load profile with active subscription
      const { data: profile } = await api.get("/users/me");
      setActiveSubscription(profile.activeSubscription);

      // Load all subscriptions
      try {
        const { data: subs } = await api.get("/users/me/subscriptions");
        setSubscriptions(Array.isArray(subs) ? subs : []);
      } catch (err) {
        console.warn("Failed to load subscriptions:", err);
      }

      // Load payments
      try {
        const { data: pays } = await api.get("/users/me/payments");
        setPayments(Array.isArray(pays) ? pays : []);
      } catch (err) {
        console.warn("Failed to load payments:", err);
      }
    } catch (err) {
      console.error("Failed to load data", err);
      setError("Không thể tải thông tin. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Gói Dịch Vụ Của Tôi</h2>
        <p className="text-sm text-base-content/60">Quản lý gói đăng ký và nâng cấp</p>
      </header>

      {activeSubscription ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="card-title text-2xl">{activeSubscription.planName}</h3>
                <p className="text-base-content/70">{activeSubscription.planCode}</p>
              </div>
              <span className={`badge badge-lg ${
                activeSubscription.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'
              }`}>
                {activeSubscription.status}
              </span>
            </div>

            <div className="divider"></div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-base-content/70">Giá</label>
                <p className="text-xl font-bold text-primary">
                  {new Intl.NumberFormat('vi-VN').format(activeSubscription.price)} {activeSubscription.currency}
                </p>
              </div>
              {activeSubscription.expiresAt && (
                <div>
                  <label className="text-sm font-medium text-base-content/70">Hết hạn</label>
                  <p className="text-lg">
                    {new Date(activeSubscription.expiresAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              )}
            </div>

            {activeSubscription.planCode !== 'VIP' && (
              <div className="card-actions justify-end mt-4">
                <Link to="/plans" className="btn btn-primary">
                  Nâng cấp gói
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="card-title">Chưa có gói dịch vụ</h3>
            <p className="text-base-content/70">
              Bạn chưa đăng ký gói dịch vụ nào. Xem các gói có sẵn để bắt đầu!
            </p>
            <Link to="/plans" className="btn btn-primary mt-4">
              Xem gói dịch vụ
            </Link>
          </div>
        </div>
      )}

      {/* All Subscriptions History */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Lịch sử Subscriptions ({subscriptions.length})</h3>
          {subscriptions.length > 0 ? (
            <div className="space-y-3 mt-4">
              {subscriptions.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className={`p-4 rounded-lg border ${
                    sub.status === 'ACTIVE' ? 'border-success bg-success/5' : 'border-base-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{sub.planName}</h4>
                      <p className="text-sm text-base-content/70">{sub.planCode}</p>
                      <div className="mt-2 flex gap-2">
                        <span className={`badge badge-sm ${
                          sub.status === 'ACTIVE' ? 'badge-success' :
                          sub.status === 'EXPIRED' ? 'badge-error' :
                          sub.status === 'CANCELLED' ? 'badge-ghost' : 'badge-warning'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      {sub.expiresAt && (
                        <p className="text-xs text-base-content/60 mt-1">
                          Hết hạn: {new Date(sub.expiresAt).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {subscriptions.length > 5 && (
                <p className="text-sm text-base-content/60 text-center">
                  ... và {subscriptions.length - 5} subscriptions khác
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-base-content/60">Chưa có subscription nào</p>
          )}
        </div>
      </div>

      {/* Payments History */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Lịch sử Thanh toán ({payments.length})</h3>
          {payments.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Mã thanh toán</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map((payment) => (
                    <tr key={payment.id}>
                      <td className="font-mono text-xs">{payment.paymentReference}</td>
                      <td className="font-semibold">
                        {new Intl.NumberFormat('vi-VN').format(payment.amount)} {payment.currency}
                      </td>
                      <td>
                        <span className={`badge badge-sm ${
                          payment.status === 'COMPLETED' ? 'badge-success' :
                          payment.status === 'FAILED' ? 'badge-error' :
                          payment.status === 'REFUNDED' ? 'badge-warning' : 'badge-ghost'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="text-xs">
                        {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payments.length > 10 && (
                <p className="text-sm text-base-content/60 text-center mt-2">
                  ... và {payments.length - 10} payments khác
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-base-content/60">Chưa có thanh toán nào</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default MySubscriptionsPage;
