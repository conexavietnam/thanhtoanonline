import React from 'react';

const PartnerTable = ({
    partners,
    isLoading,
    onViewDetail,
    onSort,
    sortConfig,
    searchQuery,
    selectedPartnerId
}) => {
    const highlightText = (text, query) => {
        if (!query || !text) return text;
        const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i} className="bg-warning/30 px-0.5 rounded text-inherit">{part}</mark>
            ) : part
        );
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center bg-base-100 rounded-2xl border border-base-200 shadow-sm">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    if (partners.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-base-100 rounded-2xl border border-base-200 shadow-sm p-8 text-center animate-fade-in">
                <div className="bg-base-200 p-4 rounded-full mb-4">
                    <svg className="w-8 h-8 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-base-content">Không tìm thấy partner nào</h3>
                <p className="text-base-content/60 max-w-sm mt-2">
                    Thử thay đổi bộ lọc hoặc tạo partner mới để bắt đầu.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
                <table className="table table-pin-rows">
                    <thead className="text-xs uppercase bg-base-100/50 backdrop-blur z-10">
                        <tr>
                            <th onClick={() => onSort('fullName')} className="cursor-pointer hover:bg-base-200 transition-colors">Partner ↕</th>
                            <th onClick={() => onSort('totalRevenue')} className="cursor-pointer hover:bg-base-200 transition-colors text-right">Doanh thu ↕</th>
                            <th onClick={() => onSort('pendingCommission')} className="cursor-pointer hover:bg-base-200 transition-colors text-right">Công nợ ↕</th>
                            <th onClick={() => onSort('customerCount')} className="cursor-pointer hover:bg-base-200 transition-colors text-center">Khách ↕</th>
                            <th onClick={() => onSort('salesPackageRemaining')} className="cursor-pointer hover:bg-base-200 transition-colors text-center">Gói User ↕</th>
                            <th className="text-right pr-6">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {partners.map((partner) => (
                            <tr
                                key={partner.id}
                                className={`group hover:bg-base-50 cursor-pointer transition-colors border-b border-base-100 last:border-0 ${selectedPartnerId === partner.id ? 'bg-primary/5 hover:bg-primary/10' : ''
                                    }`}
                                onClick={() => onViewDetail(partner)}
                            >
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar placeholder">
                                            <div className="bg-neutral text-neutral-content rounded-full w-10">
                                                <span className="text-xs">{partner.fullName?.charAt(0) || 'P'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-base-content">{highlightText(partner.fullName, searchQuery)}</div>
                                            <div className="text-xs text-base-content/60 font-mono mt-0.5">{highlightText(partner.email, searchQuery)}</div>
                                            <div className="flex gap-2 mt-1.5">
                                                <span className={`badge badge-xs py-2 px-2 font-medium ${partner.active ? 'badge-success/10 text-success border-success/20' : 'badge-error/10 text-error border-error/20'}`}>
                                                    {partner.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-right font-mono font-medium text-base-content/80">
                                    {new Intl.NumberFormat("vi-VN").format(partner.totalRevenue || 0)}
                                </td>
                                <td className="text-right font-mono font-bold text-warning">
                                    {new Intl.NumberFormat("vi-VN").format(partner.pendingCommission || 0)}
                                </td>
                                <td className="text-center">
                                    <span className="badge badge-ghost badge-sm font-mono">{partner.customerCount || 0}</span>
                                </td>
                                <td className="text-center">
                                    <div className="tooltip" data-tip={`Đã bán: ${partner.salesPackageUsage || 0}`}>
                                        <div className="flex flex-col items-center">
                                            <div className="text-xs font-bold font-mono">
                                                {partner.salesPackageRemaining === -1 ? '∞' : partner.salesPackageRemaining}
                                                <span className="text-base-content/40 mx-1">/</span>
                                                {partner.salesPackageLimit === null ? '∞' : partner.salesPackageLimit}
                                            </div>
                                            <progress
                                                className="progress progress-primary w-16 h-1 mt-1"
                                                value={
                                                    partner.salesPackageLimit
                                                        ? (partner.salesPackageUsage / partner.salesPackageLimit) * 100
                                                        : 0
                                                }
                                                max="100"
                                            ></progress>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-right pr-4">
                                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="btn btn-sm btn-ghost btn-square text-base-content/60 hover:text-primary hover:bg-primary/10"
                                            onClick={() => onViewDetail(partner)}
                                            title="Xem chi tiết"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="bg-base-100 p-3 border-t border-base-200 text-xs text-center text-base-content/50">
                Hiển thị {partners.length} kết quả
            </div>
        </div>
    );
};

export default PartnerTable;
