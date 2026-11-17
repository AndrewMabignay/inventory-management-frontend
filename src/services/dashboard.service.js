import api from './api.js';

const PREVIEW_LIMIT = 5;

export async function getDashboardOverview() {
    const [
        summaryResponse,
        stockLevelsResponse,
        lowStockResponse,
        transactionsResponse,
        topProductsResponse,
        inventoryValueResponse,
    ] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/stock-levels', {
            params: { page: 1, limit: PREVIEW_LIMIT },
        }),
        api.get('/dashboard/low-stock', {
            params: { page: 1, limit: PREVIEW_LIMIT },
        }),
        api.get('/dashboard/recent-transactions', {
            params: { limit: PREVIEW_LIMIT },
        }),
        api.get('/dashboard/top-products', {
            params: { limit: PREVIEW_LIMIT },
        }),
        api.get('/dashboard/inventory-value'),
    ]);

    return {
        summary: summaryResponse.data.summary,
        stockLevels: stockLevelsResponse.data.products,
        lowStockProducts: lowStockResponse.data.products,
        recentTransactions: transactionsResponse.data.transactions,
        topProducts: topProductsResponse.data.products,
        rankingMetric: topProductsResponse.data.rankingMetric,
        inventoryValue: inventoryValueResponse.data.inventoryValue,
    };
}
