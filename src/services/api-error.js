import axios from 'axios';

const DEFAULT_ERROR_MESSAGE = 'An unexpected API error occurred.';

export class ApiError extends Error {
    constructor(message, { status = null, code = null, data = null, cause } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.data = data;

        if (cause !== undefined) {
            this.cause = cause;
        }
    }
}

function getResponseMessage(data) {
    if (typeof data === 'string' && data.trim()) {
        return data;
    }

    if (data && typeof data.error === 'string' && data.error.trim()) {
        return data.error;
    }

    if (data && typeof data.message === 'string' && data.message.trim()) {
        return data.message;
    }

    return null;
}

export function normalizeApiError(error) {
    if (!axios.isAxiosError(error)) {
        return new ApiError(
            error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
            { cause: error },
        );
    }

    if (error.response) {
        const { data, status } = error.response;
        return new ApiError(
            getResponseMessage(data) || `API request failed with status ${status}.`,
            {
                status,
                code: error.code ?? null,
                data,
            },
        );
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return new ApiError('The API request timed out.', {
            code: error.code,
        });
    }

    if (error.request) {
        return new ApiError(
            'Unable to reach the API. Check your connection and API URL.',
            {
                code: error.code ?? null,
            },
        );
    }

    return new ApiError(error.message || DEFAULT_ERROR_MESSAGE, {
        code: error.code ?? null,
    });
}
