import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("payments");

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
      const [paymentsRes, subscriptionsRes] = await Promise.all([
        api.get("/users/me/payments"),
        api.get("/users/me/subscriptions"),
      ]);
      setPayments(paymentsRes.data || []);
      setSubscriptions(subscriptionsRes.data || []);
    } catch (err) {
      console.error("Failed to load orders", err);
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount, currency = "VND") => {
    if (!amount && amount !== 0) return "—";
    return new Intl.NumberFormat("vi-VN").format(amount) + " " + (currency || "VND");
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      COMPLETED: "badge-success",
      PENDING: "badge-warning",
      FAILED: "badge-error",
      REFUNDED: "badge-warning",
      ACTIVE: "badge-success",
      PENDING_PAYMENT: "badge-warning",
      EXPIRED: "badge-ghost",
    };
    return statusMap[status] || "badge-ghost";
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      COMPLETED: "Đã thanh toán",
      PENDING: "Đang chờ",
      FAILED: "Thất bại",
      REFUNDED: "Đã hoàn tiền",
      ACTIVE: "Đang hoạt động",
      PENDING_PAYMENT: "Chờ thanh toán",
      EXPIRED: "Hết hạn",
    };
    return labelMap[status] || status;
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
        <h2 className="text-2xl font-bold">Quản lý đơn hàng</h2>
        <p className="text-sm text-base-content/60">Theo dõi và quản lý đơn hàng của bạn</p>
      </header>

      {/* Tabs */}
      <div className="tabs tabs-bordered">
        <button
          className={`tab ${activeTab === "payments" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          Thanh toán ({payments.length})
        </button>
        <button
          className={`tab ${activeTab === "subscriptions" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("subscriptions")}
        >
          Gói dịch vụ ({subscriptions.length})
        </button>
      </div>

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="card-title">Chưa có thanh toán nào</h3>
                <p className="text-base-content/70">
                  Bạn chưa có đơn thanh toán nào. Đặt hàng ngay để bắt đầu!
                </p>
              </div>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="card-title text-lg">
                          {formatMoney(payment.amount, payment.currency)}
                        </h3>
                        <span className={`badge ${getStatusBadge(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-base-content/70">
                        <p>
                          <span className="font-medium">Mã đơn:</span>{" "}
                          <span className="font-mono">{payment.paymentReference || "—"}</span>
                        </p>
                        <p>
                          <span className="font-medium">Phương thức:</span> {payment.provider || "—"}
                        </p>
                        <p>
                          <span className="font-medium">Ngày tạo:</span>{" "}
                          {payment.createdAt
                            ? new Date(payment.createdAt).toLocaleString("vi-VN")
                            : "—"}
                        </p>
                        {payment.completedAt && (
                          <p>
                            <span className="font-medium">Ngày hoàn thành:</span>{" "}
                            {new Date(payment.completedAt).toLocaleString("vi-VN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          {subscriptions.length === 0 ? (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="card-title">Chưa có gói dịch vụ</h3>
                <p className="text-base-content/70">
                  Bạn chưa đăng ký gói dịch vụ nào. Xem các gói có sẵn để bắt đầu!
                </p>
              </div>
            </div>
          ) : (
            subscriptions.map((subscription) => (
              <div key={subscription.id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="card-title text-lg">{subscription.planName}</h3>
                        <span className={`badge ${getStatusBadge(subscription.status)}`}>
                          {getStatusLabel(subscription.status)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-base-content/70">
                        <p>
                          <span className="font-medium">Mã gói:</span> {subscription.planCode}
                        </p>
                        {subscription.startsAt && (
                          <p>
                            <span className="font-medium">Ngày bắt đầu:</span>{" "}
                            {new Date(subscription.startsAt).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                        {subscription.expiresAt && (
                          <p>
                            <span className="font-medium">Ngày hết hạn:</span>{" "}
                            {new Date(subscription.expiresAt).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Ngày tạo:</span>{" "}
                          {subscription.createdAt
                            ? new Date(subscription.createdAt).toLocaleString("vi-VN")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
