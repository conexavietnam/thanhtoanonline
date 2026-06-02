import { Link } from "react-router";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
          <div className="text-6xl mb-4">🔍</div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Trang không tìm thấy
        </h2>
        
        <p className="text-gray-600 mb-8">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn btn-primary">
            <span>🏠</span>
            Về trang chủ
          </Link>
          <Link to="/dashboard" className="btn btn-outline">
            <span>📊</span>
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

