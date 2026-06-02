import { useEffect } from "react";
import { createPortal } from "react-dom";
import SignIn from "../../../pages/auth/SignIn.jsx";
import SignUp from "../../../pages/auth/SignUp.jsx";

// Wrapper components (kept for potential modal-specific props/extensions)
const ModalSignIn = (props) => <SignIn {...props} />;
const ModalSignUp = (props) => <SignUp {...props} />;

const AuthModal = ({ open, mode = "login", onClose, onSwitchMode }) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const tabs = [
    { key: "login", label: "Đăng nhập" },
    { key: "register", label: "Đăng ký" },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl md:max-w-2xl rounded-3xl bg-base-100 shadow-2xl border border-base-200/70 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle absolute right-4 top-4 z-10"
            aria-label="Đóng"
          >
            ✕
          </button>

          <div className="px-6 pt-14 pb-6">
            <div className="flex gap-2 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onSwitchMode?.(tab.key)}
                  className={`px-4 py-2 rounded-full font-semibold transition-all border ${
                    mode === tab.key
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "bg-base-200 text-base-content/80 border-base-300 hover:bg-base-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="max-h-[65vh] overflow-y-auto pr-1">
              {mode === "register" ? <ModalSignUp /> : <ModalSignIn />}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
