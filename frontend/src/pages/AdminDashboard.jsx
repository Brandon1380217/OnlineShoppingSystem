import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Shield, Users, Package, DollarSign, ShoppingBag, Search, Edit, Trash2, Plus, XCircle, UserPlus } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/');
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500">System administration and user management</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[{ id: 'overview', label: 'Overview' }, { id: 'users', label: 'User Management' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'overview' && <AdminOverview />}
      {activeTab === 'users' && <UserManagement />}
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.admin.stats().then(setStats); }, []);

  if (!stats) return <div className="animate-pulse space-y-4"><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}</div></div>;

  const cards = [
    { label: 'Total Users', value: stats.total_users, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Customers', value: stats.customer_count, icon: Users, color: 'bg-green-50 text-green-600' },
    { label: 'Business', value: stats.business_count, icon: ShoppingBag, color: 'bg-purple-50 text-purple-600' },
    { label: 'Admins', value: stats.admin_count, icon: Shield, color: 'bg-red-50 text-red-600' },
    { label: 'Total Orders', value: stats.total_orders, icon: Package, color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Revenue', value: `$${stats.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Active Products', value: stats.total_products, icon: ShoppingBag, color: 'bg-cyan-50 text-cyan-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="card p-4">
          <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
            <c.icon className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">{c.value}</p>
          <p className="text-xs text-gray-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', first_name: '', last_name: '', role: 'customer', phone: '', company_name: '' });

  const loadUsers = async (page = 1) => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (filters.role) params.role = filters.role;
    if (filters.search) params.search = filters.search;
    const data = await api.admin.users(params);
    setUsers(data.users);
    setPagination(data.pagination);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, [filters]);

  const handleUpdate = async () => {
    await api.admin.updateUser(editUser.id, editForm);
    setEditUser(null);
    await loadUsers(pagination.page);
  };

  const handleDelete = async (id, email) => {
    if (!confirm(`Delete user ${email}? This action cannot be undone.`)) return;
    try {
      await api.admin.deleteUser(id);
      await loadUsers(pagination.page);
    } catch (err) { alert(err.message); }
  };

  const handleCreate = async () => {
    try {
      await api.admin.createUser(createForm);
      setShowCreate(false);
      setCreateForm({ email: '', password: '', first_name: '', last_name: '', role: 'customer', phone: '', company_name: '' });
      await loadUsers();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search users..." value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input-field !pl-9 text-sm !py-2" />
        </div>
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="input-field text-sm !py-2 !w-auto">
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="business">Business</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm !px-4 !py-2 flex items-center gap-1">
          <UserPlus className="w-4 h-4" /> Create User
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 text-left font-medium text-gray-500">User</th>
                <th className="p-3 text-left font-medium text-gray-500">Email</th>
                <th className="p-3 text-left font-medium text-gray-500">Role</th>
                <th className="p-3 text-left font-medium text-gray-500">Company</th>
                <th className="p-3 text-left font-medium text-gray-500">Joined</th>
                <th className="p-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{u.first_name} {u.last_name}</td>
                  <td className="p-3 text-gray-500">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'business' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>{u.role}</span>
                  </td>
                  <td className="p-3 text-gray-500">{u.company_name || '-'}</td>
                  <td className="p-3 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditUser(u); setEditForm({ role: u.role, first_name: u.first_name, last_name: u.last_name, email: u.email, phone: u.phone || '', company_name: u.company_name || '' }); }}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.email)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => loadUsers(p)}
              className={`w-8 h-8 rounded text-sm ${p === pagination.page ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Edit User</h3>
              <button onClick={() => setEditUser(null)}><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} className="input-field text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="input-field text-sm">
                  <option value="customer">Customer</option>
                  <option value="business">Business</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={editForm.company_name} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} className="input-field text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditUser(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleUpdate} className="btn-primary flex-1">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Create User</h3>
              <button onClick={() => setShowCreate(false)}><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" value={createForm.first_name} onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" value={createForm.last_name} onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })} className="input-field text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })} className="input-field text-sm">
                  <option value="customer">Customer</option>
                  <option value="business">Business</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={createForm.company_name} onChange={e => setCreateForm({ ...createForm, company_name: e.target.value })} className="input-field text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} className="btn-primary flex-1">Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
