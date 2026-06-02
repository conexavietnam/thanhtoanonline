import { Trash2 } from "lucide-react";

/**
 * A reusable confirm modal for destructive actions (e.g. delete).
 *
 * Props:
 *   open        – boolean, whether the modal is shown
 *   onClose     – () => void, called when user cancels
 *   onConfirm   – () => void, called when user confirms
 *   title       – string, modal heading
 *   description – string, body text
 *   confirmLabel– string (default "Xoá"), text for confirm button
 *   loading     – boolean, disables buttons while async operation is running
 *   danger      – boolean (default true), renders red confirm button
 */
const ConfirmModal = ({
    open,
    onClose,
    onConfirm,
    title = "Xác nhận xoá",
    description = "Hành động này không thể hoàn tác. Bạn có chắc muốn tiếp tục?",
    confirmLabel = "Xoá",
    loading = false,
    danger = true,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={!loading ? onClose : undefined}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] animate-fade-in-up">
                {/* Icon */}
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                    <Trash2 className="h-5 w-5" />
                </div>

                {/* Content */}
                <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        className="btn btn-ghost rounded-2xl"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Huỷ
                    </button>
                    <button
                        type="button"
                        className={`btn rounded-2xl gap-2 ${danger ? "bg-rose-600 text-white hover:bg-rose-700 border-0" : "btn-warning"}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading && <span className="loading loading-spinner loading-sm" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
