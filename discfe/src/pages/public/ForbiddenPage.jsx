import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

const ForbiddenPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-error mb-4">403</h1>
          <div className="text-6xl mb-4">🚫</div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Không có quyền truy cập
        </h2>
        
        <p className="text-gray-600 mb-8">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây là lỗi.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-primary">
                <span>📊</span>
                Về Dashboard
              </Link>
              {user?.roles?.some(role => 
                ["SUPER_ADMIN", "CONTENT_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN"].includes(role)
              ) && (
                <Link to="/admin" className="btn btn-outline">
                  <span>🛡️</span>
                  Admin Panel
                </Link>
              )}
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              <span>🔐</span>
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;

