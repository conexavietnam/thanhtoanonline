import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const API_ORIGIN = (() => {
  try {
    const url = new URL(API_BASE_URL, window.location.origin);
    return url.origin;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
})();

export const buildAssetUrl = (path) => {
  if (!path) return path;
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path}`;
};


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios instance riêng cho refresh token request (không có interceptor thêm Authorization header)
const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken = null;
let refreshToken = null;
let refreshHandler = null;
let onTokenExpired = null;

export const setAuthTokens = (newAccessToken, newRefreshToken) => {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
};

export const clearAuthTokens = () => {
  accessToken = null;
  refreshToken = null;
};

export const registerRefreshHandler = (handler) => {
  refreshHandler = handler;
};

export const registerTokenExpiredHandler = (handler) => {
  onTokenExpired = handler;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu là 401 và đã retry rồi, hoặc không có refresh token -> logout
    if (error.response?.status === 401) {
      if (!refreshToken || (originalRequest?._retry && typeof onTokenExpired === "function")) {
        // Token đã hết hạn hoàn toàn, đăng xuất
        clearAuthTokens();
        if (typeof onTokenExpired === "function") {
          onTokenExpired();
        }
        return Promise.reject(error);
      }

      // Thử refresh token
      if (refreshToken && typeof refreshHandler === "function" && !originalRequest?._retry) {
        originalRequest._retry = true;

        try {
          const tokens = await refreshHandler(refreshToken);
          if (tokens?.accessToken) {
            setAuthTokens(tokens.accessToken, tokens.refreshToken ?? refreshToken);
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token cũng hết hạn hoặc lỗi
          clearAuthTokens();
          if (typeof onTokenExpired === "function") {
            onTokenExpired();
          }
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// ==================== ADMIN APIs ====================

// User Management
export const adminUserAPI = {
  getAll: (params) => api.get('/admin/users', { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  updateStatus: (id, statusOrPayload) => api.put(
    `/admin/users/${id}/status`,
    typeof statusOrPayload === "string"
      ? { suspended: statusOrPayload === "SUSPENDED" }
      : statusOrPayload
  ),
  updateRoles: (id, data) => api.put(`/admin/users/${id}/roles`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
  resetPassword: (id, newPassword) => api.put(`/admin/users/${id}/password`, { newPassword }),
};

// Career Management
export const adminCareerAPI = {
  getAll: (params) => api.get('/admin/careers', { params }),
  getById: (id) => api.get(`/admin/careers/${id}`),
  create: (data) => api.post('/admin/careers', data),
  update: (id, data) => api.put(`/admin/careers/${id}`, data),
  delete: (id) => api.delete(`/admin/careers/${id}`),
};

// Insight Management
export const adminInsightAPI = {
  getAll: (params) => api.get('/admin/insights', { params }),
  getById: (id) => api.get(`/admin/insights/${id}`),
  create: (data) => api.post('/admin/insights', data),
  update: (id, data) => api.put(`/admin/insights/${id}`, data),
  delete: (id) => api.delete(`/admin/insights/${id}`),
};

// Development Plan Management
export const adminDevPlanAPI = {
  getAll: (params) => api.get('/admin/development-plans', { params }),
  getById: (id) => api.get(`/admin/development-plans/${id}`),
  create: (data) => api.post('/admin/development-plans', data),
  update: (id, data) => api.put(`/admin/development-plans/${id}`, data),
  delete: (id) => api.delete(`/admin/development-plans/${id}`),
};

// Catalog (categories/questions)
export const adminCatalogAPI = {
  listCategories: (params) => api.get('/admin/catalog/categories', { params }),
  createCategory: (data) => api.post('/admin/catalog/categories', data),
  updateCategory: (id, data) => api.put(`/admin/catalog/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/catalog/categories/${id}`),
  validateWeights: (testCode) => api.get('/admin/catalog/categories/validate', { params: { testCode } }),
};

// Payment Management
export const adminPaymentAPI = {
  getAll: (params) => api.get('/admin/payments', { params }),
  getById: (id) => api.get(`/admin/payments/${id}`),
  updateStatus: (id, status) => api.put(`/admin/payments/${id}/status`, { status }),
};

// Finance Management
export const adminFinanceAPI = {
  getOverview: () => api.get('/admin/finance/overview'),
};

// Referral Management
export const adminReferralAPI = {
  getAll: (params) => api.get('/admin/referrals', { params }),
  getStats: () => api.get('/admin/referrals/stats'),
  getById: (id) => api.get(`/admin/referrals/${id}`),
  updateStatus: (id, status) => api.put(`/admin/referrals/${id}/status`, { status }),
  updateCommission: (id, data) => api.put(`/admin/referrals/${id}/commission`, data),
  markAsPaid: (id) => api.post(`/admin/referrals/${id}/payout`),
};

// Partner Customization (Admin)
export const adminPartnerCustomizationAPI = {
  getByPartner: (partnerId) => api.get(`/admin/partner-customizations/partner/${partnerId}`),
  getByDomain: (domain) => api.get(`/admin/partner-customizations/domain`, { params: { domain } }),
  update: (partnerId, data) => api.put(`/admin/partner-customizations/partner/${partnerId}`, data),
  delete: (partnerId) => api.delete(`/admin/partner-customizations/partner/${partnerId}`),
};

// Partner Customization (Partner)
export const partnerCustomizationAPI = {
  get: () => api.get('/partners/customization'),
  update: (data) => api.put('/partners/customization', data),
  delete: () => api.delete('/partners/customization'),
};

// Commission Rules Management (Admin)
export const adminCommissionRuleAPI = {
  getAll: () => api.get('/admin/commission-rules'),
  getGlobal: () => api.get('/admin/commission-rules/global'),
  getByPartner: (partnerId) => api.get(`/admin/commission-rules/partner/${partnerId}`),
  getById: (id) => api.get(`/admin/commission-rules/${id}`),
  create: (data) => api.post('/admin/commission-rules', data),
  update: (id, data) => api.put(`/admin/commission-rules/${id}`, data),
  delete: (id) => api.delete(`/admin/commission-rules/${id}`),
};

// Partner Management (Admin)
export const adminPartnerAPI = {
  getAll: () => api.get('/admin/partners'),
  getById: (id) => api.get(`/admin/partners/${id}`),
  getByUserId: (userId) => api.get(`/admin/partners/user/${userId}`),
  create: (data) => api.post('/admin/partners', data),
  update: (id, data) => api.put(`/admin/partners/${id}`, data),
  delete: (id) => api.delete(`/admin/partners/${id}`),
  convertUserToPartner: (userId) => api.post(`/admin/partners/convert/${userId}`),
  getStats: (partnerId) => api.get(`/admin/partners/${partnerId}/stats`),
  getExportHistory: (partnerId, params) => api.get(`/admin/partners/${partnerId}/export-history`, { params }),
  getPaidExportHistory: (partnerId, params) => api.get(`/admin/partners/${partnerId}/export-history/paid`, { params }),
};

// Partner Plans Management
export const partnerPlanAPI = {
  getAll: () => api.get('/partners/plans'),
  getGlobal: () => api.get('/partners/plans/global'),
  create: (data) => api.post('/partners/plans', data),
  update: (id, data) => api.put(`/partners/plans/${id}`, data),
  delete: (id) => api.delete(`/partners/plans/${id}`),
};

// Admin Subscription Plans Management
// Admin Subscription Plans Management
export const adminSubscriptionPlanAPI = {
  getAll: (params) => api.get('/admin/plans', { params }),
  getById: (id) => api.get(`/admin/plans/${id}`),
};

// Partner Export
export const partnerExportAPI = {
  exportReferrals: () => api.get('/partners/exports/referrals', { responseType: 'blob' }),
  exportRevenue: (params) => api.get('/partners/exports/revenue', { params, responseType: 'blob' }),
};

export const partnerAffiliateAPI = {
  getSummary: () => api.get('/partner/affiliate/summary'),
  getEarnings: () => api.get('/partner/affiliate/earnings'),
  getReferrals: () => api.get('/partner/affiliate/referrals'),
};

// Partner Quota
export const partnerQuotaAPI = {
  getQuotaInfo: () => api.get('/partners/quota/info'),
  getExportHistory: (params) => api.get('/partners/quota/export-history', { params }),
  getPaidExportHistory: (params) => api.get('/partners/quota/export-history/paid', { params }),
};

// User Partner Registration
export const userPartnerAPI = {
  registerAsPartner: () => api.post('/users/me/register-partner'),
};

// Partner Discount Management
export const partnerDiscountAPI = {
  getAll: () => api.get('/partners/discounts'),
  generate: (data) => api.post('/partners/discounts/generate', data),
  getById: (id) => api.get(`/partners/discounts/${id}`),
};

// Advanced Reports
export const adminReportsAPI = {
  getAdvanced: () => api.get('/admin/reports/advanced'),
};

// Audit Logs
export const adminAuditLogAPI = {
  getAll: (params) => api.get('/admin/audit-logs', { params }),
  getByUser: (userId, params) => api.get(`/admin/audit-logs/user/${userId}`, { params }),
  getByActionType: (actionType, params) => api.get('/admin/audit-logs/action-type', { params: { actionType, ...params } }),
  getByEntityType: (entityType, params) => api.get('/admin/audit-logs/entity-type', { params: { entityType, ...params } }),
  getByDateRange: (startDate, endDate, params) => api.get('/admin/audit-logs/date-range', { params: { startDate, endDate, ...params } }),
  getByUserAndDateRange: (userId, startDate, endDate, params) => api.get(`/admin/audit-logs/user/${userId}/date-range`, { params: { startDate, endDate, ...params } }),
};

// CSV Export
export const csvExportAPI = {
  exportUsers: (params) => api.get('/admin/exports/users', { params, responseType: 'blob' }),
  exportPayments: (params) => api.get('/admin/exports/payments', { params, responseType: 'blob' }),
  exportSubscriptions: (params) => api.get('/admin/exports/subscriptions', { params, responseType: 'blob' }),
  exportReferrals: (params) => api.get('/admin/exports/referrals', { params, responseType: 'blob' }),
  exportAuditLogs: (params) => api.get('/admin/exports/audit-logs', { params, responseType: 'blob' }),
};



// PDF Export
export const pdfExportAPI = {
  checkLimit: (testSessionId) => api.get('/pdf-exports/check', { params: { testSessionId } }),
  recordExport: (data) => api.post('/pdf-exports/record', data),
  recordView: (testSessionId) => api.post('/pdf-exports/record-view', null, { params: { testSessionId } }),
  recordClickPay: (testSessionId) => api.post('/pdf-exports/record-click-pay', null, { params: { testSessionId } }),
  download: (testSessionId) => api.get('/pdf-exports/download', { params: { testSessionId }, responseType: 'blob' }),
  previewConfig: (data) => api.post('/pdf-exports/preview-config', data, { responseType: 'blob' }),
};

// AI Career Recommendations
export const aiCareerAPI = {
  getMyRecommendations: () => api.get('/ai/careers/my-recommendations'),
  getBySession: (sessionId) => api.get(`/ai/careers/session/${sessionId}`),
};

// Disc Test
export const discTestAPI = {
  getQuestions: (mode = "FREE") => api.get('/disc/questions', { params: { mode } }),
  submit: (payload) => api.post('/disc/tests', payload),
  getHistory: () => api.get('/disc/tests/history'),
};

// Learning Recommendations (Courses & Mentors)
export const learningAPI = {
  getCourses: (sessionId) => api.get('/learning/recommendations/courses', { params: { sessionId } }),
  getMentors: (sessionId) => api.get('/learning/recommendations/mentors', { params: { sessionId } }),
};

// Analytics
export const analyticsAPI = {
  getDiscStatistics: () => api.get('/analytics/disc-statistics'),
  getUserBehavior: (startDate, endDate) => api.get('/analytics/user-behavior', { params: { startDate, endDate } }),
  recordBehavior: (data) => api.post('/analytics/record-behavior', null, { params: data }),
};

// Public Settings
export const publicSettingsAPI = {
  getGeneral: () => api.get('/public/settings/general'),
};

// Public Plans
export const publicPlanAPI = {
  getAll: () => api.get('/public/plans'),
  getPartnerPlans: () => api.get('/public/plans/partner'),
};

// Public Consultation
export const publicConsultationAPI = {
  submit: (payload) => api.post('/public/consultations', payload),
};

// Admin Partner PDF Packages
export const adminPartnerPdfPackageAPI = {
  getAll: () => api.get('/admin/partner-pdf-packages'),
  getByPartner: (partnerId) => api.get(`/admin/partner-pdf-packages/partner/${partnerId}`),
  createOrUpdate: (partnerId, data) => api.post(`/admin/partner-pdf-packages/partner/${partnerId}`, data),
  resetUsage: (packageId) => api.put(`/admin/partner-pdf-packages/${packageId}/reset`),
  addUsage: (packageId, paidAmount, freeAmount) => api.put(`/admin/partner-pdf-packages/${packageId}/add-usage`, null, { params: { paidAmount, freeAmount } }),
};

// Admin Partner Customers
export const adminPartnerCustomerAPI = {
  getCustomers: (partnerId) => api.get(`/admin/partners/${partnerId}/customers`),
  getAllCustomers: (partnerId) => api.get(`/admin/partners/${partnerId}/customers/all`),
};

// Upload API
export const uploadAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export { refreshApi };
export default api;
