import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import api from "../../lib/api";

const VnPayReturnPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("PROCESSING"); // PROCESSING, SUCCESS, FAILED
    const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const params = Object.fromEntries(searchParams.entries());
                // Call backend to verify and process the return
                // The backend endpoint /payments/vnpay-return returns PaymentDetailResponse
                const { data } = await api.get("/payments/vnpay-return", { params });

                if (data.status === "COMPLETED") {
                    setStatus("SUCCESS");
                    setMessage("Thanh toán thành công!");
                    // Redirect to Thank You page after a short delay
                    setTimeout(() => {
                        // Assuming we can get subscription info or just redirect to generic thank you
                        // We can use the payment reference from data to redirect
                        navigate(`/thank-you?ref=${data.paymentReference}&status=success`, { replace: true });
                    }, 2000);
                } else {
                    setStatus("FAILED");
                    setMessage("Thanh toán thất bại hoặc bị hủy.");
                }
            } catch (error) {
                console.error("Payment verification error:", error);
                setStatus("FAILED");
                setMessage("Có lỗi xảy ra khi xác thực thanh toán.");
            }
        };

        if (searchParams.toString()) {
            verifyPayment();
        } else {
            setStatus("FAILED");
            setMessage("Tham số không hợp lệ.");
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-base-100">
            <div className="text-center">
                {status === "PROCESSING" && <span className="loading loading-spinner loading-lg text-primary"></span>}
                {status === "SUCCESS" && (
                    <div className="text-success">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
                {status === "FAILED" && (
                    <div className="text-error">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                )}
                <h2 className="mt-4 text-xl font-bold">{message}</h2>
                {status === "FAILED" && (
                    <button className="btn btn-primary mt-4" onClick={() => navigate("/checkout")}>
                        Quay lại trang thanh toán
                    </button>
                )}
            </div>
        </div>
    );
};

export default VnPayReturnPage;
