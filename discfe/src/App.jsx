import { Link } from "react-router";

const sellingPoints = [
  {
    title: "Test DISC chuẩn quốc tế",
    description:
      "Ngân hàng câu hỏi được cố vấn bởi chuyên gia, đo lường chính xác 4 nhóm tính cách: Dominance, Influence, Steadiness, Compliance.",
  },
  {
    title: "Báo cáo cá nhân hoá",
    description:
      "Phân tích hành vi, điểm mạnh/yếu theo ngữ cảnh và đề xuất nghề nghiệp phù hợp theo mô hình OKR/SMART.",
  },
  {
    title: "Tự động hoá upsell",
    description:
      "Gửi báo cáo qua Email/Zalo, nhắc nhở nâng cấp, tạo mã giới thiệu để nhân rộng doanh thu.",
  },
];

const stats = [
  { value: "70%", label: "Người dùng chuyển đổi lên gói Cá nhân" },
  { value: "15+", label: "Nghề nghiệp gợi ý cho từng hồ sơ" },
  { value: "24h", label: "Một vòng nurturing tự động" },
];

const App = () => (
  <>
    <section className="bg-gradient-to-br from-primary/5 via-base-100 to-secondary/10">
      <div className="mx-auto flex max-w-6xl flex-col-reverse gap-16 px-4 py-16 md:flex-row md:items-center md:py-24">
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            DISC SaaS dành cho người Việt
          </span>
          <h1 className="text-4xl font-bold leading-tight text-base-content md:text-5xl">
            Thấu hiểu tính cách – định hướng nghề nghiệp – phát triển thu nhập từ DISC
          </h1>
          <p className="text-base text-base-content/70 md:text-lg">
            Mua gói DISC để làm bài test và nhận ngay báo cáo chuyên sâu về lộ trình nghề nghiệp,&nbsp;
            điểm mạnh/yếu theo ngữ cảnh và tài liệu luyện tập có cố vấn đồng hành.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/plans" className="btn btn-primary btn-lg">
              Chọn gói ngay
            </Link>
            <Link to="/checkout?plan=PERSONAL" className="btn btn-ghost btn-lg">
              Nâng cấp gói Cá Nhân
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.value} className="rounded-2xl border border-base-200 bg-base-100/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-base-content/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="relative mx-auto max-w-md rounded-3xl bg-base-100 p-8 shadow-2xl">
            <div className="absolute -top-6 right-6 rounded-2xl bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary">
              Lộ trình 3 bước
            </div>
            <h2 className="text-xl font-semibold text-base-content">Hệ sinh thái DISCWAKE</h2>
            <ol className="mt-6 space-y-4 text-sm text-base-content/80">
              <li className="flex gap-3">
                <span className="badge badge-primary badge-outline mt-0.5">B1</span>
                Làm test chuẩn quốc tế, nhận bản xem trước 70% kết quả và hành vi nổi bật.
              </li>
              <li className="flex gap-3">
                <span className="badge badge-primary badge-outline mt-0.5">B2</span>
                Nâng cấp để mở khoá nghề nghiệp phù hợp, lộ trình 3–6 tháng và tài liệu luyện tập.
              </li>
              <li className="flex gap-3">
                <span className="badge badge-primary badge-outline mt-0.5">B3</span>
                Trở thành cộng tác viên/đối tác, chia sẻ link referral và nhận hoa hồng tự động.
              </li>
            </ol>
            <div className="mt-8 rounded-2xl bg-primary/5 p-4 text-sm text-base-content/70">
              "Mục tiêu 1 năm: Mỗi người Việt hiểu rõ bản thân qua DISC và có thể tạo thêm thu nhập nhờ chia sẻ kiến thức."
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-3xl font-semibold text-base-content md:text-4xl">
        Giải pháp DISC toàn diện cho cá nhân, cộng tác viên và doanh nghiệp
      </h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {sellingPoints.map((point) => (
          <div key={point.title} className="rounded-3xl border border-base-200 bg-base-100/90 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-base-content">{point.title}</h3>
            <p className="mt-3 text-sm text-base-content/70">{point.description}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="bg-base-100 py-16">
      <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-primary/90 to-secondary/80 px-8 py-12 text-base-100 shadow-2xl">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-semibold">Nâng cấp để nhận trọn bộ giá trị DISC</h2>
            <p className="mt-3 text-base-100/80">
              Gói Cá Nhân là lựa chọn phổ biến nhất, cung cấp nghề nghiệp phù hợp, kế hoạch phát triển 6 tháng và nhắc nhở luyện tập. Gói VIP bổ sung cố vấn đồng hành và cập nhật tài liệu hàng tuần.
            </p>
          </div>
          <div className="space-y-4 rounded-3xl bg-base-100/10 p-6 backdrop-blur">
            <div>
              <h3 className="text-lg font-semibold">Gói Cá Nhân</h3>
              <p className="text-sm text-base-100/80">10–20 nghề phù hợp, phân tích điểm mạnh/yếu theo ngữ cảnh, lộ trình 3–6 tháng, tài liệu luyện tập.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Gói VIP</h3>
              <p className="text-sm text-base-100/80">Nhắc luyện tập hàng tuần, cố vấn DISC đồng hành, cập nhật tài nguyên liên tục và ưu đãi referral.</p>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/checkout?plan=PERSONAL" className="btn btn-secondary btn-lg text-base-100">
            Thanh toán gói Cá Nhân
          </Link>
          <Link to="/plans" className="btn btn-outline btn-lg border-base-100 text-base-100">
            So sánh tất cả gói
          </Link>
        </div>
      </div>
    </section>
  </>
);

export default App;
