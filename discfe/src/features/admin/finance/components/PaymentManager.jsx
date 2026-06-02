import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { adminPaymentAPI, csvExportAPI } from "../../../../lib/api.js";

// Hàm dịch payment status sang tiếng Việt
const translatePaymentStatus = (status) => {
    const statusMap = {
        COMPLETED: "Đã hoàn thành",
        PENDING: "Chờ xử lý",
        FAILED: "Thất bại",
        REFUNDED: "Đã hoàn tiền",
    };
    return statusMap[status] || status;
};

const PaymentManager = () => {
    const [payments, setPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(true);
    const [viewMode, setViewMode] = useState("list"); // "list" or "table"

    useEffect(() => {
        if (!error) return;
        toast.error(error);
        setError(null);
    }, [error]);

    const loadPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = filterStatus ? { status: filterStatus } : {};
            const { data } = await adminPaymentAPI.getAll(params);
            setPayments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading payments:", err);
            setError(err.response?.data?.message || "Không thể tải danh sách payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, [filterStatus]);

    // Statistics
    const statistics = useMemo(() => {
        const stats = {
            total: payments.length,
            completed: payments.filter(p => p.status === 'COMPLETED').length,
            pending: payments.filter(p => p.status === 'PENDING').length,
            failed: payments.filter(p => p.status === 'FAILED').length,
            refunded: payments.filter(p => p.status === 'REFUNDED').length,
            totalAmount: payments
                .filter(p => p.status === 'COMPLETED')
                .reduce((sum, p) => sum + (p.amount || 0), 0),
        };
        return stats;
    }, [payments]);

    // Filtered payments
    const filteredPayments = useMemo(() => {
        let filtered = payments;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(payment =>
                payment.paymentReference?.toLowerCase().includes(query) ||
                payment.provider?.toLowerCase().includes(query) ||
                payment.currency?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [payments, searchQuery]);

    const handleViewDetail = async (payment) => {
        try {
            const { data } = await adminPaymentAPI.getById(payment.id);
            setSelectedPayment(data);
            setMessage(null);
            setError(null);

            // If in table mode, show modal
            if (viewMode === 'table') {
                document.getElementById('payment_detail_modal').showModal();
            }
        } catch (err) {
            setError("Không thể tải chi tiết payment");
        }
    };

    const handleUpdateStatus = async (paymentId, newStatus) => {
        if (!confirm(`Đổi trạng thái sang ${translatePaymentStatus(newStatus)}?`)) return;
        setSaving(true);
        try {
            await adminPaymentAPI.updateStatus(paymentId, newStatus);
            setMessage("Cập nhật trạng thái thành công");
            await loadPayments();
            if (selectedPayment?.id === paymentId) {
                const { data } = await adminPaymentAPI.getById(paymentId);
                setSelectedPayment(data);
            }
        } catch (err) {
            setError("Cập nhật trạng thái thất bại");
        } finally {
            setSaving(false);
        }
    };

    const formatMoney = (amount, currency) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currency;
    };

    const handleExport = async () => {
        try {
            const params = { page: 0, size: 10000 };
            const response = await csvExportAPI.exportPayments(params);

            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            setError("Không thể export CSV");
        }
    };

    const renderPaymentDetail = (payment, isModal = false) => {
        if (!payment) return null;

        // Parse metadata
        let parsedMetadata = null;
        try {
            parsedMetadata = payment.metadata ? JSON.parse(payment.metadata) : null;
        } catch (e) {
            // Keep as string if not valid JSON
        }

        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-base-content">Chi tiết Payment</h3>
                    <p className="text-xs text-base-content/60">ID: {payment.id}</p>
                </div>

                {payment.userEmail && (
                    <div className="bg-base-200/50 p-3 rounded-xl border border-base-200">
                        <h4 className="text-sm font-bold text-base-content mb-2 flex items-center gap-2">
                            <span>👤</span> Thông tin người thanh toán
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-base-content/60 block text-xs">Email</span>
                                <span className="font-medium">{payment.userEmail}</span>
                            </div>
                            <div>
                                <span className="text-base-content/60 block text-xs">Họ tên</span>
                                <span className="font-medium">{payment.userFullName || "—"}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-base-content/70">Mã giao dịch</label>
                        <p className="mt-1 text-base-content font-mono text-sm">{payment.paymentReference}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-base-content/70">Gói đăng ký</label>
                        <p className="mt-1 text-base-content font-bold text-primary">
                            {payment.planName || "—"}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-base-content/70">Số tiền</label>
                        <p className="mt-1 text-base-content font-bold text-lg">
                            {formatMoney(payment.amount, payment.currency)}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-base-content/70">Cổng thanh toán</label>
                        <p className="mt-1 text-base-content">{payment.provider || "—"}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-base-content/70">Ngày tạo</label>
                        <p className="mt-1 text-base-content">
                            {new Date(payment.createdAt).toLocaleString('vi-VN')}
                        </p>
                    </div>
                    {payment.completedAt && (
                        <div>
                            <label className="text-sm font-medium text-base-content/70">Ngày hoàn thành</label>
                            <p className="mt-1 text-base-content">
                                {new Date(payment.completedAt).toLocaleString('vi-VN')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Parsed contact info from metadata */}
                {parsedMetadata && (
                    <div className="bg-base-200/50 p-3 rounded-xl border border-base-200">
                        <h4 className="text-sm font-bold text-base-content mb-2 flex items-center gap-2">
                            <span>📞</span> Thông tin liên hệ
                        </h4>
                        <div className="space-y-2 text-sm">
                            {parsedMetadata.phone && (
                                <div>
                                    <span className="text-base-content/60 block text-xs">Số điện thoại</span>
                                    <span className="font-medium">{parsedMetadata.phone}</span>
                                </div>
                            )}
                            {parsedMetadata.address && (
                                <div>
                                    <span className="text-base-content/60 block text-xs">Địa chỉ</span>
                                    <span className="font-medium">{parsedMetadata.address}</span>
                                </div>
                            )}
                            {parsedMetadata.note && (
                                <div>
                                    <span className="text-base-content/60 block text-xs">Ghi chú</span>
                                    <span className="font-medium italic">{parsedMetadata.note}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Raw metadata fallback */}
                {payment.metadata && !parsedMetadata && (
                    <div>
                        <label className="text-sm font-medium text-base-content/70">Dữ liệu kèm theo</label>
                        <pre className="mt-2 p-3 bg-base-200 rounded text-xs overflow-auto max-h-40">
                            {payment.metadata}
                        </pre>
                    </div>
                )}

                <div>
                    <label className="text-sm font-medium text-base-content/70">Trạng thái</label>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`badge ${payment.status === 'COMPLETED' ? 'badge-success' :
                            payment.status === 'FAILED' ? 'badge-error' :
                                payment.status === 'REFUNDED' ? 'badge-warning' : 'badge-ghost'
                            }`}>
                            {translatePaymentStatus(payment.status)}
                        </span>
                        <select
                            className="select select-bordered select-sm"
                            value={payment.status}
                            onChange={(e) => handleUpdateStatus(payment.id, e.target.value)}
                            disabled={saving}
                        >
                            <option value="PENDING">Chờ xử lý</option>
                            <option value="COMPLETED">Đã hoàn thành</option>
                            <option value="FAILED">Thất bại</option>
                            <option value="REFUNDED">Đã hoàn tiền</option>
                        </select>
                    </div>
                </div>

                {/* Quick Actions for PENDING */}
                {payment.status === 'PENDING' && (
                    <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-base-content/70 mb-3">Thao tác nhanh</p>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-success btn-sm flex-1"
                                onClick={() => handleUpdateStatus(payment.id, 'COMPLETED')}
                                disabled={saving}
                            >
                                ✓ Xác nhận thanh toán
                            </button>
                            <button
                                className="btn btn-error btn-sm flex-1"
                                onClick={() => handleUpdateStatus(payment.id, 'FAILED')}
                                disabled={saving}
                            >
                                ✗ Từ chối
                            </button>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t flex gap-3">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                            setSelectedPayment(null);
                            if (isModal) document.getElementById('payment_detail_modal').close();
                        }}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Header removed as it will be in the main page tabs */}
                </div>
                <div className="flex items-center gap-2">
                    <div className="join">
                        <button
                            className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-active btn-primary' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="Chế độ xem danh sách"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                        <button
                            className={`join-item btn btn-sm ${viewMode === 'table' ? 'btn-active btn-primary' : ''}`}
                            onClick={() => setViewMode('table')}
                            title="Chế độ xem bảng"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                            </svg>
                        </button>
                    </div>
                    <button
                        className="btn btn-primary btn-sm gap-2"
                        onClick={handleExport}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </header>

            {message && (
                <div className="alert alert-success">
                    <span>{message}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setMessage(null)}>✕</button>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="stat bg-base-200 rounded-lg">
                    <div className="stat-title text-xs">Tổng số</div>
                    <div className="stat-value text-2xl">{statistics.total}</div>
                </div>
                <div className="stat bg-success/10 rounded-lg">
                    <div className="stat-title text-xs">Hoàn thành</div>
                    <div className="stat-value text-2xl text-success">{statistics.completed}</div>
                </div>
                <div className="stat bg-warning/10 rounded-lg">
                    <div className="stat-title text-xs">Chờ xử lý</div>
                    <div className="stat-value text-2xl text-warning">{statistics.pending}</div>
                </div>
                <div className="stat bg-error/10 rounded-lg">
                    <div className="stat-title text-xs">Thất bại</div>
                    <div className="stat-value text-2xl text-error">{statistics.failed}</div>
                </div>
                <div className="stat bg-info/10 rounded-lg">
                    <div className="stat-title text-xs">Đã hoàn tiền</div>
                    <div className="stat-value text-2xl text-info">{statistics.refunded}</div>
                </div>
                <div className="stat bg-primary/10 rounded-lg">
                    <div className="stat-title text-xs">Tổng tiền</div>
                    <div className="stat-value text-lg text-primary">
                        {new Intl.NumberFormat('vi-VN').format(statistics.totalAmount)} VND
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span className="font-semibold text-base-content">Bộ lọc</span>
                        {(filterStatus || searchQuery) && (
                            <span className="badge badge-primary badge-sm">
                                {(filterStatus ? 1 : 0) + (searchQuery ? 1 : 0)}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn btn-ghost btn-sm"
                    >
                        {showFilters ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )
                        }
                    </button>
                </div>

                {showFilters && (
                    <div className="border-t border-base-300 p-4 space-y-3">
                        {/* Quick filter tabs */}
                        <div className="flex gap-2 mb-3">
                            <button
                                className={`btn btn-sm ${filterStatus === '' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilterStatus('')}
                            >
                                Tất cả ({statistics.total})
                            </button>
                            <button
                                className={`btn btn-sm gap-1 ${filterStatus === 'PENDING' ? 'btn-warning' : 'btn-ghost'}`}
                                onClick={() => setFilterStatus('PENDING')}
                            >
                                🔔 Chờ xác nhận
                                {statistics.pending > 0 && (
                                    <span className="badge badge-warning badge-sm">{statistics.pending}</span>
                                )}
                            </button>
                            <button
                                className={`btn btn-sm ${filterStatus === 'COMPLETED' ? 'btn-success' : 'btn-ghost'}`}
                                onClick={() => setFilterStatus('COMPLETED')}
                            >
                                ✓ Đã xong ({statistics.completed})
                            </button>
                        </div>

                        {/* Search */}
                        <label className="form-control">
                            <span className="label-text mb-1 text-xs font-medium">Tìm kiếm</span>
                            <input
                                type="text"
                                placeholder="Tìm theo mã giao dịch, cổng thanh toán..."
                                className="input input-bordered input-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </label>

                        {/* Status Filter */}
                        <label className="form-control">
                            <span className="label-text mb-1 text-xs font-medium">Trạng thái chi tiết</span>
                            <select
                                className="select select-bordered select-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="PENDING">Chờ xử lý</option>
                                <option value="COMPLETED">Đã hoàn thành</option>
                                <option value="FAILED">Thất bại</option>
                                <option value="REFUNDED">Đã hoàn tiền</option>
                            </select>
                        </label>

                        {/* Reset Filters */}
                        {(filterStatus || searchQuery) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterStatus("");
                                    setSearchQuery("");
                                }}
                                className="btn btn-ghost btn-xs w-full"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Results count */}
            {!loading && (
                <div className="text-xs text-base-content/60">
                    Hiển thị {filteredPayments.length} / {payments.length} payments
                </div>
            )}

            {viewMode === 'list' ? (
                // LIST VIEW
                <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
                    <section className="space-y-3">
                        <h3 className="font-semibold text-base-content">Danh sách Payments</h3>

                        {loading ? (
                            <div className="flex min-h-[300px] items-center justify-center">
                                <span className="loading loading-spinner text-primary" />
                            </div>
                        ) : error ? (
                            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-base-300 bg-base-200 p-6">
                                <svg className="h-16 w-16 text-base-content/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-semibold text-base-content/60 mb-2">Không có dữ liệu để hiển thị.</p>
                                <button
                                    type="button"
                                    onClick={loadPayments}
                                    className="btn btn-ghost btn-sm mt-2"
                                >
                                    Thử lại
                                </button>
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200">
                                <svg className="h-12 w-12 text-base-content/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-base-content/60">Không tìm thấy payment nào</p>
                                {(filterStatus || searchQuery) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterStatus("");
                                            setSearchQuery("");
                                        }}
                                        className="btn btn-ghost btn-xs mt-2"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {filteredPayments.map((payment) => (
                                    <article
                                        key={payment.id}
                                        className={`rounded-xl border p-4 cursor-pointer transition hover:border-primary/50 hover:shadow-md ${selectedPayment?.id === payment.id ? "border-primary bg-primary/5" :
                                                payment.status === 'PENDING' ? "border-warning-content bg-warning/5 border-2" :
                                                    "border-base-200"
                                            }`}
                                        onClick={() => handleViewDetail(payment)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {payment.status === 'PENDING' && (
                                                        <span className="text-lg">🔔</span>
                                                    )}
                                                    <h4 className="font-semibold text-base-content">
                                                        {formatMoney(payment.amount, payment.currency)}
                                                    </h4>
                                                    <span className={`badge badge-xs ${payment.status === 'COMPLETED' ? 'badge-success' :
                                                        payment.status === 'FAILED' ? 'badge-error' :
                                                            payment.status === 'REFUNDED' ? 'badge-warning' : 'badge-warning'
                                                        }`}>
                                                        {translatePaymentStatus(payment.status)}
                                                    </span>
                                                </div>
                                                {payment.planName && (
                                                    <div className="mb-1">
                                                        <span className="badge badge-primary badge-sm">{payment.planName}</span>
                                                    </div>
                                                )}
                                                {payment.userEmail && (
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <span className="text-xs font-bold text-base-content/70">User:</span>
                                                        <span className="text-xs text-primary truncate">{payment.userEmail}</span>
                                                    </div>
                                                )}
                                                <p className="text-sm text-base-content/70 font-mono truncate">
                                                    {payment.paymentReference}
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {payment.provider && (
                                                        <span className="badge badge-sm badge-outline">
                                                            {payment.provider}
                                                        </span>
                                                    )}
                                                    {payment.completedAt && (
                                                        <span className="badge badge-sm badge-success badge-outline">
                                                            Hoàn thành
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                    <p className="text-xs text-base-content/60">
                                                        Tạo: {new Date(payment.createdAt).toLocaleString('vi-VN')}
                                                    </p>
                                                    {payment.completedAt && (
                                                        <p className="text-xs text-base-content/60">
                                                            Hoàn thành: {new Date(payment.completedAt).toLocaleString('vi-VN')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-2xl border border-base-200 bg-base-100 p-6 sticky top-4 h-fit">
                        {selectedPayment ? (
                            renderPaymentDetail(selectedPayment)
                        ) : (
                            <div className="flex min-h-[400px] items-center justify-center text-base-content/50">
                                <p>Chọn một payment để xem chi tiết</p>
                            </div>
                        )}
                    </section>
                </div>
            ) : (
                // TABLE VIEW
                <div className="overflow-x-auto rounded-xl border border-base-200">
                    <table className="table table-zebra w-full">
                        <thead className="bg-base-200">
                            <tr>
                                <th>Mã giao dịch</th>
                                <th>Khách hàng</th>
                                <th>Số tiền</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">
                                        <span className="loading loading-spinner text-primary"></span>
                                    </td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-base-content/60">
                                        Không tìm thấy dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover">
                                        <td className="font-mono text-sm">{payment.paymentReference}</td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{payment.userEmail}</span>
                                                <span className="text-xs text-base-content/60">{payment.userFullName}</span>
                                            </div>
                                        </td>
                                        <td className="font-bold">
                                            {formatMoney(payment.amount, payment.currency)}
                                        </td>
                                        <td>
                                            <span className={`badge badge-sm ${payment.status === 'COMPLETED' ? 'badge-success' :
                                                payment.status === 'FAILED' ? 'badge-error' :
                                                    payment.status === 'REFUNDED' ? 'badge-warning' : 'badge-ghost'
                                                }`}>
                                                {translatePaymentStatus(payment.status)}
                                            </span>
                                        </td>
                                        <td className="text-sm">
                                            {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-ghost btn-xs"
                                                onClick={() => handleViewDetail(payment)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for Tablet view detail */}
            <dialog id="payment_detail_modal" className="modal">
                <div className="modal-box max-w-2xl">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    {selectedPayment && renderPaymentDetail(selectedPayment, true)}
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
};

export default PaymentManager;
