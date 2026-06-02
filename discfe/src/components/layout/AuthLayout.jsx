import { Outlet, Link } from "react-router";

const AuthLayout = () => (
  <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 via-base-100 to-secondary/10">
    <div className="flex-1">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4">
        <Link to="/" className="mb-8 text-2xl font-semibold text-primary">
          DISCWAKE
        </Link>
        <div className="w-full max-w-lg rounded-3xl bg-base-100 p-6 shadow-xl md:p-10">
          <Outlet />
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
