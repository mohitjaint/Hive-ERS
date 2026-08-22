const BASE = import.meta.env.VITE_BACKEND_URL || window.location.origin;
const API = `${BASE}/api/v1`;

async function request(method, path, body, isFormData = false) {
  const opts = {
    method,
    credentials: 'include',
  };
  if (body) {
    if (isFormData) {
      opts.body = body;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

// ── Members ──────────────────────────────────────────────────────────────────
export const membersApi = {
  me: () => request('GET', '/members/me'),
  getAll: () => request('GET', '/members'),
  getById: (id) => request('GET', `/members/${id}`),
  create: (body) => request('POST', '/members', body),
  toggleActive: (id) => request('PATCH', `/members/${id}/toggle-active`),
  changeRole: (id, role) => request('PATCH', `/members/${id}/role`, { role }),
  delete: (id) => request('DELETE', `/members/${id}`),
};

// ── Inventory ─────────────────────────────────────────────────────────────────
export const inventoryApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/inventory${q ? `?${q}` : ''}`);
  },
  getById: (id) => request('GET', `/inventory/${id}`),
  create: (formData) => request('POST', '/inventory', formData, true),
  update: (id, formData) => request('PATCH', `/inventory/${id}`, formData, true),
  delete: (id) => request('DELETE', `/inventory/${id}`),
  setPolicy: (id, body) => request('PATCH', `/inventory/${id}/policy`, body),
};

// ── Storage ───────────────────────────────────────────────────────────────────
export const storageApi = {
  getAll: () => request('GET', '/storage'),
  getById: (id) => request('GET', `/storage/${id}`),
  create: (body) => request('POST', '/storage', body),
  update: (id, body) => request('PATCH', `/storage/${id}`, body),
  delete: (id) => request('DELETE', `/storage/${id}`),
};

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactionsApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/transactions${q ? `?${q}` : ''}`);
  },
  getMy: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/transactions/my${q ? `?${q}` : ''}`);
  },
  getById: (id) => request('GET', `/transactions/${id}`),
  request: (body) => request('POST', '/transactions/request', body),
  approve: (id) => request('PATCH', `/transactions/${id}/approve`),
  reject: (id) => request('PATCH', `/transactions/${id}/reject`),
  return: (id, body) => request('PATCH', `/transactions/${id}/return`, body),
  markOverdue: () => request('POST', '/transactions/mark-overdue'),
};
