import { Outlet } from "react-router";
import Navbar from "../common/Navbar.jsx";
import Footer from "../common/Footer.jsx";

const AppLayout = () => (
  <div className="flex min-h-screen flex-col bg-gradient-to-b from-base-100 to-base-200">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default AppLayout;

