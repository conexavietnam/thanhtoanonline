import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { partnerCustomizationAPI } from "../../lib/api.js";

const PartnerCustomizationPage = () => {
  const [form, setForm] = useState({
    domain: "",
    logoUrl: "",
    brandName: "",
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [hasCustomization, setHasCustomization] = useState(false);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  useEffect(() => {
    loadCustomization();
  }, []);

  const loadCustomization = async () => {
    setLoading(true);
    try {
      const { data } = await partnerCustomizationAPI.get();
      setForm({
        domain: data.domain || "",
        logoUrl: data.logoUrl || "",
        brandName: data.brandName || "",
        active: data.active !== undefined ? data.active : true,
      });
      setHasCustomization(true);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setHasCustomization(false);
      } else {
        setError("Không thể tải customization");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await partnerCustomizationAPI.update(form);
      setMessage("Cập nhật customization thành công");
      setHasCustomization(true);
      await loadCustomization();
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn chắc chắn muốn xóa customization này?")) return;
    setSaving(true);
    try {
      await partnerCustomizationAPI.delete();
      setMessage("Xóa customization thành công");
      setForm({
        domain: "",
        logoUrl: "",
        brandName: "",
        active: true,
      });
      setHasCustomization(false);
    } catch (err) {
      setError("Xóa thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-base-content">Tùy chỉnh Branding</h2>
        <p className="text-sm text-base-content/60">
          Tùy chỉnh website của bạn với domain riêng, logo và tên thương hiệu.
          Khi người dùng truy cập qua domain của bạn, họ sẽ thấy website với branding riêng.
          Màu sắc được quản lý trong Settings của Admin.
        </p>
      </header>

      {message && (
        <div className="alert alert-success">
          <span>{message}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <section className="rounded-2xl border border-base-200 bg-base-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">
                <span className="label-text font-semibold">Domain</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="example.com"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                required
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Domain riêng của bạn (ví dụ: mysite.com). Khi truy cập qua domain này, website sẽ hiển thị với branding của bạn.
                </span>
              </label>
            </div>

            <div>
              <label className="label">
                <span className="label-text font-semibold">Logo URL</span>
              </label>
              <input
                type="url"
                className="input input-bordered w-full"
                placeholder="https://example.com/logo.png"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
              {form.logoUrl && (
                <div className="mt-3">
                  <p className="text-sm text-base-content/70 mb-2">Preview:</p>
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="max-w-48 max-h-48 object-contain rounded border border-base-300 p-2 bg-base-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      if (!parent.querySelector('.error-message')) {
                        const errorMsg = document.createElement('p');
                        errorMsg.className = 'error-message text-error text-sm mt-2';
                        errorMsg.textContent = 'Không thể tải hình ảnh từ URL này';
                        parent.appendChild(errorMsg);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="label">
                <span className="label-text font-semibold">Brand Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Tên thương hiệu của bạn"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">Tên hiển thị cho brand của bạn</span>
              </label>
            </div>

            <div>
              <label className="label cursor-pointer">
                <span className="label-text font-semibold">Active</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
              </label>
              <label className="label">
                <span className="label-text-alt text-base-content/60">Kích hoạt customization này</span>
              </label>
            </div>

            {/* Preview Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-base-content mb-4">Preview</h3>
              <div className="rounded-xl p-6 border-2 border-base-300 bg-base-100">
                <div className="flex items-center gap-4 mb-4">
                  {form.logoUrl && (
                    <img
                      src={form.logoUrl}
                      alt="Brand logo"
                      className="h-12 w-auto object-contain"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-primary">
                      {form.brandName || "Brand Name"}
                    </h4>
                    <p className="text-sm text-base-content/70">{form.domain || "example.com"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button className="btn btn-sm btn-primary">
                    Primary Button
                  </button>
                  <button className="btn btn-sm btn-outline btn-secondary">
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-3">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? <span className="loading loading-spinner" /> : "Lưu"}
              </button>
              {hasCustomization && (
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Xóa
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={loadCustomization}
                disabled={saving}
              >
                Reset
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default PartnerCustomizationPage;
