import { useEffect, useState } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import api from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const UserDashboard = () => {
  const { user, loadProfile } = useAuth();
  const [latestResult, setLatestResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const fetchLatestResult = async () => {
      try {
        const { data } = await api.get("/disc/tests/latest");
        setLatestResult(data);
      } catch (error) {
        setLatestResult(null);
      } finally {
        setLoadingResult(false);
      }
    };

    fetchLatestResult();
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-base-content">Xin chào, {user?.fullName ?? user?.email}</h2>
        <p className="text-sm text-base-content/70">
          Hoàn thành bài test DISC để mở khoá lộ trình phát triển, gợi ý nghề nghiệp và tài liệu luyện tập.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-base-content/70">Gói hiện tại</h3>
          <p className="mt-2 text-xl font-semibold text-primary">{user?.activeSubscription?.planName ?? "Chưa có gói trả phí"}</p>
          <p className="mt-1 text-xs text-base-content/60">
            {user?.activeSubscription?.planCode === "FREE" || !user?.activeSubscription
              ? "Nâng cấp để xem toàn bộ kết quả và nghề nghiệp đề xuất"
              : "Bạn đang sở hữu quyền truy cập đầy đủ"}
          </p>
          <div className="mt-3">
            <p className="text-sm font-semibold text-base-content/70">Credit hiện có</p>
            <p className="text-lg font-bold text-accent">{user?.pdfExportCredits ?? 0}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <Link to="/plans#user-plans" className="btn btn-outline btn-sm">
              Nâng cấp gói
            </Link>
            <Link to="/test" className="btn btn-primary btn-sm">
              Làm bài test
            </Link>
          </div>
        </article>
        <article className="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-base-content/70">Đường link giới thiệu</h3>
          <p className="mt-2 text-sm text-base-content/80 break-all">
            {`${window.location.origin}/register?ref=${user?.referralCode}`}
          </p>
          <p className="mt-1 text-xs text-base-content/60">
            Chia sẻ để nhận hoa hồng khi khách nâng cấp gói Cá Nhân hoặc VIP.
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-3"
            onClick={async () => {
              try {
                if (navigator?.clipboard?.writeText) {
                  await navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.referralCode}`);
                  toast.success("Đã sao chép link!");
                } else {
                  // Fallback
                  const textArea = document.createElement("textarea");
                  textArea.value = `${window.location.origin}/register?ref=${user?.referralCode}`;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand("copy");
                  document.body.removeChild(textArea);
                  toast.success("Đã sao chép link!");
                }
              } catch (err) {
                console.error("Copy failed", err);
                toast.error("Sao chép thất bại!");
              }
            }}
          >
            Sao chép link
          </button>
        </article>

      </section>

      <section className="rounded-3xl border border-base-200 bg-base-100 p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-base-content">Kết quả DISC gần nhất</h3>
            <p className="text-sm text-base-content/60">Xem top nhóm tính cách, nghề nghiệp đề xuất và lộ trình luyện tập.</p>
          </div>
          <Link to="/dashboard/results" className="btn btn-outline btn-sm">
            Xem chi tiết
          </Link>
        </div>
        <div className="mt-6 min-h-[120px] rounded-2xl bg-base-200/40 p-6">
          {loadingResult ? (
            <div className="flex h-full items-center justify-center">
              <span className="loading loading-spinner text-primary" />
            </div>
          ) : latestResult ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Top nhóm tính cách</p>
                <p className="mt-2 text-xl font-semibold text-primary">{latestResult.topDimensions.slice(0, 2).join(" & ")}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Điểm số</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {latestResult.dimensionScores.map((score) => (
                    <span key={score.dimension} className="badge badge-outline">
                      {score.dimension.slice(0, 1)}: {score.score}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Trạng thái</p>
                <p className="mt-2 text-sm text-base-content/70">
                  {latestResult.fullDetailUnlocked
                    ? "Bạn đã mở khoá toàn bộ nội dung báo cáo"
                    : `Đang xem preview ${latestResult.previewCoveragePercentage}%`}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-base-content/70">
              Chưa có bài test nào. Hãy bắt đầu bằng việc <Link to="/test" className="link">làm bài đánh giá DISC đầu tiên</Link>.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserDashboard;
