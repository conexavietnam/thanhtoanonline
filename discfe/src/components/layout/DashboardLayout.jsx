import { Outlet } from "react-router";

const DashboardLayout = () => {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-6xl flex-col px-4 py-10">
      <div className="flex-1 rounded-3xl bg-base-100/90 px-6 py-6 shadow-lg">
        <Outlet />
      </div>
    </section>
  );
};

export default DashboardLayout;
