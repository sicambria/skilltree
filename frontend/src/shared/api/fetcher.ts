const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/backend';

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, response.statusText, errorData, `API Error: ${response.status} ${response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  return handleResponse<T>(response);
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data: unknown) => apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: unknown) => apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data: unknown) => apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };