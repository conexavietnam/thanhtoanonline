import { Link } from "react-router";

const ServerErrorPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-error mb-4">500</h1>
          <div className="text-6xl mb-4">⚠️</div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Lỗi máy chủ
        </h2>
        
        <p className="text-gray-600 mb-8">
          Có lỗi xảy ra trên máy chủ. Chúng tôi đang xử lý vấn đề này. Vui lòng thử lại sau.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            <span>🔄</span>
            Tải lại trang
          </button>
          <Link to="/" className="btn btn-outline">
            <span>🏠</span>
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;

