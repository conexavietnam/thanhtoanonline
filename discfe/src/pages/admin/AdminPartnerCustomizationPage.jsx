import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminPartnerCustomizationAPI } from "../../lib/api.js";
import { adminUserAPI, adminPartnerAPI } from "../../lib/api.js";

const AdminPartnerCustomizationPage = () => {
  const [customizations, setCustomizations] = useState([]);
  const [partners, setPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
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
  const [searchDomain, setSearchDomain] = useState("");

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError(null);
  }, [error]);

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (selectedPartnerId) {
      loadCustomization(selectedPartnerId);
    } else {
      resetForm();
    }
  }, [selectedPartnerId]);

  const loadPartners = async () => {
    try {
      const { data } = await adminPartnerAPI.getAll();
      setPartners(data);
    } catch (err) {
      setError("Không thể tải danh sách partners");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomization = async (partnerId) => {
    try {
      const { data } = await adminPartnerCustomizationAPI.getByPartner(partnerId);
      setForm({
        domain: data.domain || "",
        logoUrl: data.logoUrl || "",
        brandName: data.brandName || "",
        active: data.active !== undefined ? data.active : true,
      });
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        resetForm();
      } else {
        setError("Không thể tải customization");
      }
    }
  };

  const searchByDomain = async () => {
    if (!searchDomain.trim()) return;
    setLoading(true);
    try {
      const { data } = await adminPartnerCustomizationAPI.getByDomain(searchDomain.trim());
      const partner = partners.find((p) => p.id === data.partnerId);
      if (partner) {
        setSelectedPartnerId(data.partnerId);
        setForm({
          domain: data.domain || "",
          logoUrl: data.logoUrl || "",
          brandName: data.brandName || "",
          active: data.active !== undefined ? data.active : true,
        });
      }
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Không tìm thấy customization cho domain này");
      } else {
        setError("Lỗi khi tìm kiếm");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      domain: "",
      logoUrl: "",
      brandName: "",
      active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      setError("Vui lòng chọn partner");
      return;
    }
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await adminPartnerCustomizationAPI.update(selectedPartnerId, form);
      setMessage("Cập nhật customization thành công");
      await loadCustomization(selectedPartnerId);
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPartnerId) return;
    if (!confirm("Bạn chắc chắn muốn xóa customization này?")) return;
    setSaving(true);
    try {
      await adminPartnerCustomizationAPI.delete(selectedPartnerId);
      setMessage("Xóa customization thành công");
      resetForm();
      setSelectedPartnerId("");
    } catch (err) {
      setError("Xóa thất bại");
    } finally {
      setSaving(false);
    }
  };

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-base-content">Quản lý Partner Customization</h2>
        <p className="text-sm text-base-content/60">Thiết lập domain, logo và tên thương hiệu cho đối tác. Màu sắc được quản lý trong Settings.</p>
      </header>

      {message && (
        <div className="alert alert-success">
          <span>{message}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Partner Selection */}
        <section className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text font-semibold">Chọn Partner</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Chọn partner --</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.fullName} ({partner.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text font-semibold">Tìm theo Domain</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1"
                placeholder="example.com"
                value={searchDomain}
                onChange={(e) => setSearchDomain(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchByDomain()}
              />
              <button className="btn btn-primary" onClick={searchByDomain} disabled={loading}>
                Tìm
              </button>
            </div>
          </div>

          {selectedPartner && (
            <div className="rounded-xl border border-base-200 bg-base-100 p-4">
              <h3 className="font-semibold text-base-content mb-2">Thông tin Partner</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-base-content/70">Tên:</span> {selectedPartner.fullName}</p>
                <p><span className="text-base-content/70">Email:</span> {selectedPartner.email}</p>
                <p><span className="text-base-content/70">ID:</span> <code className="text-xs">{selectedPartner.id}</code></p>
              </div>
            </div>
          )}
        </section>

        {/* Customization Form */}
        <section className="rounded-2xl border border-base-200 bg-base-100 p-6">
          {selectedPartnerId ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold text-base-content mb-4">Thông tin Customization</h3>

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
                  <div className="mt-2">
                    <img src={form.logoUrl} alt="Logo preview" className="max-w-32 max-h-32 object-contain rounded" onError={(e) => e.target.style.display = 'none'} />
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
                  placeholder="Tên thương hiệu"
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                />
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
              </div>

              <div className="pt-4 border-t flex gap-3">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? <span className="loading loading-spinner" /> : "Lưu"}
                </button>
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Xóa
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setSelectedPartnerId("");
                    resetForm();
                  }}
                >
                  Đóng
                </button>
              </div>
            </form>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center text-base-content/50">
              <p>Chọn một partner để quản lý customization</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminPartnerCustomizationPage;
