import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminPartnerAPI } from "../../lib/api.js";
import api from "../../lib/api.js";
import { Link, useParams } from "react-router";

const PartnerCustomerManagementPage = () => {
  const { partnerId } = useParams();
  const [partner, setPartner] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  useEffect(() => {
    if (partnerId) {
      loadPartner();
      loadCustomers();
    }
  }, [partnerId]);

  const loadPartner = async () => {
    try {
      const { data } = await adminPartnerAPI.getById(partnerId);
      setPartner(data);
    } catch (err) {
      console.error("Error loading partner:", err);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/admin/partners/${partnerId}/customers/all`);
      setCustomers(data || []);
    } catch (err) {
      setError("Không thể tải danh sách khách hàng");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      !searchQuery ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !filterStatus || customer.referralStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  if (loading && !partner) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/admin/partners" className="btn btn-ghost btn-sm">
              ← Quay lại
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-base-content">
            Khách hàng của Partner
          </h2>
          {partner && (
            <p className="text-sm text-base-content/60 mt-1">
              {partner.fullName} ({partner.email}) - Mã: {partner.referralCode}
            </p>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="form-control flex-1">
          <label className="label">
            <span className="label-text">Tìm kiếm</span>
          </label>
          <input
            type="text"
            placeholder="Tìm theo email, tên, số điện thoại..."
            className="input input-bordered"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="form-control w-48">
          <label className="label">
            <span className="label-text">Trạng thái referral</span>
          </label>
          <select
            className="select select-bordered"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Pending</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title text-xs">Tổng khách hàng</div>
          <div className="stat-value text-lg text-primary">{customers.length}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title text-xs">Đã thanh toán</div>
          <div className="stat-value text-lg text-success">
            {customers.filter((c) => c.totalPayments > 0).length}
          </div>
        </div>
        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title text-xs">Tổng doanh thu</div>
          <div className="stat-value text-lg text-warning">
            {formatCurrency(
              customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
            )}
          </div>
        </div>
        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-title text-xs">Tổng test</div>
          <div className="stat-value text-lg text-info">
            {customers.reduce((sum, c) => sum + (c.totalTests || 0), 0)}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <span className="loading loading-spinner text-primary" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">
          <p>Không tìm thấy khách hàng nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Email</th>
                <th>Họ tên</th>
                <th>Số điện thoại</th>
                <th>Trạng thái Referral</th>
                <th>Hoa hồng</th>
                <th>Subscriptions</th>
                <th>Thanh toán</th>
                <th>Tổng chi</th>
                <th>Test</th>
                <th>Đăng ký</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.userId}>
                  <td>
                    <div className="font-medium">{customer.email}</div>
                    {customer.referralCode && (
                      <div className="text-xs text-base-content/60">
                        Mã: {customer.referralCode}
                      </div>
                    )}
                  </td>
                  <td>{customer.fullName || "—"}</td>
                  <td>{customer.phoneNumber || "—"}</td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        customer.referralStatus === "PAID"
                          ? "badge-success"
                          : customer.referralStatus === "QUALIFIED"
                          ? "badge-warning"
                          : customer.referralStatus === "PENDING"
                          ? "badge-info"
                          : "badge-error"
                      }`}
                    >
                      {customer.referralStatus}
                    </span>
                  </td>
                  <td>
                    {customer.commissionAmount > 0 ? (
                      <div>
                        <div className="font-semibold text-success">
                          {formatCurrency(customer.commissionAmount)}
                        </div>
                        {customer.commissionPercentage > 0 && (
                          <div className="text-xs text-base-content/60">
                            {customer.commissionPercentage}%
                          </div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className="badge badge-outline badge-sm">
                      {customer.totalSubscriptions || 0}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-outline badge-sm">
                      {customer.totalPayments || 0}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-warning">
                      {formatCurrency(customer.totalSpent || 0)}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-info badge-sm">
                      {customer.totalTests || 0}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs text-base-content/60">
                      {formatDate(customer.registeredAt)}
                    </div>
                  </td>
                  <td>
                    <Link
                      to={`/admin/users/${customer.userId}`}
                      className="btn btn-xs btn-primary"
                    >
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCustomers.length > 0 && (
        <div className="text-sm text-base-content/60 text-center">
          Hiển thị {filteredCustomers.length} / {customers.length} khách hàng
        </div>
      )}
    </div>
  );
};

export default PartnerCustomerManagementPage;

