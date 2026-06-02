import PaymentManager from "../../features/admin/finance/components/PaymentManager";

const FinanceManagementPage = () => {
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-base-content">Quản lý Tài chính</h2>
                    <p className="text-sm text-base-content/60">Quản lý lịch sử thanh toán</p>
                </div>
            </header>

            <div className="mt-4">
                <PaymentManager />
            </div>
        </div>
    );
};

export default FinanceManagementPage;
