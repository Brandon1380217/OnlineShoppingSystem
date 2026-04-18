const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function uploadFile(endpoint, file, fieldName = 'image') {
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append(fieldName, file);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers, body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export const api = {
  auth: {
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    updateProfile: (body) => request('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  },
  products: {
    list: (params) => request(`/products?${new URLSearchParams(params)}`),
    get: (slug) => request(`/products/${slug}`),
    categories: () => request('/products/categories'),
    brands: () => request('/products/brands'),
  },
  cart: {
    get: () => request('/cart'),
    add: (body) => request('/cart/add', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, quantity) => request(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    remove: (id) => request(`/cart/${id}`, { method: 'DELETE' }),
    clear: () => request('/cart', { method: 'DELETE' }),
  },
  orders: {
    list: (params) => request(`/orders?${new URLSearchParams(params)}`),
    get: (id) => request(`/orders/${id}`),
    checkout: (body) => request('/orders/checkout', { method: 'POST', body: JSON.stringify(body) }),
    cancel: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
    confirmReceived: (id) => request(`/orders/${id}/confirm-received`, { method: 'POST' }),
    returnOrder: (id, body) => request(`/orders/${id}/return`, { method: 'POST', body: JSON.stringify(body) }),
  },
  notifications: {
    list: (params) => request(`/notifications?${new URLSearchParams(params)}`),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
  },
  shops: {
    list: () => request('/shops'),
    get: (id, params) => request(`/shops/${id}?${new URLSearchParams(params || {})}`),
    follow: (id) => request(`/shops/${id}/follow`, { method: 'POST' }),
    unfollow: (id) => request(`/shops/${id}/follow`, { method: 'DELETE' }),
    following: () => request('/shops/me/following'),
    reviews: (id) => request(`/shops/${id}/reviews`),
    submitReview: (id, body) => request(`/shops/${id}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  },
  chats: {
    presets: () => request('/chats/presets'),
    list: () => request('/chats'),
    openWithShop: (shopId, body) => request(`/chats/shop/${shopId}`, { method: 'POST', body: JSON.stringify(body || {}) }),
    messages: (id, since) => request(`/chats/${id}/messages${since ? `?since=${since}` : ''}`),
    sendMessage: (id, message) => request(`/chats/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
  },
  business: {
    orders: (params) => request(`/business/orders?${new URLSearchParams(params)}`),
    orderDetail: (id) => request(`/business/orders/${id}`),
    updateOrderStatus: (id, body) => request(`/business/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
    batchStatus: (body) => request('/business/orders/batch-status', { method: 'POST', body: JSON.stringify(body) }),
    invoices: (params) => request(`/business/invoices?${new URLSearchParams(params)}`),
    returns: (params) => request(`/business/returns?${new URLSearchParams(params)}`),
    updateReturnStatus: (id, body) => request(`/business/returns/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
    analyticsOverview: () => request('/business/analytics/overview'),
    analyticsSales: (params) => request(`/business/analytics/sales?${new URLSearchParams(params)}`),
    products: (params) => request(`/business/products?${new URLSearchParams(params)}`),
    createProduct: (body) => request('/business/products', { method: 'POST', body: JSON.stringify(body) }),
    updateProduct: (id, body) => request(`/business/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    removeProduct: (id) => request(`/business/products/${id}`, { method: 'DELETE' }),
    restoreProduct: (id) => request(`/business/products/${id}/restore`, { method: 'POST' }),
    permanentDeleteProduct: (id) => request(`/business/products/${id}/permanent`, { method: 'DELETE' }),
  },
  uploads: {
    image: (file) => uploadFile('/uploads/image', file, 'image'),
  },
  admin: {
    users: (params) => request(`/admin/users?${new URLSearchParams(params)}`),
    getUser: (id) => request(`/admin/users/${id}`),
    updateUser: (id, body) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    createUser: (body) => request('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    stats: () => request('/admin/stats'),
  },
};
