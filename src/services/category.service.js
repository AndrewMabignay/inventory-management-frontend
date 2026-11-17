import api from './api.js';

export async function listCategories(params = {}) {
    const response = await api.get('/categories', { params });
    return response.data;
}

export async function getCategoryById(id) {
    const response = await api.get(`/categories/${encodeURIComponent(id)}`);
    return response.data.category;
}

export async function createCategory(category) {
    const response = await api.post('/categories', category);
    return response.data.category;
}

export async function updateCategory(id, category) {
    const response = await api.put(
        `/categories/${encodeURIComponent(id)}`,
        category,
    );
    return response.data.category;
}

export async function deleteCategory(id) {
    await api.delete(`/categories/${encodeURIComponent(id)}`);
}
