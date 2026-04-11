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
};

// Views API
export const viewsApi = {
    getAll: (createdBy?: string) => api.get('/views', { params: { created_by: createdBy } }),
    create: (data: any) => api.post('/views', data),
    update: (id: number, data: any) => api.put(`/views/${id}`, data),
    delete: (id: number) => api.delete(`/views/${id}`),
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
};

export default api;
