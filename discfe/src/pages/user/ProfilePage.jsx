import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api, { userPartnerAPI } from "../../lib/api";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { loadProfile: refreshAuthProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    address: "",
  });
  const [isPartner, setIsPartner] = useState(false);
  const [registeringPartner, setRegisteringPartner] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get("/users/me");
      setProfile(data);
      setFormData({
        fullName: data.fullName || "",
        phoneNumber: data.phoneNumber || "",
        dateOfBirth: parseDateForInput(data.dateOfBirth),
        gender: data.gender || "",
        address: data.address || "",
      });
      // Check if user is a partner
      setIsPartner(data.roles && data.roles.includes("PARTNER"));
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert backend date (String 'yyyy-MM-dd' or Array [y,m,d]) to Input value 'yyyy-MM-dd'
  const parseDateForInput = (dateVal) => {
    if (!dateVal) return "";
    if (Array.isArray(dateVal)) {
      // [2000, 1, 31]
      const y = dateVal[0];
      const m = String(dateVal[1]).padStart(2, "0");
      const d = String(dateVal[2]).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return dateVal; // Assume string yyyy-MM-dd
  };

  // Helper to display date
  const displayDate = (dateVal) => {
    if (!dateVal) return "Chưa cập nhật";
    if (Array.isArray(dateVal)) {
      const [y, m, d] = dateVal;
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    return new Date(dateVal).toLocaleDateString("vi-VN");
  };

  const handleRegisterAsPartner = async () => {
    if (!confirm("Bạn có chắc chắn muốn đăng ký làm Partner? Bạn sẽ nhận được referral link và có thể kiếm hoa hồng từ việc giới thiệu khách hàng.")) {
      return;
    }

    setRegisteringPartner(true);
    try {
      const { data } = await userPartnerAPI.registerAsPartner();
      toast.success(`Đăng ký Partner thành công! Mã giới thiệu: ${data.referralCode}`);
      await refreshAuthProfile();
      await loadProfile(); // Reload to update roles
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Đăng ký thất bại!";
      toast.error(errorMessage);
    } finally {
      setRegisteringPartner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put("/users/me", {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        address: formData.address || null,
      });
      toast.success("Cập nhật thành công!");
      setEditing(false);
      loadProfile();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Cập nhật thất bại!";
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Hồ Sơ Cá Nhân</h2>
        <p className="text-sm text-base-content/60">Quản lý thông tin tài khoản của bạn</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-start mb-4">
                <h3 className="card-title">Thông tin chung</h3>
                {!editing && (
                  <button className="btn btn-ghost btn-sm text-primary" onClick={() => setEditing(true)}>
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {!editing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-20">
                        <span className="text-3xl">{profile?.fullName?.[0]?.toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{profile?.fullName}</h3>
                      <p className="text-base-content/70">{profile?.email}</p>
                      <div className="mt-2">
                        <span className={`badge ${profile?.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'} badge-sm`}>
                          {profile?.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-base-content/50">Số điện thoại</label>
                      <p className="font-medium">{profile?.phoneNumber || "—"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-base-content/50">Ngày sinh</label>
                      <p className="font-medium">{displayDate(profile?.dateOfBirth)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-base-content/50">Giới tính</label>
                      <p className="font-medium">{profile?.gender || "—"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold uppercase text-base-content/50">Địa chỉ</label>
                      <p className="font-medium">{profile?.address || "—"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="form-control">
                      <span className="label-text">Họ tên <span className="text-error">*</span></span>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </label>

                    <label className="form-control">
                      <span className="label-text">Số điện thoại</span>
                      <input
                        type="tel"
                        className="input input-bordered"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                    </label>

                    <label className="form-control">
                      <span className="label-text">Ngày sinh</span>
                      <input
                        type="date"
                        className="input input-bordered"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    </label>

                    <label className="form-control">
                      <span className="label-text">Giới tính</span>
                      <select
                        className="select select-bordered"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="">Chưa cập nhật</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </label>

                    <label className="form-control">
                      <span className="label-text">Địa chỉ</span>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setEditing(false)}
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Subscription & Partner */}
        <div className="space-y-6">

          {/* Subscription Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-base">Gói thành viên</h3>
              <div className="py-2">
                {profile?.activeSubscription ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary text-lg">{profile.activeSubscription.planName}</span>
                      <span className="badge badge-primary badge-outline">{profile.activeSubscription.status}</span>
                    </div>
                    {profile.activeSubscription.expiresAt && (
                      <p className="text-sm text-base-content/70">
                        Hết hạn: {new Date(profile.activeSubscription.expiresAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-base-content/60 mb-3">Bạn chưa đăng ký gói nào</p>
                    <a href="/pricing" className="btn btn-sm btn-outline btn-primary">Xem bảng giá</a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Partner Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-base">Partner Program</h3>
              <div className="py-2 space-y-4">
                {isPartner ? (
                  <div className="space-y-3">
                    <div className="alert alert-success bg-success/10 text-success-content border-success/20 py-2">
                      <span className="text-sm font-medium">Bạn đã là Partner</span>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-base-content/50">Mã giới thiệu</label>
                      <div className="flex items-center gap-2 bg-base-200 p-2 rounded mt-1">
                        <code className="font-mono flex-1">{profile?.referralCode}</code>
                        <button className="btn btn-xs btn-ghost" onClick={() => navigator.clipboard.writeText(profile?.referralCode)}>
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-base-content/50">Người giới thiệu</label>
                      <p className="font-mono text-sm">{profile?.referredByCode || "—"}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-base-content/70 mb-4">
                      Đăng ký làm Partner để nhận hoa hồng từ việc giới thiệu khách hàng.
                    </p>
                    <button
                      className="btn btn-success btn-sm w-full text-white"
                      onClick={handleRegisterAsPartner}
                      disabled={registeringPartner}
                    >
                      {registeringPartner ? <span className="loading loading-spinner loading-xs"></span> : "Đăng ký ngay"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-base mb-4">Đổi mật khẩu</h3>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
};


const ChangePasswordForm = () => {
  const [data, setData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }
    if (data.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      setData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      // Optionally logout the user or let them stay logged in
    } catch (err) {
      const msg = err.response?.data?.message || "Đổi mật khẩu thất bại";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChange} className="space-y-4 max-w-md">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Mật khẩu hiện tại</span>
        </label>
        <input
          type="password"
          className="input input-bordered"
          required
          value={data.oldPassword}
          onChange={(e) => setData({ ...data, oldPassword: e.target.value })}
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Mật khẩu mới</span>
        </label>
        <input
          type="password"
          className="input input-bordered"
          required
          minLength={6}
          value={data.newPassword}
          onChange={(e) => setData({ ...data, newPassword: e.target.value })}
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Xác nhận mật khẩu mới</span>
        </label>
        <input
          type="password"
          className="input input-bordered"
          required
          minLength={6}
          value={data.confirmPassword}
          onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
        />
      </div>
      <div className="mt-4">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-xs"></span> : "Lưu mật khẩu mới"}
        </button>
      </div>
    </form>
  );
};

export default ProfilePage;
