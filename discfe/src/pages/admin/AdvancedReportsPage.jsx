import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminReportsAPI } from "../../lib/api.js";

const AdvancedReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data } = await adminReportsAPI.getAdvanced();
      setReport(data);
      setError(null);
    } catch (err) {
      setError("Không thể tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "0 ₫";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (value) => {
    if (value == null) return "0";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const formatPercentage = (value) => {
    if (value == null) return "0%";
    return `${Number(value).toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-base-content/70">Đang tải báo cáo...</p>
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-12">Không có dữ liệu báo cáo</div>;
  }

  const { revenueReport, topPerformers, conversionMetrics, dailyRevenue, weeklyRevenue, monthlyRevenue } = report;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pb-4 border-b border-base-300">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Báo cáo nâng cao</h2>
          <p className="text-sm text-base-content/60">Phân tích chi tiết doanh thu, chuyển đổi và hiệu suất</p>
        </div>
        <button
          className="btn btn-primary btn-sm gap-2"
          onClick={loadReport}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </header>

      {/* Revenue Report */}
      <section className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-6">
        <h3 className="text-xl font-bold text-base-content mb-4">📊 Báo cáo Doanh thu</h3>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title text-xs">Tổng doanh thu</div>
            <div className="stat-value text-lg text-primary">{formatCurrency(revenueReport?.totalRevenue)}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title text-xs">Hôm nay</div>
            <div className="stat-value text-lg text-secondary">{formatCurrency(revenueReport?.todayRevenue)}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title text-xs">Tuần này</div>
            <div className="stat-value text-lg text-accent">{formatCurrency(revenueReport?.thisWeekRevenue)}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title text-xs">Tháng này</div>
            <div className="stat-value text-lg">{formatCurrency(revenueReport?.thisMonthRevenue)}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title text-xs">Tháng trước</div>
            <div className="stat-value text-lg">{formatCurrency(revenueReport?.lastMonthRevenue)}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title text-xs">Tăng trưởng</div>
            <div className={`stat-value text-lg ${revenueReport?.revenueGrowth >= 0 ? 'text-success' : 'text-error'}`}>
              {formatPercentage(revenueReport?.revenueGrowth)}
            </div>
          </div>
        </div>
      </section>

      {/* Conversion Metrics */}
      <section className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-6">
        <h3 className="text-xl font-bold text-base-content mb-4">🔄 Chỉ số Chuyển đổi</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="stat bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg p-4">
            <div className="stat-title text-white/80">Tỷ lệ chuyển đổi tổng</div>
            <div className="stat-value text-2xl">{formatPercentage(conversionMetrics?.overallConversionRate)}</div>
          </div>
          <div className="stat bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg p-4">
            <div className="stat-title text-white/80">Free → Paid</div>
            <div className="stat-value text-2xl">{formatPercentage(conversionMetrics?.freeToPaidConversion)}</div>
          </div>
          <div className="stat bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg p-4">
            <div className="stat-title text-white/80">Theo gói</div>
            <div className="stat-value text-2xl">
              {conversionMetrics?.conversionByPlan ? Object.keys(conversionMetrics.conversionByPlan).length : 0}
            </div>
          </div>
          <div className="stat bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg p-4">
            <div className="stat-title text-white/80">Theo nguồn</div>
            <div className="stat-value text-2xl">
              {conversionMetrics?.conversionBySource ? Object.keys(conversionMetrics.conversionBySource).length : 0}
            </div>
          </div>
        </div>

        {conversionMetrics?.conversionByPlan && Object.keys(conversionMetrics.conversionByPlan).length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Chuyển đổi theo gói</h4>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Gói</th>
                    <th>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(conversionMetrics.conversionByPlan).map(([plan, rate]) => (
                    <tr key={plan}>
                      <td className="font-medium">{plan}</td>
                      <td>{formatPercentage(rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Top Performers */}
      <section className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-6">
        <h3 className="text-xl font-bold text-base-content mb-4">🏆 Top Performers</h3>
        
        {topPerformers?.topClicks && topPerformers.topClicks.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Top Clicks</h4>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Tên</th>
                    <th>Số lượt click</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.topClicks.map((click, idx) => (
                    <tr key={idx}>
                      <td>{click.entityType}</td>
                      <td className="font-medium">{click.entityName}</td>
                      <td>{formatNumber(click.clickCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {topPerformers?.topSellers && topPerformers.topSellers.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Top Sellers</h4>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Số giao dịch</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.topSellers.map((seller, idx) => (
                    <tr key={idx}>
                      <td className="font-medium">{seller.sellerName}</td>
                      <td>{seller.sellerEmail}</td>
                      <td>{formatNumber(seller.salesCount)}</td>
                      <td>{formatCurrency(seller.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {topPerformers?.topPartners && topPerformers.topPartners.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Top Partners</h4>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Số giới thiệu</th>
                    <th>Tổng hoa hồng</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.topPartners.map((partner, idx) => (
                    <tr key={idx}>
                      <td className="font-medium">{partner.partnerName}</td>
                      <td>{partner.partnerEmail}</td>
                      <td>{formatNumber(partner.referralsCount)}</td>
                      <td>{formatCurrency(partner.totalCommission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(!topPerformers?.topClicks?.length && !topPerformers?.topSellers?.length && !topPerformers?.topPartners?.length) && (
          <p className="text-base-content/60">Chưa có dữ liệu top performers</p>
        )}
      </section>

      {/* Revenue Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Revenue */}
        <section className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-6">
          <h3 className="text-lg font-bold text-base-content mb-4">📅 Doanh thu theo ngày (30 ngày gần nhất)</h3>
          {dailyRevenue && dailyRevenue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full table-sm">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Doanh thu</th>
                    <th>Giao dịch</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRevenue.slice(0, 10).map((item, idx) => (
                    <tr key={idx}>
                      <td>{formatDate(item.date)}</td>
                      <td>{formatCurrency(item.revenue)}</td>
                      <td>{formatNumber(item.transactionCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dailyRevenue.length > 10 && (
                <p className="text-xs text-base-content/60 mt-2">Hiển thị 10/30 bản ghi gần nhất</p>
              )}
            </div>
          ) : (
            <p className="text-base-content/60">Chưa có dữ liệu</p>
          )}
        </section>

        {/* Weekly Revenue */}
        <section className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-6">
          <h3 className="text-lg font-bold text-base-content mb-4">📆 Doanh thu theo tuần (12 tuần gần nhất)</h3>
          {weeklyRevenue && weeklyRevenue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full table-sm">
                <thead>
                  <tr>
                    <th>Tuần</th>
                    <th>Doanh thu</th>
                    <th>Giao dịch</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyRevenue.slice(0, 8).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.weekLabel}</td>
                      <td>{formatCurrency(item.revenue)}</td>
                      <td>{formatNumber(item.transactionCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {weeklyRevenue.length > 8 && (
                <p className="text-xs text-base-content/60 mt-2">Hiển thị 8/12 bản ghi gần nhất</p>
              )}
            </div>
          ) : (
            <p className="text-base-content/60">Chưa có dữ liệu</p>
          )}
        </section>
      </div>

      {/* Monthly Revenue */}
      <section className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-6">
        <h3 className="text-lg font-bold text-base-content mb-4">📊 Doanh thu theo tháng (12 tháng gần nhất)</h3>
        {monthlyRevenue && monthlyRevenue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Tháng</th>
                  <th>Doanh thu</th>
                  <th>Giao dịch</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRevenue.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{item.monthLabel}</td>
                    <td>{formatCurrency(item.revenue)}</td>
                    <td>{formatNumber(item.transactionCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-base-content/60">Chưa có dữ liệu</p>
        )}
      </section>
    </div>
  );
};

export default AdvancedReportsPage;
