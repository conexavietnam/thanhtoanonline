import React, { useState, useEffect } from 'react';

const QuotaManagement = ({
    quotaInfo,
    loading,
    saving,
    onSave,
    onReset,
    exportHistory,
    canEdit = false
}) => {
    const [formData, setFormData] = useState({
        paidExportLimit: null,
        freeExportLimit: null, // Kept for future/compatibility, though usage seemed low
        allowFreeExports: false,
        resetPeriod: "MANUAL",
        notes: "",
        wholesalePackagePrice: null,
        active: true,
    });

    useEffect(() => {
        if (quotaInfo) {
            setFormData({
                paidExportLimit: quotaInfo.paidExportLimit,
                freeExportLimit: quotaInfo.freeExportLimit,
                allowFreeExports: quotaInfo.allowFreeExports,
                resetPeriod: quotaInfo.resetPeriod || "MANUAL",
                notes: quotaInfo.notes || "",
                wholesalePackagePrice: quotaInfo.wholesalePackagePrice,
                active: quotaInfo.active,
            });
        }
    }, [quotaInfo]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <span className="loading loading-spinner text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Quota Info Display */}
            {quotaInfo && (
                <div className="bg-base-200/50 rounded-xl p-5 border border-base-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-base-content">Thông tin Quota hiện tại</h4>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                            <label className="text-xs font-medium uppercase text-base-content/60">Quota tổng (trả phí)</label>
                            <p className="text-2xl font-bold mt-1">
                                {quotaInfo.paidExportLimit === null ? "∞" : quotaInfo.paidExportLimit}
                            </p>
                        </div>
                        <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                            <label className="text-xs font-medium uppercase text-base-content/60">Đã dùng</label>
                            <p className="text-2xl font-bold text-primary mt-1">{quotaInfo.currentPaidUsage || 0}</p>
                        </div>
                        <div className="bg-base-100 p-4 rounded-lg shadow-sm">
                            <label className="text-xs font-medium uppercase text-base-content/60">Còn lại</label>
                            <p className="text-2xl font-bold text-success mt-1">
                                {quotaInfo.remainingPaid === -1 ? "∞" : quotaInfo.remainingPaid}
                            </p>
                        </div>
                    </div>

                    {quotaInfo.wholesalePackagePrice && (
                        <div className="mt-4 bg-base-100 p-4 rounded-lg shadow-sm flex justify-between items-center">
                            <label className="text-sm font-medium text-base-content/70">Giá mua gói (sỉ)</label>
                            <p className="text-lg font-bold font-mono text-primary">
                                {new Intl.NumberFormat("vi-VN").format(quotaInfo.wholesalePackagePrice)} VND
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Quota Management Form */}
            <div className="bg-base-100 rounded-xl border border-base-200 p-6 shadow-sm">
                <h4 className="font-semibold mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Cấu hình Quota
                </h4>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Quota xuất báo cáo trả phí</span>
                        </label>
                        <div className="join">
                            <input
                                type="number"
                                className="input input-bordered w-full join-item focus:outline-none"
                                placeholder="Để trống = Không giới hạn"
                                value={formData.paidExportLimit ?? ""}
                                onChange={(e) => handleChange(
                                    'paidExportLimit',
                                    e.target.value === "" ? null : parseInt(e.target.value)
                                )}
                                disabled={!canEdit}
                            />
                            <span className="btn btn-disabled join-item text-base-content/50 bg-base-200/50">bài</span>
                        </div>
                        <label className="label">
                            <span className="label-text-alt text-base-content/50">0 = Tắt tính năng này</span>
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Giá mua gói (sỉ)</span>
                        </label>
                        <div className="join">
                            <input
                                type="number"
                                className="input input-bordered w-full join-item focus:outline-none"
                                placeholder="Ví dụ: 5000000"
                                value={formData.wholesalePackagePrice ?? ""}
                                onChange={(e) => handleChange(
                                    'wholesalePackagePrice',
                                    e.target.value === "" ? null : parseFloat(e.target.value)
                                )}
                            />
                            <span className="btn btn-disabled join-item text-base-content/50 bg-base-200/50">VND</span>
                        </div>
                        <label className="label">
                            <span className="label-text-alt text-base-content/50">Optional: để báo cáo nội bộ</span>
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Chu kỳ reset</span>
                        </label>
                        <select
                            className="select select-bordered w-full"
                            value={formData.resetPeriod}
                            onChange={(e) => handleChange('resetPeriod', e.target.value)}
                        >
                            <option value="MANUAL">Thủ công (Không tự động)</option>
                            <option value="MONTHLY">Hàng tháng</option>
                            <option value="QUARTERLY">Hàng quý</option>
                            <option value="YEARLY">Hàng năm</option>
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Trạng thái</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-4 p-3 border border-base-200 rounded-lg hover:bg-base-50 transition-colors">
                            <input
                                type="checkbox"
                                className="toggle toggle-primary"
                                checked={formData.active}
                                onChange={(e) => handleChange('active', e.target.checked)}
                            />
                            <span className="label-text">{formData.active ? 'Đang kích hoạt' : 'Vô hiệu hoá'}</span>
                        </label>
                    </div>
                </div>

                <div className="form-control mt-4">
                    <label className="label">
                        <span className="label-text font-medium">Ghi chú nội bộ</span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered h-24 focus:outline-none"
                        placeholder="Ghi chú về gói quota, thỏa thuận, v.v..."
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                    />
                </div>

                {canEdit && (
                    <div className="flex gap-3 mt-6 pt-6 border-t border-base-200">
                        <button
                            className="btn btn-primary min-w-[120px]"
                            onClick={() => onSave(formData)}
                            disabled={saving}
                        >
                            {saving ? <span className="loading loading-spinner loading-sm" /> : "Lưu cấu hình"}
                        </button>

                        {quotaInfo && (
                            <button
                                className="btn btn-ghost hover:btn-error hover:text-white"
                                onClick={onReset}
                                disabled={saving}
                            >
                                Reset Quota về 0
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Export History */}
            <div className="bg-base-100 rounded-xl border border-base-200 p-6 shadow-sm">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Lịch sử xuất báo cáo trả phí
                </h4>
                {exportHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead className="bg-base-200/50">
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Người nhận</th>
                                    <th>Email</th>
                                    <th>Session ID</th>
                                    <th>Loại</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exportHistory.map((exportItem) => (
                                    <tr key={exportItem.id} className="hover:bg-base-50">
                                        <td className="text-xs font-mono text-base-content/70">
                                            {new Date(exportItem.createdAt).toLocaleString("vi-VN")}
                                        </td>
                                        <td className="font-medium">{exportItem.recipientName || "—"}</td>
                                        <td className="text-xs">{exportItem.recipientEmail || "—"}</td>
                                        <td className="text-xs font-mono text-base-content/50">
                                            {exportItem.testSessionId ? exportItem.testSessionId.substring(0, 8) + "..." : "—"}
                                        </td>
                                        <td>
                                            <span className={`badge badge-sm ${exportItem.exportType === 'PAID' ? 'badge-primary badge-outline' :
                                                exportItem.exportType === 'VIEW' ? 'badge-info badge-outline' :
                                                    exportItem.exportType === 'CLICK_PAY' ? 'badge-warning badge-outline' : 'badge-ghost'
                                                }`}>
                                                {exportItem.exportType === 'PAID' ? 'Trả phí' :
                                                    exportItem.exportType === 'VIEW' ? 'Xem online' :
                                                        exportItem.exportType === 'CLICK_PAY' ? 'Yêu cầu trả phí' : 'Miễn phí'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-base-content/40 bg-base-50 rounded-lg">
                        <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>Chưa có lịch sử xuất báo cáo</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuotaManagement;
