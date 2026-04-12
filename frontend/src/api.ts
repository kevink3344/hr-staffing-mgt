import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        'x-user-email': localStorage.getItem('userEmail') || 'demo@staffing.com',
    },
});

// Staff Records API
export const staffApi = {
    getAll: (search?: string) => api.get('/staff', { params: { search } }),
    getById: (id: number) => api.get(`/staff/${id}`),
    create: (data: any) => api.post('/staff', data),
    update: (id: number, data: any) => api.put(`/staff/${id}`, data),
    delete: (id: number) => api.delete(`/staff/${id}`),
};

// History API
export const historyApi = {
    getByRecordId: (recordId: number) => api.get(`/history/${recordId}`),
    getActivityFeed: (limit = 50, offset = 0) => api.get('/history', { params: { limit, offset } }),
};

// Views API
export const viewsApi = {
    getAll: (createdBy?: string) => api.get('/views', { params: { created_by: createdBy } }),
    create: (data: any) => api.post('/views', data),
    update: (id: number, data: any) => api.put(`/views/${id}`, data),
    delete: (id: number) => api.delete(`/views/${id}`),
    toggle: (id: number) => api.patch(`/views/${id}/toggle`),
};

// Import API
export const importApi = {
    uploadExcel: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/import/excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    fixDates: () => api.post('/import/fix-dates'),
    exportExcel: () => api.get('/import/export', { responseType: 'blob' }),
};

// Staff API (additional)
export const staffDeleteApi = {
    deleteAll: () => api.delete('/staff/all'),
};

// Filters API
export const filtersApi = {
    getAll: (createdBy?: string) => api.get('/filters', { params: { created_by: createdBy } }),
    create: (column_name: string, column_value: string[], filter_type: string = 'equals', row_color: string = '', highlight_type: string = 'row') =>
        api.post('/filters', { column_name, column_value, filter_type, row_color, highlight_type }),
    update: (id: number, data: { column_name: string; column_value: string[]; filter_type: string; row_color: string; highlight_type: string }) =>
        api.put(`/filters/${id}`, data),
    delete: (id: number) => api.delete(`/filters/${id}`),
    toggle: (id: number) => api.patch(`/filters/${id}/toggle`),
};

// Pins API
export const pinsApi = {
    getAll: (pinnedBy?: string) => api.get('/pins', { params: { pinned_by: pinnedBy } }),
    pin: (recordId: number) => api.post(`/pins/${recordId}`),
    unpin: (recordId: number) => api.delete(`/pins/${recordId}`),
};

// Comments API
export const commentsApi = {
    getByRecordId: (recordId: number) => api.get(`/comments/${recordId}`),
    create: (recordId: number, message: string) => api.post(`/comments/${recordId}`, { message }),
    delete: (id: number) => api.delete(`/comments/${id}`),
};

export default api;
