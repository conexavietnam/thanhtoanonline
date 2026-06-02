import React from 'react';
import { Link } from "react-router";
import PartnerStats from './PartnerStats';
import QuotaManagement from './QuotaManagement';

const PartnerDetailView = ({
    partner,
    onClose,
    stats,
    loadingStats,
    activeTab,
    onTabChange,
    onUpdateStatus,
    onRemoveRole,
    saving,
    // Quota props
    quotaInfo,
    loadingQuota,
    onSaveQuota,
    onResetQuota,
    exportHistory,
    onEdit,

    onResetPassword,
    canEditQuota = false
}) => {
    if (!partner) return null;

    return (
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-xl overflow-hidden animate-fade-in flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-base-200 bg-base-50/50 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-base-content">Chi tiết Partner</h3>
                        <span className={`badge ${partner.status === 'ACTIVE' ? 'badge-success' :
                            partner.status === 'SUSPENDED' ? 'badge-error' : 'badge-warning'
                            }`}>
                            {partner.status}
                        </span>
                    </div>
                    <p className="text-xs font-mono text-base-content/50 mt-1">ID: {partner.id}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className="btn btn-sm btn-ghost gap-2 text-warning"
                        onClick={() => onResetPassword && onResetPassword(partner)}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Reset Pass
                    </button>
                    <button
                        className="btn btn-sm btn-ghost gap-2 text-primary"
                        onClick={() => onEdit && onEdit(partner)}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Sửa thông tin
                    </button>
                    <button
                        className="btn btn-sm btn-ghost btn-circle"
                        onClick={onClose}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Info Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-12">
                                <span className="text-xl">{partner.fullName?.charAt(0) || 'P'}</span>
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-lg">{partner.fullName}</p>
                            <p className="text-sm text-base-content/60">{partner.email}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 justify-center">
                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/60">Số điện thoại:</span>
                            <span className="font-medium">{partner.phoneNumber || "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/60">Mã giới thiệu:</span>
                            <span className="font-mono font-medium bg-base-200 px-2 rounded">{partner.referralCode || "—"}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <Link
                        to={`/admin/partner-customizations?partnerId=${partner.id}`}
                        className="btn btn-sm btn-outline gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        Tùy chỉnh Branding
                    </Link>

                    {/* Quick Stats - Always visible */}
                    <div className="stats stats-horizontal shadow-sm border border-base-200 bg-base-100 flex-1 min-w-[300px]">
                        <div className="stat py-2 px-4">
                            <div className="stat-title text-xs">Test</div>
                            <div className="stat-value text-lg text-primary">{partner.totalTests || 0}</div>
                        </div>
                        <div className="stat py-2 px-4">
                            <div className="stat-title text-xs">Subs</div>
                            <div className="stat-value text-lg text-secondary">{partner.activeSubscriptions || 0}</div>
                        </div>
                        <div className="stat py-2 px-4">
                            <div className="stat-title text-xs">Refs</div>
                            <div className="stat-value text-lg text-accent">{partner.totalReferrals ?? 0}</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs tabs-boxed bg-base-200/50 p-1 gap-1">
                    {[
                        { id: 'info', label: 'Thông tin' }, // Kept for consistency, though basic info already shown
                        { id: 'stats', label: 'Thống kê & Doanh thu' },
                        { id: 'revenues', label: 'Lịch sử Revenue' },
                        { id: 'quota', label: 'Quota & Gói' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab flex-1 transition-all rounded-lg ${activeTab === tab.id ? "tab-active bg-white shadow-sm" : "hover:bg-base-200"}`}
                            onClick={() => onTabChange(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                    {activeTab === 'info' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Business Profile Section */}
                            <div className="bg-base-100 rounded-xl p-5 border border-base-200 shadow-sm">
                                <h4 className="font-bold text-base uppercase text-primary mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    Hồ sơ Doanh nghiệp
                                </h4>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <div className="text-xs text-base-content/60 font-medium uppercase">Tên tổ chức / Công ty</div>
                                        <div className="font-medium text-lg text-base-content">{partner.companyName || "—"}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-base-content/60 font-medium uppercase">Mã giới thiệu (Referral Code)</div>
                                        <div className="font-mono bg-base-200 px-2 py-1 rounded inline-block text-base-content font-bold">{partner.referralCode || "—"}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-base-content/60 font-medium uppercase">Email liên hệ</div>
                                        <div className="font-medium text-base-content">{partner.contactEmail || "—"}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-base-content/60 font-medium uppercase">Hotline</div>
                                        <div className="font-medium text-base-content">{partner.contactPhone || "—"}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Subscription & Credits Management */}
                            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-5 border border-primary/20 shadow-sm">
                                <h4 className="font-bold text-base uppercase text-primary mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Subscription & Credits
                                </h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="text-xs text-base-content/60 font-medium uppercase">Active Plan</div>
                                        <div className={`badge ${partner.activeSubscription?.planCode === 'VIP' ? 'badge-primary' :
                                            partner.activeSubscription?.planCode === 'FREE' ? 'badge-ghost' : 'badge-neutral'
                                            } badge-lg font-bold`}>
                                            {partner.activeSubscription?.planName || "Free"}
                                        </div>
                                        {partner.activeSubscription?.expiresAt && (
                                            <div className="text-xs text-base-content/60">
                                                Hết hạn: {new Date(partner.activeSubscription.expiresAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-xs text-base-content/60 font-medium uppercase flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            PDF Export Credits
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-2xl font-bold text-primary">{partner.pdfExportCredits || 0}</div>
                                            <div className="text-xs text-base-content/60">credits</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Metadata */}
                            <div className="bg-base-100 rounded-xl p-5 border border-base-200 shadow-sm">
                                <h4 className="font-bold text-xs uppercase text-base-content/50 mb-4">Metadata Hệ thống</h4>
                                <div className="grid gap-4 grid-cols-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-base-content/60">Ngày tham gia:</span>
                                        <span className="font-medium">{partner.createdAt ? new Date(partner.createdAt).toLocaleString('vi-VN') : '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/60">Cập nhật lần cuối:</span>
                                        <span className="font-medium">{partner.updatedAt ? new Date(partner.updatedAt).toLocaleString('vi-VN') : '—'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-base-100 rounded-xl p-5 border border-base-200">
                                <h4 className="font-semibold mb-4 text-base-content/80">Quản lý trạng thái</h4>
                                <div className="form-control max-w-xs">
                                    <label className="label">
                                        <span className="label-text">Trạng thái Partner</span>
                                    </label>
                                    <select
                                        className="select select-bordered"
                                        value={partner.status}
                                        onChange={(e) => onUpdateStatus(partner.id, e.target.value)}
                                        disabled={saving}
                                    >
                                        <option value="ACTIVE">ACTIVE - Hoạt động bình thường</option>
                                        <option value="SUSPENDED">SUSPENDED - Tạm ngưng</option>
                                        <option value="PENDING_VERIFICATION">PENDING - Chờ xác minh</option>
                                    </select>
                                </div>

                                <div className="mt-8 pt-6 border-t border-base-200">
                                    <h4 className="font-semibold text-error mb-2">Danger Zone</h4>
                                    <p className="text-sm text-base-content/60 mb-4">Hành động này không thể hoàn tác.</p>
                                    <button
                                        className="btn btn-error btn-outline btn-sm"
                                        onClick={() => onRemoveRole(partner.id)}
                                        disabled={saving}
                                    >
                                        Xóa quyền Partner (Giữ tài khoản User)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <PartnerStats stats={stats} loading={loadingStats} />
                    )}

                    {activeTab === 'revenues' && (
                        <div className="animate-fade-in">
                            {loadingStats ? (
                                <div className="flex justify-center py-8">
                                    <span className="loading loading-spinner text-primary" />
                                </div>
                            ) : stats?.recentRevenues && stats.recentRevenues.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-base-200">
                                    <table className="table table-sm">
                                        <thead className="bg-base-200/50">
                                            <tr>
                                                <th>Khách hàng</th>
                                                <th>Doanh thu</th>
                                                <th>Hoa hồng</th>
                                                <th>Trạng thái</th>
                                                <th>Ngày</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recentRevenues.map((revenue) => (
                                                <tr key={revenue.id} className="hover:bg-base-50">
                                                    <td>
                                                        <div className="font-medium">{revenue.referredUserName || "User"}</div>
                                                        <div className="text-xs text-base-content/60">{revenue.referredUserEmail}</div>
                                                    </td>
                                                    <td className="font-mono">{new Intl.NumberFormat("vi-VN").format(revenue.revenueAmount || 0)}</td>
                                                    <td className="font-bold text-primary font-mono">
                                                        {new Intl.NumberFormat("vi-VN").format(revenue.commissionAmount || 0)}
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-sm ${revenue.status === 'PAID' ? 'badge-success' :
                                                            revenue.status === 'APPROVED' ? 'badge-info' :
                                                                revenue.status === 'PENDING' ? 'badge-warning' : 'badge-error'
                                                            }`}>
                                                            {revenue.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-xs text-base-content/70">
                                                        {new Date(revenue.createdAt).toLocaleDateString("vi-VN")}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-base-content/40 bg-base-50 rounded-xl border border-dashed border-base-300">
                                    <p>Chưa có giao dịch doanh thu nào</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'quota' && (
                        <QuotaManagement
                            quotaInfo={quotaInfo}
                            loading={loadingQuota}
                            onSave={onSaveQuota}
                            onReset={onResetQuota}
                            exportHistory={exportHistory}
                            saving={saving}
                            canEdit={canEditQuota}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartnerDetailView;
