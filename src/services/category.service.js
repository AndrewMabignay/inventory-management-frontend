import api from './api.js';

export async function listCategories(params = {}) {
    const response = await api.get('/categories', { params });
    return response.data;
}
