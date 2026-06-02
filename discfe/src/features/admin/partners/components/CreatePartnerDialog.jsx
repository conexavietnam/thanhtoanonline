import React, { useState } from 'react';

const CreatePartnerDialog = ({
    isOpen,
    onClose,
    onSubmit, // (data) => Promise
    onConvert, // (userId) => Promise
    users, // List of users that can be converted
    saving
}) => {
    const [activeTab, setActiveTab] = useState('new');
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
        phoneNumber: "",
    });
    const [filterUser, setFilterUser] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(filterUser.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(filterUser.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-50">
                    <h3 className="text-lg font-bold">Thêm Partner</h3>
                    <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">✕</button>
                </div>

                <div className="p-4 bg-base-100">
                    <div className="tabs tabs-boxed mb-4 grid grid-cols-2">
                        <button
                            className={`tab ${activeTab === 'new' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('new')}
                        >
                            Tạo mới
                        </button>
                        <button
                            className={`tab ${activeTab === 'convert' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('convert')}
                        >
                            Từ User có sẵn
                        </button>
                    </div>

                    {activeTab === 'new' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label py-1">
                                    <span className="label-text font-medium">Họ tên *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    placeholder="Tên đầy đủ"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label py-1">
                                    <span className="label-text font-medium">Email *</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered w-full"
                                    placeholder="partner@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label py-1">
                                        <span className="label-text font-medium">Mật khẩu *</span>
                                    </label>
                                    <input
                                        type="password"
                                        className="input input-bordered w-full"
                                        placeholder="Min 8 ký tự"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div>
                                    <label className="label py-1">
                                        <span className="label-text font-medium">Số điện thoại</span>
                                    </label>
                                    <input
                                        type="tel"
                                        className="input input-bordered w-full"
                                        placeholder="0912..."
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={saving}
                                >
                                    {saving ? <span className="loading loading-spinner" /> : "Tạo tài khoản"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={onClose}
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Tìm user..."
                                className="input input-bordered w-full"
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                            />

                            <div className="max-h-[300px] overflow-y-auto border border-base-200 rounded-lg">
                                {filteredUsers.length === 0 ? (
                                    <div className="p-4 text-center text-base-content/60">
                                        Không tìm thấy user nào chưa là partner
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-base-200">
                                        {filteredUsers.map(user => (
                                            <li key={user.id} className="p-3 flex items-center justify-between hover:bg-base-50">
                                                <div>
                                                    <p className="font-medium text-sm">{user.fullName}</p>
                                                    <p className="text-xs text-base-content/60">{user.email}</p>
                                                </div>
                                                <button
                                                    className="btn btn-xs btn-primary"
                                                    onClick={() => onConvert(user.id)}
                                                    disabled={saving}
                                                >
                                                    Chọn
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <p className="text-xs text-base-content/50 text-center">
                                Chỉ hiển thị người dùng chưa có quyền Partner
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreatePartnerDialog;
