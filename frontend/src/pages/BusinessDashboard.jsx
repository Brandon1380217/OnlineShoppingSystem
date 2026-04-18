import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  BarChart3, Package, DollarSign, Users, TrendingUp, ShoppingBag, Clock, AlertTriangle,
  Eye, ChevronDown, RefreshCw, FileText, RotateCcw, Truck, CheckCircle, XCircle, Search, Filter,
  Plus, Trash2, Undo2, MessageSquare, Send, Zap, Archive, Upload, Image as ImageIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
];

const STATUS_COLORS = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#6366f1', packed: '#8b5cf6',
  shipped: '#06b6d4', out_for_delivery: '#14b8a6', delivered: '#22c55e',
  cancelled: '#ef4444', returned: '#f97316', refunded: '#6b7280'
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1'];

export default function BusinessDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user || (user.role !== 'business' && user.role !== 'admin')) {
      navigate('/');
    }
  }, [user]);

  if (!user || (user.role !== 'business' && user.role !== 'admin')) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {user.first_name}. {user.company_name && `(${user.company_name})`}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'orders' && <OrdersTab />}
      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'messages' && <MessagesTab />}
      {activeTab === 'invoices' && <InvoicesTab />}
      {activeTab === 'returns' && <ReturnsTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}

function OverviewTab() {
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState(null);

  useEffect(() => {
    api.business.analyticsOverview().then(setOverview);
    api.business.analyticsSales({ period: '30' }).then(setSales);
  }, []);

  if (!overview) return <LoadingSkeleton />;

  const stats = [
    { label: 'Total Revenue', value: `$${overview.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Total Orders', value: overview.total_orders, icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Customers', value: overview.total_customers, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Avg Order Value', value: `$${overview.avg_order_value.toFixed(2)}`, icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
    { label: 'Pending Orders', value: overview.pending_orders, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Pending Returns', value: overview.pending_returns, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {sales && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Revenue (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sales.sales_by_day}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Revenue by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sales.revenue_by_category} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                  {sales.revenue_by_category.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Orders by Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sales.orders_by_status}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {sales.orders_by_status.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">Top Products</h3>
            <div className="space-y-3">
              {sales.top_products.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{i + 1}</span>
                    <span className="text-sm font-medium truncate max-w-[200px]">{p.product_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${p.total_revenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{p.total_sold} units</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', channel: '', search: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [batchSelected, setBatchSelected] = useState([]);
  const [batchStatus, setBatchStatus] = useState('');

  const loadOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filters.status) params.status = filters.status;
      if (filters.channel) params.channel = filters.channel;
      if (filters.search) params.search = filters.search;
      const data = await api.business.orders(params);
      setOrders(data.orders);
      setPagination(data.pagination);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, [filters]);

  const viewDetail = async (id) => {
    const data = await api.business.orderDetail(id);
    setOrderDetail(data);
    setSelectedOrder(id);
  };

  const updateStatus = async (id, status, tracking) => {
    await api.business.updateOrderStatus(id, { status, tracking_number: tracking });
    await loadOrders(pagination.page);
    if (selectedOrder === id) viewDetail(id);
  };

  const handleBatchUpdate = async () => {
    if (!batchSelected.length || !batchStatus) return;
    await api.business.batchStatus({ order_ids: batchSelected, status: batchStatus, tracking_prefix: 'TRK' });
    setBatchSelected([]);
    setBatchStatus('');
    await loadOrders(pagination.page);
  };

  const toggleBatch = (id) => {
    setBatchSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search orders, customers..."
            value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input-field !pl-9 text-sm !py-2" />
        </div>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="input-field text-sm !py-2 !w-auto">
          <option value="">All Status</option>
          {Object.entries(STATUS_COLORS).map(([k]) => (
            <option key={k} value={k}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
        <select value={filters.channel} onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
          className="input-field text-sm !py-2 !w-auto">
          <option value="">All Channels</option>
          <option value="web">Web</option>
          <option value="sales_team">Sales Team</option>
          <option value="phone">Phone</option>
        </select>
      </div>

      {/* Batch actions */}
      {batchSelected.length > 0 && (
        <div className="bg-brand-50 p-3 rounded-lg flex items-center gap-3">
          <span className="text-sm font-medium text-brand-700">{batchSelected.length} selected</span>
          <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)}
            className="input-field text-sm !py-1.5 !w-auto">
            <option value="">Update to...</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
          <button onClick={handleBatchUpdate} disabled={!batchStatus}
            className="btn-primary text-xs !px-3 !py-1.5">Apply</button>
          <button onClick={() => setBatchSelected([])} className="text-xs text-gray-500 hover:underline">Clear</button>
        </div>
      )}

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left w-8">
                  <input type="checkbox" onChange={(e) => setBatchSelected(e.target.checked ? orders.map(o => o.id) : [])}
                    checked={batchSelected.length === orders.length && orders.length > 0}
                    className="w-4 h-4 text-brand-600 rounded" />
                </th>
                <th className="p-3 text-left font-medium text-gray-500">Order</th>
                <th className="p-3 text-left font-medium text-gray-500">Customer</th>
                <th className="p-3 text-left font-medium text-gray-500">Channel</th>
                <th className="p-3 text-left font-medium text-gray-500">Status</th>
                <th className="p-3 text-left font-medium text-gray-500">Payment</th>
                <th className="p-3 text-right font-medium text-gray-500">Total</th>
                <th className="p-3 text-left font-medium text-gray-500">Date</th>
                <th className="p-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-gray-500">No orders found</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <input type="checkbox" checked={batchSelected.includes(order.id)}
                      onChange={() => toggleBatch(order.id)} className="w-4 h-4 text-brand-600 rounded" />
                  </td>
                  <td className="p-3">
                    <span className="font-mono font-medium text-xs">{order.order_number}</span>
                    <div className="text-xs text-gray-400">{order.items?.length} item(s)</div>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{order.customer_first_name} {order.customer_last_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_email}</p>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">{order.channel}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 text-xs rounded-full font-medium capitalize"
                      style={{ backgroundColor: STATUS_COLORS[order.status] + '20', color: STATUS_COLORS[order.status] }}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs font-medium ${order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'refunded' ? 'text-orange-600' : 'text-yellow-600'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium">${order.total.toFixed(2)}</td>
                  <td className="p-3 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => viewDetail(order.id)} className="p-1.5 hover:bg-gray-100 rounded" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      {!['delivered', 'cancelled', 'refunded'].includes(order.status) && (
                        <select value="" onChange={(e) => { if (e.target.value) updateStatus(order.id, e.target.value); }}
                          className="text-xs border border-gray-200 rounded px-1 py-0.5">
                          <option value="">Update...</option>
                          <option value="confirmed">Confirm</option>
                          <option value="processing">Process</option>
                          <option value="packed">Pack</option>
                          <option value="shipped">Ship</option>
                          <option value="delivered">Deliver</option>
                          <option value="cancelled">Cancel</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => loadOrders(p)}
              className={`w-8 h-8 rounded text-sm ${p === pagination.page ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && orderDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Order {orderDetail.order.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Validation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Valid Address', ok: orderDetail.validation?.has_valid_address },
                { label: 'Payment OK', ok: orderDetail.validation?.has_valid_payment },
                { label: 'Stock Available', ok: orderDetail.validation?.all_items_in_stock },
                { label: 'Products Active', ok: orderDetail.validation?.all_items_active },
              ].map((v, i) => (
                <div key={i} className={`p-2 rounded-lg text-xs font-medium text-center ${v.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {v.ok ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {v.label}
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Customer</h4>
                <p className="text-sm">{orderDetail.order.customer_first_name} {orderDetail.order.customer_last_name}</p>
                <p className="text-sm text-gray-500">{orderDetail.order.customer_email}</p>
                <p className="text-sm text-gray-500">{orderDetail.order.customer_phone}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Shipping</h4>
                <p className="text-sm">{orderDetail.order.shipping_address}</p>
                <p className="text-sm">{orderDetail.order.shipping_city}, {orderDetail.order.shipping_state} {orderDetail.order.shipping_zip}</p>
                <p className="text-sm text-gray-500 capitalize">{orderDetail.order.shipping_method} delivery</p>
                {orderDetail.order.tracking_number && (
                  <p className="text-sm font-mono text-brand-600 mt-1">Tracking: {orderDetail.order.tracking_number}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2">Items</h4>
              <div className="space-y-2">
                {orderDetail.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <img src={item.product_image} alt="" className="w-10 h-10 rounded object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=N/A'; }} />
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} | Stock: {item.current_stock}
                          {item.product_status !== 'active' && <span className="text-red-500 ml-1">({item.product_status})</span>}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">${item.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>${orderDetail.order.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>${orderDetail.order.shipping_cost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${orderDetail.order.tax.toFixed(2)}</span></div>
              {orderDetail.order.discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>-${orderDetail.order.discount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>${orderDetail.order.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const loadProducts = async () => {
    const data = await api.business.products({ limit: 100 });
    setProducts(data.products);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
    api.products.categories().then(setCategories);
    api.products.brands().then(setBrands);
  }, []);

  const handleSave = async (id) => {
    try {
      await api.business.updateProduct(id, editForm);
      await loadProducts();
      setEditing(null);
      setEditForm({});
    } catch (err) { alert(err.message); }
  };

  const handleRemove = async (id, name) => {
    if (!confirm(`Remove "${name}" from your listings? The product will be moved to Archived and can be restored later.`)) return;
    try {
      await api.business.removeProduct(id);
      await loadProducts();
    } catch (err) { alert(err.message); }
  };

  const handleRestore = async (id, name) => {
    if (!confirm(`Restore "${name}" back to active listings?`)) return;
    try {
      await api.business.restoreProduct(id);
      await loadProducts();
    } catch (err) { alert(err.message); }
  };

  const handlePermanentDelete = async (id, name) => {
    if (!confirm(`Permanently DELETE "${name}"? This cannot be undone. If the product has order history, it will be kept for records.`)) return;
    try {
      const r = await api.business.permanentDeleteProduct(id);
      await loadProducts();
      if (r.message) alert(r.message);
    } catch (err) { alert(err.message); }
  };

  if (loading) return <LoadingSkeleton />;

  const activeProducts = products.filter(p => p.status !== 'archived');
  const archivedProducts = products.filter(p => p.status === 'archived');
  const shown = showArchived ? archivedProducts : activeProducts;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setShowArchived(false)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!showArchived ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Active ({activeProducts.length})
          </button>
          <button onClick={() => setShowArchived(true)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${showArchived ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Archive className="w-3.5 h-3.5" /> Archived ({archivedProducts.length})
          </button>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm !px-4 !py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left font-medium text-gray-500">Product</th>
                <th className="p-3 text-left font-medium text-gray-500">Category</th>
                <th className="p-3 text-right font-medium text-gray-500">Price</th>
                <th className="p-3 text-right font-medium text-gray-500">Stock</th>
                <th className="p-3 text-center font-medium text-gray-500">Deal</th>
                <th className="p-3 text-left font-medium text-gray-500">Status</th>
                <th className="p-3 text-left font-medium text-gray-500 min-w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">
                  {showArchived ? 'No archived products.' : 'No active products. Click "Add Product" to get started.'}
                </td></tr>
              ) : shown.map(p => (
                <tr key={p.id} className={`border-b hover:bg-gray-50 ${p.status === 'archived' ? 'opacity-70 bg-red-50/20' : ''}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {editing === p.id ? (
                        <div className="flex flex-col gap-1.5">
                          <img src={editForm.image_url ?? p.image_url} alt="" className="w-14 h-14 rounded object-cover border border-gray-200"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=N/A'; }} />
                          <ProductImageUploader
                            value={editForm.image_url ?? p.image_url ?? ''}
                            onChange={(url) => setEditForm({ ...editForm, image_url: url })}
                            compact
                          />
                        </div>
                      ) : (
                        <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=N/A'; }} />
                      )}
                      <div>
                        {editing === p.id ? (
                          <input type="text" value={editForm.name ?? p.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="input-field text-sm !py-1 !w-56" placeholder="Product name" />
                        ) : (
                          <p className="font-medium truncate max-w-[240px]">{p.name}</p>
                        )}
                        <p className="text-xs text-gray-400">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-500">{p.category_name || '-'}</td>
                  <td className="p-3 text-right">
                    {editing === p.id ? (
                      <input type="number" value={editForm.price ?? p.price} step="0.01"
                        onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                        className="input-field text-sm !py-1 !w-24" />
                    ) : (
                      <span className="font-medium">${p.price.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {editing === p.id ? (
                      <input type="number" value={editForm.stock_quantity ?? p.stock_quantity}
                        onChange={(e) => setEditForm({ ...editForm, stock_quantity: parseInt(e.target.value) })}
                        className="input-field text-sm !py-1 !w-20" />
                    ) : (
                      <span className={p.stock_quantity < 30 ? 'text-red-600 font-medium' : ''}>{p.stock_quantity}</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {editing === p.id ? (
                      <input type="number" value={editForm.deal_discount ?? p.deal_discount}
                        onChange={(e) => setEditForm({ ...editForm, deal_discount: parseFloat(e.target.value), is_deal: parseFloat(e.target.value) > 0 ? 1 : 0 })}
                        className="input-field text-sm !py-1 !w-16" placeholder="%" />
                    ) : p.is_deal ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">-{p.deal_discount}%</span>
                    ) : '-'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'archived' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {editing === p.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleSave(p.id)} className="text-green-600 text-xs font-medium hover:underline">Save</button>
                        <button onClick={() => { setEditing(null); setEditForm({}); }} className="text-gray-500 text-xs hover:underline">Cancel</button>
                      </div>
                    ) : p.status === 'archived' ? (
                      <div className="flex gap-3">
                        <button onClick={() => handleRestore(p.id, p.name)}
                          className="text-emerald-600 text-xs font-medium hover:underline flex items-center gap-1">
                          <Undo2 className="w-3 h-3" /> Restore
                        </button>
                        <button onClick={() => handlePermanentDelete(p.id, p.name)}
                          className="text-red-600 text-xs font-medium hover:underline flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button onClick={() => { setEditing(p.id); setEditForm({}); }}
                          className="text-brand-600 text-xs font-medium hover:underline">Edit</button>
                        <button onClick={() => handleRemove(p.id, p.name)}
                          className="text-orange-600 text-xs font-medium hover:underline flex items-center gap-1">
                          <Archive className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddProductModal categories={categories} brands={brands}
          onClose={() => setShowAddModal(false)}
          onCreated={async () => { setShowAddModal(false); await loadProducts(); }} />
      )}
    </div>
  );
}

function AddProductModal({ categories, brands, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', description: '', price: '', compare_at_price: '',
    stock_quantity: 0, category_id: '', brand_id: '', image_url: '',
    is_deal: 0, deal_discount: 0
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { alert('Name and price are required'); return; }
    setSaving(true);
    try {
      await api.business.createProduct({
        name: form.name.trim(),
        description: form.description || null,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        brand_id: form.brand_id ? parseInt(form.brand_id) : null,
        image_url: form.image_url || null,
        is_deal: form.is_deal ? 1 : 0,
        deal_discount: parseFloat(form.deal_discount) || 0
      });
      await onCreated();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Add New Product</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input type="text" value={form.name} required
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-field" placeholder="e.g. Wireless Bluetooth Speaker" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <ProductImageUploader
              value={form.image_url}
              onChange={(url) => setForm(f => ({ ...f, image_url: url }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
            <input type="number" step="0.01" min="0" required value={form.price}
              onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
              className="input-field" placeholder="29.99" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compare-at Price</label>
            <input type="number" step="0.01" min="0" value={form.compare_at_price}
              onChange={(e) => setForm(f => ({ ...f, compare_at_price: e.target.value }))}
              className="input-field" placeholder="39.99" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input type="number" min="0" value={form.stock_quantity}
              onChange={(e) => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
              className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))} className="input-field">
              <option value="">-- select --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <select value={form.brand_id} onChange={(e) => setForm(f => ({ ...f, brand_id: e.target.value }))} className="input-field">
              <option value="">-- select --</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Discount (%)</label>
            <input type="number" step="1" min="0" max="90" value={form.deal_discount}
              onChange={(e) => setForm(f => ({ ...f, deal_discount: e.target.value, is_deal: parseFloat(e.target.value) > 0 ? 1 : 0 }))}
              className="input-field" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} rows={3}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-field" placeholder="Short product description..." />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

function MessagesTab() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [presets, setPresets] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const [data, p] = await Promise.all([api.chats.list(), api.chats.presets().catch(() => ({ presets: [] }))]);
      setConversations(data.conversations);
      setPresets(p.presets || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, 10000);
    return () => clearInterval(t);
  }, [loadConversations]);

  const openConversation = async (conv) => {
    setSelected(conv);
    try {
      const data = await api.chats.messages(conv.id);
      setMessages(data.messages);
      await loadConversations();
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!selected) return;
    const t = setInterval(async () => {
      try {
        const data = await api.chats.messages(selected.id);
        setMessages(data.messages);
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(t);
  }, [selected]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    scrollToBottom(false);
  }, [selected?.id, scrollToBottom]);

  const send = async (text) => {
    const body = (text ?? input).trim();
    if (!body || !selected || sending) return;
    setSending(true);
    try {
      const msg = await api.chats.sendMessage(selected.id, body);
      setMessages(prev => [...prev, msg]);
      setInput('');
      scrollToBottom(true);
      await loadConversations();
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="card overflow-hidden">
      <div className="grid md:grid-cols-[280px,1fr] h-[calc(100vh-220px)] min-h-[520px] max-h-[760px]">
        <aside className="border-r border-gray-100 overflow-y-auto bg-gray-50 min-h-0">
          <div className="px-4 py-3 border-b bg-white">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Customer Conversations
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{conversations.length} total</p>
          </div>
          {conversations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12 px-4">No customer messages yet.</p>
          ) : conversations.map(c => (
            <button key={c.id} onClick={() => openConversation(c)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-white transition-colors ${selected?.id === c.id ? 'bg-white border-l-4 border-l-brand-500' : ''}`}>
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-semibold text-sm truncate">{c.other_first_name} {c.other_last_name}</p>
                {c.unread_count > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">{c.unread_count}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{c.last_message || 'No messages yet'}</p>
              {c.last_message_at && (
                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(c.last_message_at).toLocaleString()}</p>
              )}
            </button>
          ))}
        </aside>

        <section className="flex flex-col min-h-0 overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p className="text-sm">Select a conversation to start replying</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{selected.other_first_name} {selected.other_last_name}</p>
                  <p className="text-xs text-gray-500">Customer</p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-gray-50 scroll-smooth">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">No messages yet.</p>
                ) : messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_role === 'business' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                      m.sender_role === 'business' ? 'bg-brand-600 text-white rounded-br-md' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      <p className={`text-[10px] mt-1 ${m.sender_role === 'business' ? 'text-brand-100' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {presets.length > 0 && (
                <div className="border-t border-gray-100 bg-white px-3 py-2">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Zap className="w-3 h-3 text-brand-600" />
                    <p className="text-xs font-semibold text-gray-600">Quick replies</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.slice(0, 4).map((q, i) => (
                      <button key={i} onClick={() => send(q)}
                        className="text-xs px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-full border border-brand-100">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); send(); }}
                className="border-t border-gray-200 bg-white p-3 flex items-center gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a reply..." disabled={sending}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                <button type="submit" disabled={!input.trim() || sending}
                  className="shrink-0 p-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white rounded-full transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function InvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    api.business.invoices(params).then(data => { setInvoices(data.invoices); setLoading(false); });
  }, [statusFilter]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Invoices</h3>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field text-sm !py-2 !w-auto">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-3 text-left font-medium text-gray-500">Invoice #</th>
              <th className="p-3 text-left font-medium text-gray-500">Order</th>
              <th className="p-3 text-left font-medium text-gray-500">Customer</th>
              <th className="p-3 text-right font-medium text-gray-500">Amount</th>
              <th className="p-3 text-left font-medium text-gray-500">Status</th>
              <th className="p-3 text-left font-medium text-gray-500">Due Date</th>
              <th className="p-3 text-left font-medium text-gray-500">Paid</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-xs font-medium">{inv.invoice_number}</td>
                <td className="p-3 font-mono text-xs">{inv.order_number}</td>
                <td className="p-3">{inv.customer_first_name} {inv.customer_last_name}</td>
                <td className="p-3 text-right font-medium">${inv.amount.toFixed(2)}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                    inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{inv.status}</span>
                </td>
                <td className="p-3 text-xs text-gray-500">{inv.due_date}</td>
                <td className="p-3 text-xs text-gray-500">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReturnsTab() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReturns = async () => {
    setLoading(true);
    const data = await api.business.returns({});
    setReturns(data.returns);
    setLoading(false);
  };

  useEffect(() => { loadReturns(); }, []);

  const updateReturnStatus = async (id, status) => {
    await api.business.updateReturnStatus(id, { status });
    await loadReturns();
  };

  if (loading) return <LoadingSkeleton />;

  const RETURN_STATUS_COLORS = {
    requested: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    received: 'bg-purple-100 text-purple-800',
    inspected: 'bg-indigo-100 text-indigo-800',
    refunded: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <h3 className="font-semibold mb-4">Returns Management</h3>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-3 text-left font-medium text-gray-500">Return #</th>
              <th className="p-3 text-left font-medium text-gray-500">Order</th>
              <th className="p-3 text-left font-medium text-gray-500">Customer</th>
              <th className="p-3 text-left font-medium text-gray-500">Reason</th>
              <th className="p-3 text-right font-medium text-gray-500">Refund</th>
              <th className="p-3 text-left font-medium text-gray-500">Status</th>
              <th className="p-3 text-left font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {returns.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No returns</td></tr>
            ) : returns.map(ret => (
              <tr key={ret.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono text-xs font-medium">{ret.return_number}</td>
                <td className="p-3 font-mono text-xs">{ret.order_number}</td>
                <td className="p-3">{ret.customer_first_name} {ret.customer_last_name}</td>
                <td className="p-3 text-gray-500 max-w-[200px] truncate">{ret.reason}</td>
                <td className="p-3 text-right font-medium">${ret.refund_amount?.toFixed(2) || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${RETURN_STATUS_COLORS[ret.status] || ''}`}>
                    {ret.status}
                  </span>
                </td>
                <td className="p-3">
                  {!['refunded', 'rejected'].includes(ret.status) && (
                    <select value="" onChange={(e) => { if (e.target.value) updateReturnStatus(ret.id, e.target.value); }}
                      className="text-xs border border-gray-200 rounded px-1 py-0.5">
                      <option value="">Update...</option>
                      <option value="approved">Approve</option>
                      <option value="received">Mark Received</option>
                      <option value="inspected">Mark Inspected</option>
                      <option value="refunded">Refund</option>
                      <option value="rejected">Reject</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Return items detail */}
      {returns.filter(r => r.items?.length > 0).length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-3 text-sm">Return Items Detail</h4>
          <div className="space-y-3">
            {returns.filter(r => r.items?.length > 0).map(ret => (
              <div key={ret.id} className="card p-4">
                <p className="font-mono text-xs font-medium mb-2">{ret.return_number}</p>
                <div className="space-y-2">
                  {ret.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <img src={item.product_image} alt="" className="w-8 h-8 rounded object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=N/A'; }} />
                      <span className="flex-1">{item.product_name}</span>
                      <span className="text-gray-500">Qty: {item.quantity}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded capitalize">{item.condition}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [sales, setSales] = useState(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    api.business.analyticsSales({ period }).then(setSales);
  }, [period]);

  if (!sales) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Sales Analytics</h3>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}
          className="input-field text-sm !py-2 !w-auto">
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h4 className="font-semibold text-sm mb-4">Daily Revenue</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sales.sales_by_day}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h4 className="font-semibold text-sm mb-4">Daily Orders</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sales.sales_by_day}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="order_count" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h4 className="font-semibold text-sm mb-4">Revenue by Category</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sales.revenue_by_category} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                {sales.revenue_by_category.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h4 className="font-semibold text-sm mb-4">Sales by Channel</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={sales.orders_by_channel} dataKey="revenue" nameKey="channel" cx="50%" cy="50%" outerRadius={100}
                label={({ channel, percent }) => `${channel} ${(percent * 100).toFixed(0)}%`}>
                {sales.orders_by_channel.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6 md:col-span-2">
          <h4 className="font-semibold text-sm mb-4">Top 10 Products by Revenue</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium text-gray-500">#</th>
                  <th className="p-2 text-left font-medium text-gray-500">Product</th>
                  <th className="p-2 text-right font-medium text-gray-500">Units Sold</th>
                  <th className="p-2 text-right font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sales.top_products.map((p, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 font-medium text-gray-500">{i + 1}</td>
                    <td className="p-2 font-medium">{p.product_name}</td>
                    <td className="p-2 text-right">{p.total_sold}</td>
                    <td className="p-2 text-right font-medium">${p.total_revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductImageUploader({ value, onChange, compact = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const data = await api.uploads.image(file);
      onChange(data.url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (compact) {
    return (
      <div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])} />
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="text-xs px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded border border-brand-100 flex items-center gap-1 disabled:opacity-60">
            <Upload className="w-3 h-3" /> {uploading ? 'Uploading...' : (value ? 'Replace' : 'Upload')}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="text-xs text-gray-500 hover:text-red-600">Clear</button>
          )}
        </div>
        {error && <p className="text-[10px] text-red-600 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-4 flex items-center gap-4 transition-colors ${
          uploading ? 'border-brand-300 bg-brand-50/40' : 'border-gray-200 hover:border-brand-400 hover:bg-brand-50/30'
        }`}>
        {value ? (
          <img src={value} alt="preview"
            className="w-20 h-20 rounded-lg object-cover border border-gray-200 bg-white"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/160?text=N/A'; }} />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-brand-600" />
            {uploading ? 'Uploading image...' : value ? 'Click to replace image' : 'Click or drop an image here'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, WEBP or GIF - up to 5 MB.</p>
          {value && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="mt-1 text-xs text-red-600 hover:text-red-700">Remove image</button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );
}
