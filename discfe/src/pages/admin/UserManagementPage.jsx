import { useEffect, useState } from "react";
import { adminUserAPI, csvExportAPI, adminPartnerAPI, adminPartnerPdfPackageAPI, adminSubscriptionPlanAPI } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext";
import PartnerDetailView from "../../features/admin/partners/components/PartnerDetailView";

// Hàm dịch status sang tiếng Việt

import toast from "react-hot-toast";

const translateStatus = (status) => {
  const statusMap = {
    ACTIVE: "Hoạt động",
    SUSPENDED: "Đã tạm ngưng",
    PENDING_VERIFICATION: "Đang chờ xác minh",
  };
  return statusMap[status] || status;
};

// Hàm dịch role sang tiếng Việt
const translateRole = (role) => {
  const roleMap = {
    USER: "Người dùng",
    PARTNER: "Đối tác",
    ADMIN: "Quản trị viên",
    SUPER_ADMIN: "Quản trị viên cấp cao",
    CONTENT_ADMIN: "Quản trị nội dung",
    FINANCE_ADMIN: "Quản trị tài chính",
    SUPPORT_ADMIN: "Quản trị hỗ trợ",
  };
  return roleMap[role] || role;
};

const DISPLAY_ROLE_OPTIONS = [
  { id: "USER", label: translateRole("USER"), badgeClass: "badge-ghost" },
  { id: "PARTNER", label: translateRole("PARTNER"), badgeClass: "badge-info text-white" },
  { id: "ADMIN", label: translateRole("ADMIN"), badgeClass: "badge-error text-white" },
  { id: "SUPER_ADMIN", label: translateRole("SUPER_ADMIN"), badgeClass: "badge-warning" },
];

// Quốc Trí: backend chỉ lưu 1 role chính, nên checkbox ở đây phải quy về role ưu tiên cao nhất.
const ASSIGNABLE_ROLE_OPTIONS = DISPLAY_ROLE_OPTIONS;

const ALLOWED_ROLE_IDS = ASSIGNABLE_ROLE_OPTIONS.map((r) => r.id);

const ROLE_META = DISPLAY_ROLE_OPTIONS.reduce((acc, role) => {
  acc[role.id] = role;
  return acc;
}, {});

const normalizeRoleValue = (role) => (typeof role === "string" ? role.trim().toUpperCase() : null);

const getUserRoles = (user) => {
  const roles = new Set();
  if (Array.isArray(user?.roles)) {
    user.roles
      .map(normalizeRoleValue)
      .filter(Boolean)
      .forEach((r) => roles.add(r));
  }
  const primaryRole = normalizeRoleValue(user?.role);
  if (primaryRole) roles.add(primaryRole);
  if (roles.has("PARTNER")) {
    roles.add("USER");
  }
  return Array.from(roles);
};

const getRequestedRoles = (roles) => {
  const requested = new Set(
    (roles || [])
      .map(normalizeRoleValue)
      .filter((role) => ALLOWED_ROLE_IDS.includes(role))
  );

  if (requested.has("SUPER_ADMIN")) {
    return ["SUPER_ADMIN"];
  }

  if (requested.has("ADMIN")) {
    return ["ADMIN"];
  }

  if (requested.has("PARTNER")) {
    return ["PARTNER"];
  }

  return ["USER"];
};

