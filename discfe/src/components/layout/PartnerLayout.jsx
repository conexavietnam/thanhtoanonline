import { NavLink, Outlet } from "react-router";

const partnerLinks = [
  { to: "/partner", label: "Tổng quan", end: true },
  { to: "/partner/referrals", label: "Danh sách giới thiệu" },
];

const PartnerLayout = () => (
  <section className="mx-auto flex min-h-[70vh] max-w-5xl flex-col gap-6 px-4 py-10">
    <header>
      <h1 className="text-3xl font-bold text-primary">Không gian cộng tác viên</h1>
      <p className="mt-1 text-sm text-base-content/70">
        Theo dõi lượt giới thiệu, hoa hồng dự kiến và chia sẻ đường link DISC của bạn.
      </p>
    </header>
    <div className="rounded-3xl bg-base-100/90 p-4 shadow-lg">
      <div className="tabs tabs-boxed">
        {partnerLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `tab text-sm font-semibold ${isActive ? "tab-active" : "text-base-content/70"}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
    <div className="rounded-3xl bg-base-100/90 px-6 py-6 shadow-lg">
      <Outlet />
    </div>
  </section>
);

export default PartnerLayout;

