const MaintenancePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warning/10 via-base-100 to-error/10 px-4">
      <div className="text-center max-w-2xl w-full">
        <div className="mb-8">
          <div className="text-8xl mb-6">🔧</div>
          <h1 className="text-5xl font-bold text-warning mb-4">Đang bảo trì hệ thống</h1>
        </div>
        
        <div className="bg-base-100 rounded-3xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-base-content mb-4">
            Hệ thống đang được bảo trì
          </h2>
          
          <p className="text-base-content/70 mb-6 text-lg">
            Chúng tôi đang thực hiện nâng cấp và bảo trì hệ thống để mang đến trải nghiệm tốt hơn cho bạn.
          </p>
          
          <div className="space-y-4 text-left bg-base-200/50 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-base-content">Thời gian bảo trì</p>
                <p className="text-sm text-base-content/60">
                  Chúng tôi sẽ hoàn tất sớm nhất có thể. Vui lòng quay lại sau.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="font-semibold text-base-content">Liên hệ hỗ trợ</p>
                <p className="text-sm text-base-content/60">
                  Nếu có vấn đề khẩn cấp, vui lòng liên hệ với chúng tôi qua email.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-base-content">Thông báo</p>
                <p className="text-sm text-base-content/60">
                  Hệ thống sẽ tự động hoạt động trở lại sau khi bảo trì hoàn tất.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary btn-lg"
            >
              <span>🔄</span>
              Tải lại trang
            </button>
          </div>
        </div>
        
        <p className="text-sm text-base-content/50">
          Cảm ơn bạn đã kiên nhẫn chờ đợi!
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;

