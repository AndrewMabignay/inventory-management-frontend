import api from './api.js';

export async function listSuppliers(params = {}) {
    const response = await api.get('/suppliers', { params });
    return response.data;
}