const normalizeAdminUser = (user, overrides = {}) => {
  if (!user) return null;

  return {
    ...user,
    ...overrides,
    userId: user.userId ?? user.id,
    role: normalizeRoleValue(user.role) ?? null,
    roles: overrides.roles ?? getUserRoles(user),
    phoneNumber: user.phoneNumber ?? user.phone ?? "",
    pdfExportCredits: user.pdfExportCredits ?? user.credits ?? 0,
    totalReferrals: user.totalReferrals ?? user.referredCount ?? 0,
    createdAt: user.createdAt ?? user.joinedAt ?? null,
    joinedAt: user.joinedAt ?? user.createdAt ?? null,
    partnerProfile: overrides.partnerProfile ?? false,
  };
};

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]); // User plans
  const [partnerPlans, setPartnerPlans] = useState([]); // Partner plans
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    avatarUrl: "",
    roles: [],
    status: "ACTIVE",
  });
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    avatarUrl: "",
    pdfExportCredits: 0,
  });

  const [showPartnerEditModal, setShowPartnerEditModal] = useState(false);
  const [partnerEditForm, setPartnerEditForm] = useState({
    fullName: "",
    phoneNumber: "",
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    active: true,
    planCode: "",
    pdfExportCredits: 0,
  });

  // Reset Password State
  const [resetPasswordModal, setResetPasswordModal] = useState({ show: false, userId: null });
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: "" });

  // Partner specific state
  const [stats, setStats] = useState(null);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterRole) params.role = filterRole;
      if (userSearch) params.keyword = userSearch;

      const { data } = await adminUserAPI.getAll(params);
      setUsers((data || []).map((item) => normalizeAdminUser(item)));
    } catch (err) {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadPlans();
  }, [filterStatus, filterRole]); // Keep existing dep

  const loadPlans = async () => {
    try {
      // Load user plans
      const { data } = await adminSubscriptionPlanAPI.getAll();
      setPlans(data || []);

      // Load partner plans separately
      const partnerData = await adminSubscriptionPlanAPI.getAll({ planType: 'PARTNER_PLAN' });
      setPartnerPlans(partnerData.data || []);
    } catch (err) {
      console.error("Error loading plans:", err);
    }
  };

  useEffect(() => {
    if (message) {
      toast.success(message);
      setMessage(null);
    }
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [message, error]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const loadPartnerStats = async (partnerId) => {
    setLoadingStats(true);
    try {
      const { data } = await adminPartnerAPI.getStats(partnerId);
      setStats(data);
    } catch (err) {
      console.error("Error loading partner stats:", err);
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadQuotaInfo = async (partnerId) => {
    setLoadingQuota(true);
    try {
      const { data } = await adminPartnerPdfPackageAPI.getByPartner(partnerId);
      setQuotaInfo(data);
      loadExportHistory(partnerId);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Error loading quota info:", err);
      }
      setQuotaInfo(null);
      setExportHistory([]);
    } finally {
      setLoadingQuota(false);
    }
  };

  const loadExportHistory = async (partnerId) => {
    try {
      const { data } = await adminPartnerAPI.getPaidExportHistory(partnerId, { page: 0, size: 50 });
      setExportHistory(data);
    } catch (err) {
      console.error("Error loading export history:", err);
    }
  };

  const handleViewDetail = async (user) => {
    try {
      const normalizedUser = normalizeAdminUser(user);
      const { data } = await adminUserAPI.getById(normalizedUser.userId);
      setSelectedUser(normalizeAdminUser(data));
      setActiveTab("info");
      setStats(null);
      setQuotaInfo(null);
      setExportHistory([]);

      setMessage(null);
      setError(null);
    } catch (err) {
      setError("Không thể tải chi tiết người dùng");
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    if (!confirm(`Bạn chắc chắn muốn đổi trạng thái?`)) return;
    setSaving(true);
    try {
      await adminUserAPI.updateStatus(userId, newStatus);
      toast.success("Cập nhật trạng thái thành công");
      await loadUsers();
      if ((selectedUser?.userId || selectedUser?.id) === userId) {
        const { data } = await adminUserAPI.getById(userId);
        setSelectedUser(normalizeAdminUser(data));
      }
    } catch (err) {
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Bạn chắc chắn muốn xoá người dùng này?")) return;
    try {
      await adminUserAPI.delete(userId);
      toast.success("Xoá người dùng thành công");
      await loadUsers();
      if ((selectedUser?.userId || selectedUser?.id) === userId) {
        setSelectedUser(null);
      }
    } catch (err) {
      let msg = err.response?.data?.message || err.message || "Xoá người dùng thất bại";
      if (msg.includes("Cannot delete") || msg.includes("ConstraintViolation")) {
        msg = "Không thể xóa người dùng đã có dữ liệu (đơn hàng, bài test...). Vui lòng vô hiệu hóa tài khoản thay vì xóa.";
      }
      toast.error(msg);
    }
  };

  const handleExport = async () => {
    try {
      const params = { page: 0, size: 10000 };
      const response = await csvExportAPI.exportUsers(params);

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError("Không thể export CSV");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await adminUserAPI.create({
        email: createForm.email,
        password: createForm.password,
        fullName: createForm.fullName,
        phoneNumber: createForm.phoneNumber || null,
        avatarUrl: createForm.avatarUrl || null,
        roles: createForm.roles.length > 0 ? getRequestedRoles(createForm.roles) : null,
        status: createForm.status || null,
      });
      toast.success("Tạo người dùng thành công");
      setShowCreateModal(false);
      setCreateForm({
        email: "",
        password: "",
        fullName: "",
        phoneNumber: "",
        avatarUrl: "",
        roles: [],
        status: "ACTIVE",
      });
      await loadUsers();
      await handleViewDetail(normalizeAdminUser(data));
    } catch (err) {
      toast.error(err.response?.data?.message || "Tạo người dùng thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = (role) => {
    setCreateForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [role]
    }));
  };

  const handleOpenEdit = () => {
    if (selectedUser) {
      setEditForm({
        fullName: selectedUser.fullName || "",
        email: selectedUser.email || "",
        phoneNumber: selectedUser.phoneNumber || "",
        avatarUrl: selectedUser.avatarUrl || "",
        status: selectedUser.status || "ACTIVE",
        planCode: selectedUser?.activeSubscription?.planCode || (selectedUser?.activeSubscription?.planName === "Free" ? "FREE" : "") || "",
        pdfExportCredits: selectedUser.pdfExportCredits || 0,
      });
      setShowEditModal(true);
    }
  };

  const handleOpenPartnerEdit = (partnerData) => {
    setPartnerEditForm({
      fullName: partnerData.fullName || "",
      phoneNumber: partnerData.phoneNumber || "",
      companyName: partnerData.companyName || "",
      contactEmail: partnerData.contactEmail || "",
      contactPhone: partnerData.contactPhone || "",
      active: partnerData.active ?? true,
      planCode: partnerData.activeSubscription?.planCode || "",
      pdfExportCredits: partnerData.pdfExportCredits || 0,
    });
    setShowPartnerEditModal(true);
  };

  const handleUpdatePartner = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Update partner info via AdminPartnerAPI
      const { data } = await adminPartnerAPI.update(selectedUser.id, {
        fullName: partnerEditForm.fullName,
        phoneNumber: partnerEditForm.phoneNumber,
        companyName: partnerEditForm.companyName,
        contactEmail: partnerEditForm.contactEmail,
        contactPhone: partnerEditForm.contactPhone,
        active: partnerEditForm.active,
      });

      // Update plan and credits via AdminUserAPI if changed
      const currentPlanCode = selectedUser.activeSubscription?.planCode || "";
      const planChanged = partnerEditForm.planCode !== currentPlanCode;
      const creditsChanged = partnerEditForm.pdfExportCredits !== selectedUser.pdfExportCredits;

      if (planChanged || creditsChanged) {
        const userUpdatePayload = {
          fullName: partnerEditForm.fullName,
        };

        if (planChanged) {
          userUpdatePayload.planCode = partnerEditForm.planCode || undefined;
        }

        if (creditsChanged) {
          userUpdatePayload.pdfExportCredits = partnerEditForm.pdfExportCredits;
        }

        await adminUserAPI.update(selectedUser.userId, userUpdatePayload);
      }

      toast.success("Cập nhật thông tin partner thành công");
      setShowPartnerEditModal(false);
      await loadUsers();

      // Reload selected user/partner data
      const { data: userData } = await adminPartnerAPI.getById(selectedUser.id);
      setSelectedUser(normalizeAdminUser(userData));

    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật partner thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // For partners, selectedUser.id is the partner ID, not user ID
      // We need to use selectedUser.userId for partners
      const userId = selectedUser.userId || selectedUser.id;
      const { data } = await adminUserAPI.update(userId, editForm);
      toast.success("Cập nhật người dùng thành công");
      setShowEditModal(false);
      await loadUsers();
      await handleViewDetail(normalizeAdminUser(data));
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật người dùng thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRoles = async (newRoles) => {
    if (!confirm(`Bạn chắc chắn muốn cập nhật roles?`)) return;
    setSaving(true);
    try {
      const safeRoles = getRequestedRoles(newRoles);
      const userId = selectedUser.userId || selectedUser.id;
      const { data } = await adminUserAPI.updateRoles(userId, { roles: safeRoles });
      toast.success("Cập nhật roles thành công");
      await loadUsers();
      await handleViewDetail(normalizeAdminUser(data));
    } catch (err) {
      toast.error("Cập nhật roles thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToPartner = async (userId) => {
    if (!confirm("Bạn chắc chắn muốn chuyển user này thành partner?")) return;
    setSaving(true);
    try {
      await adminPartnerAPI.convertUserToPartner(userId);
      toast.success("Chuyển đổi thành partner thành công!");
      await loadUsers();
      const { data } = await adminUserAPI.getById(userId);
      setSelectedUser(normalizeAdminUser(data));
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể chuyển đổi thành partner");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePartnerRole = async () => {
    if (!confirm("Bạn chắc chắn muốn xóa quyền partner này? Hành động này không thể hoàn tác.")) return;
    setSaving(true);
    try {
      const userId = selectedUser.userId || selectedUser.id;
      await adminUserAPI.updateRoles(userId, { roles: ["USER"] });
      toast.success("Xóa quyền partner thành công!");
      await loadUsers();

      // Reload detail as regular user using the correct userId
      const { data } = await adminUserAPI.getById(userId);
      setSelectedUser(normalizeAdminUser(data));
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa partner");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuota = async (quotaData) => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await adminPartnerPdfPackageAPI.createOrUpdate(selectedUser.id, quotaData);
      toast.success("Cập nhật quota thành công!");
      await loadQuotaInfo(selectedUser.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể cập nhật quota");
    } finally {
      setSaving(false);
    }
  };

  const handleResetQuota = async () => {
    if (!quotaInfo || !confirm("Bạn chắc chắn muốn reset quota về 0?")) return;
    setSaving(true);
    try {
      await adminPartnerPdfPackageAPI.resetUsage(quotaInfo.id);
      toast.success("Reset quota thành công!");
      await loadQuotaInfo(selectedUser.id);
    } catch (err) {
      toast.error("Không thể reset quota");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPasswordModal.userId) return;
    setSaving(true);
    try {
      await adminUserAPI.resetPassword(resetPasswordModal.userId, resetPasswordForm.newPassword);
      toast.success("Đặt lại mật khẩu thành công");
      setResetPasswordModal({ show: false, userId: null });
      setResetPasswordForm({ newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (!selectedUser) return;

    if (tabId === 'stats' && !stats) {
      loadPartnerStats(selectedUser.id);
    }
    if (tabId === 'quota' && !quotaInfo) {
      loadQuotaInfo(selectedUser.id);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Header Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Quản lý người dùng</h2>
          <p className="text-sm text-base-content/80">Quản lý tài khoản, trạng thái và quyền người dùng</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-outline border-base-300 btn-sm gap-2 rounded-xl text-base-content/70 hover:bg-base-100 hover:text-primary"
            onClick={handleExport}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            className="btn btn-primary btn-sm gap-2 rounded-xl text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            onClick={() => setShowCreateModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm mới
          </button>
        </div>
      </header>

      {/* Notifications */}

      {/* Notifications replaced by toast */}


      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-base-100 p-3 rounded-2xl border border-base-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/80">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            className="input input-sm pl-9 input-bordered w-full rounded-xl focus:outline-none focus:border-primary/50"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="select select-bordered select-sm rounded-xl focus:outline-none focus:border-primary/50"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="SUSPENDED">Đã tạm ngưng</option>
            <option value="PENDING_VERIFICATION">Đang chờ xác minh</option>
          </select>

          <select
            className="select select-bordered select-sm rounded-xl focus:outline-none focus:border-primary/50"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Tất cả roles</option>
            <option value="USER">Người dùng</option>
            <option value="PARTNER">Đối tác</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 min-h-0 flex gap-6">
        {/* User List - Table View */}
        <section className={`bg-base-100 rounded-[2rem] border border-base-200 shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${selectedUser ? 'w-3/5' : 'w-full'}`}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto scrollbar-thin">
              <table className="table table-pin-rows">
                <thead className="text-xs bg-base-200 uppercase tracking-wider text-base-content/70 font-bold">
                  <tr>
                    <th className="font-bold">User Info</th>
                    {!selectedUser && <th className="font-bold">Role</th>}
                    <th className="font-bold">Credit</th>
                    <th className="font-bold">Số người giới thiệu đc</th>
                    <th className="font-bold">Bản trả phí còn lại</th>
                    <th className="font-bold">Ngày tham gia</th>
                    <th className="font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => handleViewDetail(user)}
                      className={`group cursor-pointer hover:bg-base-50 transition-colors ${(selectedUser?.userId || selectedUser?.id) === user.userId ? 'bg-primary/5' : ''}`}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${(selectedUser?.userId || selectedUser?.id) === user.userId ? 'bg-primary' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                              }`}>
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} />
                              ) : (
                                <span>{(user?.fullName || user?.email || "?")[0].toUpperCase()}</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-sm text-base-content">{user.fullName || "—"}</div>
                            <div className="text-xs text-base-content/70 font-normal">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      {!selectedUser && (
                        <td>
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {getUserRoles(user).map(role => {
                              const meta = ROLE_META[role] || { badgeClass: "badge-ghost", label: translateRole(role) };
                              const badgeClass = meta.badgeClass || "badge-ghost";
                              const label = meta.label || role;
                              return (
                                <span key={role} className={`badge badge-xs ${badgeClass} font-medium py-2`}>
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      )}
                      <td className="font-medium text-sm text-base-content/80">
                        {user.pdfExportCredits ?? 0}
                      </td>
                      <td className="text-sm text-base-content/80">
                        {user.totalReferrals ?? 0}
                      </td>
                      <td className="text-sm text-base-content/80">
                        {user.paidExportsLeft ?? 0}
                      </td>
                      <td className="text-sm text-base-content/70">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="text-right">
                        <button className="btn btn-ghost btn-xs btn-square text-base-content/80 hover:text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-base-content/80">
                  <p>Không tìm thấy người dùng nào</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Detail Panel */}
        {selectedUser && (
          selectedUser.partnerProfile ? (
            <div className="w-2/5 h-full">
              <PartnerDetailView
                partner={selectedUser}
                onClose={() => setSelectedUser(null)}
                stats={stats}
                loadingStats={loadingStats}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onUpdateStatus={handleUpdateStatus}
                onRemoveRole={handleRemovePartnerRole}
                saving={saving}
                quotaInfo={quotaInfo}
                loadingQuota={loadingQuota}
                onSaveQuota={handleSaveQuota}
                onResetQuota={handleResetQuota}
                exportHistory={exportHistory}
                onEdit={() => handleOpenPartnerEdit(selectedUser)}
                onResetPassword={() => setResetPasswordModal({ show: true, userId: selectedUser.userId || selectedUser.id })}
                canEditQuota={currentUser?.roles?.includes("SUPER_ADMIN") || currentUser?.roles?.includes("FINANCE_ADMIN")}
              />
            </div>
          ) : (
            <section className="w-2/5 bg-base-100/90 backdrop-blur-xl rounded-[2.5rem] p-6 border border-base-200 shadow-xl flex flex-col h-full animate-fade-in-right relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <button className="btn btn-sm btn-circle btn-ghost text-base-content/80 hover:bg-base-200" onClick={() => setSelectedUser(null)}>✕</button>
              </div>

              <div className="flex flex-col items-center text-center mt-4">
                <div className="avatar mb-4">
                  <div className="w-24 h-24 rounded-3xl ring ring-primary/20 ring-offset-2 shadow-2xl">
                    <img src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${selectedUser.fullName}&background=random`} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-base-content">{selectedUser.fullName}</h3>
                <p className="text-sm text-base-content/70 font-medium">{selectedUser.email}</p>

                <div className="flex gap-2 mt-4">
                  <button className="btn btn-sm bg-primary/10 text-primary border-none hover:bg-primary hover:text-white rounded-xl transition-all" onClick={handleOpenEdit}>
                    Edit Profile
                  </button>
                  <button
                    className="btn btn-sm bg-warning/10 text-warning border-none hover:bg-warning hover:text-white rounded-xl transition-all"
                    onClick={() => setResetPasswordModal({ show: true, userId: selectedUser.userId || selectedUser.id })}
                  >
                    Reset Pass
                  </button>
                  <button className="btn btn-sm btn-square btn-outline border-base-200 text-base-content/80 hover:border-error hover:text-error hover:bg-error/5 rounded-xl transition-all" onClick={() => handleDelete(selectedUser.userId || selectedUser.id)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              <div className="mt-8 overflow-y-auto flex-1 pr-2 space-y-6 custom-scrollbar">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-blue-50 text-center">
                    <div className="text-xs text-blue-600/70 font-bold uppercase">Tests</div>
                    <div className="text-xl font-bold text-blue-700">{selectedUser.totalTests || 0}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50 text-center">
                    <div className="text-xs text-purple-600/70 font-bold uppercase">Subs</div>
                    <div className="text-xl font-bold text-purple-700">{selectedUser.activeSubscriptions || 0}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 text-center">
                    <div className="text-xs text-emerald-600/70 font-bold uppercase">Refs</div>
                    <div className="text-xl font-bold text-emerald-700">{selectedUser?.totalReferrals || 0}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-orange-50 text-center">
                    <div className="text-xs text-orange-600/70 font-bold uppercase">PDF Credits</div>
                    <div className="text-xl font-bold text-orange-700">{selectedUser?.pdfExportCredits || 0}</div>
                  </div>
                </div>

                {/* Status Control */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-base-content/80 uppercase tracking-wider">Account Status</label>
                  <select
                    className="select select-bordered select-sm w-full rounded-xl bg-base-100 focus:outline-none focus:border-primary"
                    value={selectedUser.status}
                    onChange={(e) => handleUpdateStatus(selectedUser.userId || selectedUser.id, e.target.value)}
                    disabled={saving}
                  >
                    <option value="ACTIVE">✅ Active</option>
                    <option value="SUSPENDED">⛔ Suspended</option>
                    <option value="PENDING_VERIFICATION">⏳ Pending Verification</option>
                  </select>
                </div>

                {/* Generic Info */}
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-base-100">
                    <span className="text-base-content/70">Phone</span>
                    <span className="font-medium text-base-content">{selectedUser.phoneNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-base-100">
                    <span className="text-base-content/70">Joined Date</span>
                    <span className="font-medium text-base-content">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN') : "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-base-100">
                    <span className="text-base-content/70">ID</span>
                    <span className="font-mono text-xs text-base-content/70 bg-base-100 px-2 py-1 rounded">{selectedUser.id}</span>
                  </div>
                </div>

                {/* Roles */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-base-content/80 uppercase tracking-wider">System Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {ASSIGNABLE_ROLE_OPTIONS.map(({ id, label }) => {
                      const currentRoles = getUserRoles(selectedUser);
                      const checked = currentRoles.includes(id);
                      return (
                        <label key={id} className={`cursor-pointer border rounded-xl px-3 py-2 flex items-center gap-2 transition-all duration-200 ${checked
                        ? 'bg-primary/5 border-primary text-primary'
                        : 'bg-transparent border-base-200 hover:bg-base-50'
                        }`}>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs checkbox-primary rounded-sm"
                          checked={checked}
                          onChange={(e) => {
                            if (id === 'PARTNER' && !currentRoles.includes('PARTNER')) {
                              handleConvertToPartner(selectedUser.userId || selectedUser.id);
                              return;
                            }
                            const newRoles = e.target.checked
                              ? [id]
                              : currentRoles.filter(r => r !== id);
                            handleUpdateRoles(newRoles);
                          }}
                          disabled={saving}
                        />
                        <span className="text-xs font-medium">{label}</span>
                      </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Upgrade Action for non-partners */}
              {!getUserRoles(selectedUser).includes('PARTNER') && (
                <div className="mt-4 pt-4 border-t border-base-200">
                  <button
                    className="btn btn-primary btn-sm w-full gap-2 rounded-xl"
                    onClick={() => handleConvertToPartner(selectedUser.userId || selectedUser.id)}
                    disabled={saving}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Nâng cấp lên Partner
                  </button>
                </div>
              )}
            </section>
          )
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          className="modal modal-open backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setCreateForm({
                email: "",
                password: "",
                fullName: "",
                phoneNumber: "",
                avatarUrl: "",
                roles: [],
                status: "ACTIVE",
              });
              setError(null);
            }
          }}
        >
          <div className="modal-box max-w-2xl bg-base-100 shadow-2xl p-8 rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-1">Thêm thành viên mới</h3>
            <p className="text-sm text-base-content/60 mb-6">Tạo tài khoản và phân quyền truy cập hệ thống</p>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium mb-1">Email <span className="text-error">*</span></span>
                  <input
                    type="email"
                    className="input input-bordered rounded-xl"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">Mật khẩu <span className="text-error">*</span></span>
                  <input
                    type="password"
                    className="input input-bordered rounded-xl"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <span className="label-text-alt mt-1 text-base-content/50">Tối thiểu 8 ký tự</span>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium mb-1">Họ và tên <span className="text-error">*</span></span>
                  <input
                    type="text"
                    className="input input-bordered rounded-xl"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    required
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">Số điện thoại</span>
                  <input
                    type="tel"
                    className="input input-bordered rounded-xl"
                    value={createForm.phoneNumber}
                    onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                  />
                </label>
              </div>

              <label className="form-control">
                <span className="label-text font-medium mb-1">Avatar URL</span>
                <input
                  type="url"
                  className="input input-bordered rounded-xl"
                  value={createForm.avatarUrl}
                  onChange={(e) => setCreateForm({ ...createForm, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </label>

              <div className="modal-action mt-8">
                <button
                  type="button"
                  className="btn btn-ghost rounded-xl"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      email: "",
                      password: "",
                      fullName: "",
                      phoneNumber: "",
                      avatarUrl: "",
                      roles: [],
                      status: "ACTIVE",
                    });
                    setError(null);
                  }}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-xl px-6"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo người dùng"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div
          className="modal modal-open backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setError(null);
            }
          }}
        >
          <div className="modal-box max-w-2xl bg-base-100 shadow-2xl p-8 rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-base-content mb-6">Sửa thông tin người dùng</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium mb-1">Họ và tên <span className="text-error">*</span></span>
                  <input
                    type="text"
                    className="input input-bordered rounded-xl"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    required
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">Email <span className="text-error">*</span></span>
                  <input
                    type="email"
                    className="input input-bordered rounded-xl"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium mb-1">Số điện thoại</span>
                  <input
                    type="tel"
                    className="input input-bordered rounded-xl"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">Avatar URL</span>
                  <input
                    type="url"
                    className="input input-bordered rounded-xl"
                    value={editForm.avatarUrl}
                    onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium mb-1">Gói dịch vụ</span>
                  <select
                    className="select select-bordered rounded-xl"
                    value={editForm.planCode || ""}
                    onChange={(e) => setEditForm({ ...editForm, planCode: e.target.value })}
                  >
                    <option value="">-- Giữ nguyên gói hiện tại --</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.code}>
                        {plan.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.price)})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(currentUser?.roles?.includes("SUPER_ADMIN") || currentUser?.roles?.includes("FINANCE_ADMIN")) && (
                  <label className="form-control">
                    <span className="label-text font-medium mb-1">PDF Credits</span>
                    <input
                      type="number"
                      className="input input-bordered rounded-xl"
                      value={editForm.pdfExportCredits}
                      onChange={(e) => setEditForm({ ...editForm, pdfExportCredits: parseInt(e.target.value) || 0 })}
                    />
                  </label>
                )}
              </div>

              <div className="modal-action mt-8">
                <button
                  type="button"
                  className="btn btn-ghost rounded-xl"
                  onClick={() => {
                    setShowEditModal(false);
                    setError(null);
                  }}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-xl px-6"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner" />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Partner Modal */}
      {showPartnerEditModal && (
        <div
          className="modal modal-open backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPartnerEditModal(false);
              setError(null);
            }
          }}
        >
          <div className="modal-box bg-base-100 shadow-2xl p-8 rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-base-content mb-6">Sửa thông tin Partner</h3>

            <form onSubmit={handleUpdatePartner} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium mb-1">Họ và tên <span className="text-error">*</span></span>
                  <input
                    type="text"
                    className="input input-bordered rounded-xl"
                    value={partnerEditForm.fullName}
                    onChange={(e) => setPartnerEditForm({ ...partnerEditForm, fullName: e.target.value })}
                    required
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">Số điện thoại</span>
                  <input
                    type="tel"
                    className="input input-bordered rounded-xl"
                    value={partnerEditForm.phoneNumber}
                    onChange={(e) => setPartnerEditForm({ ...partnerEditForm, phoneNumber: e.target.value })}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium mb-1">Tên công ty</span>
                  <input
                    type="text"
                    className="input input-bordered rounded-xl"
                    value={partnerEditForm.companyName}
                    onChange={(e) => setPartnerEditForm({ ...partnerEditForm, companyName: e.target.value })}
                    placeholder="Công ty TNHH..."
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">Trạng thái</span>
                  <label className="label cursor-pointer justify-start gap-4 border border-base-200 rounded-xl px-4 py-3">
                    <span className="label-text font-medium">{partnerEditForm.active ? "Đang hoạt động" : "Tạm ngưng"}</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={partnerEditForm.active}
                      onChange={(e) => setPartnerEditForm({ ...partnerEditForm, active: e.target.checked })}
                    />
                  </label>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium mb-1">Email liên hệ</span>
                  <input
                    type="email"
                    className="input input-bordered rounded-xl"
                    value={partnerEditForm.contactEmail}
                    onChange={(e) => setPartnerEditForm({ ...partnerEditForm, contactEmail: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">SĐT liên hệ</span>
                  <input
                    type="tel"
                    className="input input-bordered rounded-xl"
                    value={partnerEditForm.contactPhone}
                    onChange={(e) => setPartnerEditForm({ ...partnerEditForm, contactPhone: e.target.value })}
                    placeholder="0912..."
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className="label-text font-medium mb-1">Gói dịch vụ</span>
                  <select
                    className="select select-bordered rounded-xl"
                    value={partnerEditForm.planCode}
                    onChange={(e) => setPartnerEditForm({ ...partnerEditForm, planCode: e.target.value })}
                  >
                    <option value="">-- Chọn gói --</option>
                    {partnerPlans.filter(p => p.active).map(plan => (
                      <option key={plan.id} value={plan.code}>
                        {plan.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: plan.currency }).format(plan.price)})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-control">
                  <span className="label-text font-medium mb-1">PDF Export Credits</span>
                  <input
                    type="number"
                    className="input input-bordered rounded-xl"
                    value={partnerEditForm.pdfExportCredits}
                    onChange={(e) => setPartnerEditForm({ ...partnerEditForm, pdfExportCredits: parseInt(e.target.value) || 0 })}
                    min="0"
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="modal-action mt-8">
                <button
                  type="button"
                  className="btn btn-ghost rounded-xl"
                  onClick={() => {
                    setShowPartnerEditModal(false);
                    setError(null);
                  }}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-xl px-6"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner" />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPasswordModal.show && (
        <div
          className="modal modal-open backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setResetPasswordModal({ show: false, userId: null });
              setResetPasswordForm({ newPassword: "" });
            }
          }}
        >
          <div className="modal-box max-w-sm bg-base-100 shadow-2xl p-6 rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Đặt lại mật khẩu</h3>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Mật khẩu mới</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered rounded-xl"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({ newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost rounded-xl"
                  onClick={() => {
                    setResetPasswordModal({ show: false, userId: null });
                    setResetPasswordForm({ newPassword: "" });
                  }}
                  disabled={saving}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-xl"
                  disabled={saving}
                >
                  {saving ? <span className="loading loading-spinner loading-xs"></span> : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
