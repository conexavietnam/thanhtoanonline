import { useEffect, useState } from "react";
import { analyticsAPI } from "../../lib/api.js";

const DiscAnalyticsPage = () => {
  const [statistics, setStatistics] = useState(null);
  const [behavior, setBehavior] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("disc-stats"); // "disc-stats" | "user-behavior"

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, behaviorRes] = await Promise.all([
        analyticsAPI.getDiscStatistics(),
        analyticsAPI.getUserBehavior()
      ]);
      setStatistics(statsRes.data);
      setBehavior(behaviorRes.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          <h2 className="text-2xl font-bold text-base-content">Phân tích DISC & Hành vi người dùng</h2>
          <p className="text-sm text-base-content/60">Thống kê nhóm DISC phổ biến và hành vi người dùng</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={loadData}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </header>

      {/* Tabs */}
      <div className="tabs tabs-boxed">
        <button
          className={`tab ${activeTab === "disc-stats" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("disc-stats")}
        >
          Thống kê DISC
        </button>
        <button
          className={`tab ${activeTab === "user-behavior" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("user-behavior")}
        >
          Hành vi người dùng
        </button>
      </div>

      {/* DISC Statistics Tab */}
      {activeTab === "disc-stats" && statistics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title">Tổng số bài test</div>
              <div className="stat-value text-primary">{statistics.totalTests}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title">Bài test gần đây (30 ngày)</div>
              <div className="stat-value text-secondary">{statistics.recentTests}</div>
            </div>
          </div>

          {/* Dimension Distribution */}
          <section className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-base-content mb-4">Phân bố nhóm DISC</h3>
            <div className="space-y-4">
              {statistics.dimensionStats.map((stat) => (
                <div key={stat.dimension} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base-content">{stat.dimension}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-base-content/70">
                        {stat.count} người ({Number(stat.percentage).toFixed(1)}%)
                      </span>
                      <span className="text-sm text-base-content/60">
                        Điểm TB: {stat.averageScore}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-base-200 rounded-full h-4 relative overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stat.dimension === 'DOMINANCE' ? 'bg-error' :
                        stat.dimension === 'INFLUENCE' ? 'bg-warning' :
                        stat.dimension === 'STEADINESS' ? 'bg-success' :
                        'bg-info'
                      }`}
                      style={{ width: `${Number(stat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top Profile Combinations */}
          {statistics.topProfileCombinations && statistics.topProfileCombinations.length > 0 && (
            <section className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-base-content mb-4">Tổ hợp DISC phổ biến nhất</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {statistics.topProfileCombinations.map((combo, idx) => (
                  <div key={idx} className="rounded-lg border border-base-200 bg-base-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-base-content">{combo.combination}</span>
                      <span className="badge badge-primary badge-sm">{combo.count} người</span>
                    </div>
                    <div className="text-sm text-base-content/70">
                      {Number(combo.percentage).toFixed(2)}% tổng số
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Trends */}
          {statistics.recentTrends && Object.keys(statistics.recentTrends).length > 0 && (
            <section className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-base-content mb-4">Xu hướng 30 ngày gần đây</h3>
              <div className="grid gap-4 md:grid-cols-4">
                {Object.entries(statistics.recentTrends).map(([dimension, count]) => (
                  <div key={dimension} className="stat bg-base-200 rounded-lg p-4">
                    <div className="stat-title text-xs">{dimension}</div>
                    <div className="stat-value text-lg">{count}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* User Behavior Tab */}
      {activeTab === "user-behavior" && behavior && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title text-xs">Bắt đầu test</div>
              <div className="stat-value text-lg text-primary">{behavior.testStarted}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title text-xs">Hoàn thành test</div>
              <div className="stat-value text-lg text-success">{behavior.testCompleted}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title text-xs">Tỷ lệ hoàn thành</div>
              <div className="stat-value text-lg text-info">
                {Number(behavior.completionRate).toFixed(1)}%
              </div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-title text-xs">Xem nghề nghiệp</div>
              <div className="stat-value text-lg text-warning">{behavior.careerViewed}</div>
            </div>
          </div>

          {/* Conversion Rates */}
          <section className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-base-content mb-4">Tỷ lệ chuyển đổi</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base-content/70">Tỷ lệ hoàn thành test</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-base-200 rounded-full h-4">
                    <div
                      className="bg-primary h-4 rounded-full"
                      style={{ width: `${Number(behavior.completionRate)}%` }}
                    />
                  </div>
                  <span className="font-semibold w-20 text-right">
                    {Number(behavior.completionRate).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base-content/70">Tỷ lệ xem nghề nghiệp</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-base-200 rounded-full h-4">
                    <div
                      className="bg-success h-4 rounded-full"
                      style={{ width: `${Number(behavior.careerViewRate)}%` }}
                    />
                  </div>
                  <span className="font-semibold w-20 text-right">
                    {Number(behavior.careerViewRate).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base-content/70">Tỷ lệ đăng ký khóa học</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-base-200 rounded-full h-4">
                    <div
                      className="bg-warning h-4 rounded-full"
                      style={{ width: `${Number(behavior.enrollmentRate)}%` }}
                    />
                  </div>
                  <span className="font-semibold w-20 text-right">
                    {Number(behavior.enrollmentRate).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Event Counts */}
          {behavior.eventCounts && Object.keys(behavior.eventCounts).length > 0 && (
            <section className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-base-content mb-4">Số lượng sự kiện</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(behavior.eventCounts).map(([eventType, count]) => (
                  <div key={eventType} className="flex items-center justify-between p-3 rounded-lg bg-base-200">
                    <span className="text-sm text-base-content/70">{eventType}</span>
                    <span className="badge badge-primary badge-sm">{count}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscAnalyticsPage;

