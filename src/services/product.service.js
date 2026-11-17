import api from './api.js';

export async function listProducts(params = {}) {
    const response = await api.get('/products', { params });
    return response.data;
}

export async function getProductById(id) {
    const response = await api.get(`/products/${encodeURIComponent(id)}`);
    return response.data.product;
}

export async function createProduct(product) {
    const response = await api.post('/products', product);
    return response.data.product;
}

export async function updateProduct(id, product) {
    const response = await api.put(
        `/products/${encodeURIComponent(id)}`,
        product,
    );
    return response.data.product;
}

export async function updateProductStatus(id, isActive) {
    const response = await api.patch(
        `/products/${encodeURIComponent(id)}/status`,
        { isActive },
    );
    return response.data.product;
}
