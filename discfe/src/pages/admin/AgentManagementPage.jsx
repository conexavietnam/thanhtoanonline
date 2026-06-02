import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminAgentAPI, adminUserAPI } from "../../lib/api";

const AgentManagementPage = () => {
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [formData, setFormData] = useState({
    userId: "",
    maxPaidReports: 0,
    notes: "",
  });
  const [editFormData, setEditFormData] = useState({
    maxPaidReports: 0,
    active: true,
    notes: "",
  });

  useEffect(() => {
    loadAgents();
    loadUsers();
  }, []);

  const loadAgents = async () => {
    try {
      const { data } = await adminAgentAPI.getAll();
      setAgents(data);
    } catch (err) {
      console.error("Failed to load agents", err);
      toast.error("Không thể tải danh sách đại lý");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await adminUserAPI.getAll({ page: 0, size: 1000 });
      setUsers(data.content || []);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminAgentAPI.create({
        userId: formData.userId,
        maxPaidReports: parseInt(formData.maxPaidReports) || 0,
        notes: formData.notes,
      });
      toast.success("Tạo đại lý thành công!");
      setShowCreateModal(false);
      setFormData({ userId: "", maxPaidReports: 0, notes: "" });
      loadAgents();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Tạo đại lý thất bại!";
      toast.error(errorMessage);
    }
  };

  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setEditFormData({
      maxPaidReports: agent.maxPaidReports,
      active: agent.active,
      notes: agent.notes || "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await adminAgentAPI.update(selectedAgent.id, editFormData);
      toast.success("Cập nhật đại lý thành công!");
      setShowEditModal(false);
      setSelectedAgent(null);
      loadAgents();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Cập nhật thất bại!";
      toast.error(errorMessage);
    }
  };

  const handleResetQuota = async (agentId, newMax) => {
    if (!confirm(`Xác nhận đặt quota mới cho đại lý này?`)) return;
    
    try {
      await adminAgentAPI.resetQuota(agentId, { maxPaidReports: newMax });
      toast.success("Cập nhật quota thành công!");
      loadAgents();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Cập nhật quota thất bại!";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xác nhận xóa đại lý này?")) return;
    
    try {
      await adminAgentAPI.delete(id);
      toast.success("Xóa đại lý thành công!");
      loadAgents();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Xóa thất bại!";
      toast.error(errorMessage);
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-base-content">Quản lý Đại lý</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Tạo đại lý mới
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Họ tên</th>
                  <th>Quota</th>
                  <th>Đã dùng</th>
                  <th>Còn lại</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-base-content/70">
                      Chưa có đại lý nào
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => (
                    <tr key={agent.id}>
                      <td>{agent.email || "-"}</td>
                      <td>{agent.fullName || "-"}</td>
                      <td>
                        <input
                          type="number"
                          className="input input-sm input-bordered w-24"
                          defaultValue={agent.maxPaidReports}
                          onBlur={(e) => {
                            const newMax = parseInt(e.target.value) || 0;
                            if (newMax !== agent.maxPaidReports) {
                              handleResetQuota(agent.id, newMax);
                            }
                          }}
                        />
                      </td>
                      <td>{agent.usedPaidReports || 0}</td>
                      <td>
                        <span className={`font-semibold ${
                          (agent.remainingPaidReports || 0) === 0 ? 'text-error' : 'text-success'
                        }`}>
                          {agent.remainingPaidReports || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          agent.active ? 'badge-success' : 'badge-error'
                        }`}>
                          {agent.active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleEdit(agent)}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => handleDelete(agent.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Tạo đại lý mới</h3>
            <form onSubmit={handleCreate}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Chọn user</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn user --</option>
                  {users
                    .filter((u) => !agents.some((a) => a.userId === u.id))
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email} - {user.fullName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Quota (số bài được phép xuất)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={formData.maxPaidReports}
                  onChange={(e) => setFormData({ ...formData, maxPaidReports: e.target.value })}
                  min="0"
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Ghi chú</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ userId: "", maxPaidReports: 0, notes: "" });
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAgent && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Sửa đại lý</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Quota (số bài được phép xuất)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={editFormData.maxPaidReports}
                  onChange={(e) => setEditFormData({ ...editFormData, maxPaidReports: parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>
              <div className="form-control mb-4">
                <label className="label cursor-pointer">
                  <span className="label-text">Hoạt động</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={editFormData.active}
                    onChange={(e) => setEditFormData({ ...editFormData, active: e.target.checked })}
                  />
                </label>
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Ghi chú</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAgent(null);
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagementPage;
