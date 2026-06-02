import React from 'react';

const PartnerStats = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <span className="loading loading-spinner text-primary" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-8 text-base-content/60">
                Không có dữ liệu thống kê
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Revenue & Commission Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="stat bg-base-100 border border-base-200 shadow-sm rounded-2xl p-4 transition-all hover:shadow-md">
                    <div className="stat-title text-xs font-medium uppercase tracking-wider text-base-content/60">Tổng doanh thu</div>
                    <div className="stat-value text-xl font-bold text-success mt-1">
                        {new Intl.NumberFormat("vi-VN").format(stats.totalRevenue || 0)} <span className="text-xs font-normal text-base-content/50">VND</span>
                    </div>
                </div>
                <div className="stat bg-base-100 border border-base-200 shadow-sm rounded-2xl p-4 transition-all hover:shadow-md">
                    <div className="stat-title text-xs font-medium uppercase tracking-wider text-base-content/60">Hoa hồng chờ duyệt</div>
                    <div className="stat-value text-xl font-bold text-warning mt-1">
                        {new Intl.NumberFormat("vi-VN").format(stats.pendingCommission || 0)} <span className="text-xs font-normal text-base-content/50">VND</span>
                    </div>
                </div>
                <div className="stat bg-base-100 border border-base-200 shadow-sm rounded-2xl p-4 transition-all hover:shadow-md">
                    <div className="stat-title text-xs font-medium uppercase tracking-wider text-base-content/60">Hoa hồng đã duyệt</div>
                    <div className="stat-value text-xl font-bold text-info mt-1">
                        {new Intl.NumberFormat("vi-VN").format(stats.approvedCommission || 0)} <span className="text-xs font-normal text-base-content/50">VND</span>
                    </div>
                </div>
                <div className="stat bg-base-100 border border-base-200 shadow-sm rounded-2xl p-4 transition-all hover:shadow-md">
                    <div className="stat-title text-xs font-medium uppercase tracking-wider text-base-content/60">Hoa hồng đã thanh toán</div>
                    <div className="stat-value text-xl font-bold text-success mt-1">
                        {new Intl.NumberFormat("vi-VN").format(stats.paidCommission || 0)} <span className="text-xs font-normal text-base-content/50">VND</span>
                    </div>
                </div>
            </div>

            {/* Referral Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="stat bg-base-100 border border-base-200 shadow-sm rounded-2xl p-4 transition-all hover:shadow-md">
                    <div className="stat-title text-xs font-medium uppercase tracking-wider text-base-content/60">Tổng referrals</div>
                    <div className="stat-value text-xl font-bold mt-1">{stats.totalReferrals || 0}</div>
                </div>
                <div className="stat bg-base-100 border border-base-200 shadow-sm rounded-2xl p-4 transition-all hover:shadow-md">
                    <div className="stat-title text-xs font-medium uppercase tracking-wider text-base-content/60">Đã kích hoạt</div>
                    <div className="stat-value text-xl font-bold text-success mt-1">{stats.qualifiedReferrals || 0}</div>
                </div>
                <div className="stat bg-base-100 border border-base-200 shadow-sm rounded-2xl p-4 transition-all hover:shadow-md">
                    <div className="stat-title text-xs font-medium uppercase tracking-wider text-base-content/60">Đã thanh toán</div>
                    <div className="stat-value text-xl font-bold text-primary mt-1">{stats.paidReferrals || 0}</div>
                </div>
                <div className="stat bg-base-100 border border-base-200 shadow-sm rounded-2xl p-4 transition-all hover:shadow-md">
                    <div className="stat-title text-xs font-medium uppercase tracking-wider text-base-content/60">Đang chờ</div>
                    <div className="stat-value text-xl font-bold text-warning mt-1">{stats.pendingReferrals || 0}</div>
                </div>
            </div>

            {/* Monthly Revenue Chart */}
            {stats.monthlyRevenues && stats.monthlyRevenues.length > 0 && (
                <div className="bg-base-100 border border-base-200 shadow-sm rounded-2xl p-6">
                    <h4 className="font-semibold mb-6 text-lg">Doanh thu theo tháng (6 tháng gần nhất)</h4>
                    <div className="space-y-4">
                        {stats.monthlyRevenues.map((month, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-sm items-end">
                                    <span className="font-medium text-base-content/80">{month.monthLabel}</span>
                                    <div className="text-right">
                                        <div className="font-bold">{new Intl.NumberFormat("vi-VN").format(month.revenueAmount || 0)} VND</div>
                                        <div className="text-xs text-base-content/50">{month.referralsCount} referrals</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-base-200 rounded-full h-3 relative overflow-hidden">
                                        <div
                                            className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${Math.min(100, (month.revenueAmount / (stats.totalRevenue || 1)) * 100)}%`
                                            }}
                                        />
                                    </div>
                                    <div className="text-xs font-medium w-32 text-right text-base-content/60">
                                        Hoa hồng: {new Intl.NumberFormat("vi-VN").format(month.commissionAmount || 0)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerStats;
