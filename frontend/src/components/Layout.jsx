import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../api';
import { ShoppingCart, User, Search, Menu, X, Package, LogOut, BarChart3, ChevronDown, Store, Bell, Heart, Shield } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.notifications.list({ limit: 10 });
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const markAllRead = async () => {
    await api.notifications.markAllRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      await api.notifications.markRead(notif.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
    }
    setNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const isBusiness = user?.role === 'business' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Store className="w-8 h-8 text-brand-600" />
              <span className="text-xl font-bold text-brand-700 hidden sm:block">ShopEase</span>
            </Link>

            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands, categories..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 text-sm" />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </form>

            <nav className="hidden md:flex items-center gap-1">
              <Link to="/products" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 rounded-lg hover:bg-gray-50 transition-colors">Products</Link>
              <Link to="/shops" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 rounded-lg hover:bg-gray-50 transition-colors">Shops</Link>
              {isBusiness && <Link to="/business" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 rounded-lg hover:bg-gray-50 transition-colors">Dashboard</Link>}
              {isAdmin && <Link to="/admin" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 rounded-lg hover:bg-gray-50 transition-colors">Admin</Link>}
            </nav>

            <div className="flex items-center gap-1">
              {user ? (
                <>
                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                      className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-[70vh] flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                          <p className="font-semibold text-sm">Notifications</p>
                          {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline">Mark all read</button>}
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {notifications.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No notifications yet</p>
                          ) : notifications.map(n => (
                            <button key={n.id} onClick={() => handleNotifClick(n)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                              <p className={`text-sm ${!n.is_read ? 'font-semibold' : 'font-medium'} text-gray-900`}>{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link to="/cart" className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                    {cart.summary.item_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">{cart.summary.item_count}</span>
                    )}
                  </Link>

                  <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 rounded-lg hover:bg-gray-50 transition-colors">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:block">{user.first_name}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="font-medium text-sm">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-full capitalize">{user.role}</span>
                        </div>
                        <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                          <Package className="w-4 h-4" /> Order History
                        </Link>
                        <Link to="/following" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                          <Heart className="w-4 h-4" /> Following
                        </Link>
                        {isBusiness && (
                          <Link to="/business" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <BarChart3 className="w-4 h-4" /> Business Dashboard
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                            <Shield className="w-4 h-4" /> Admin Panel
                          </Link>
                        )}
                        <button onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Sign In</Link>
                  <Link to="/register" className="btn-primary text-sm !px-4 !py-2">Sign Up</Link>
                </div>
              )}
              <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
              <Link to="/products" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">Products</Link>
              <Link to="/shops" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">Shops</Link>
              {user && <Link to="/orders" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">Orders</Link>}
              {user && <Link to="/following" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">Following</Link>}
              {isBusiness && <Link to="/business" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">Dashboard</Link>}
              {isAdmin && <Link to="/admin" className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">Admin</Link>}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-900 text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-3">Shop</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to="/products?deals_only=true" className="hover:text-white transition-colors">Deals</Link></li>
                <li><Link to="/products?release_filter=last_30_days" className="hover:text-white transition-colors">New Arrivals</Link></li>
                <li><Link to="/shops" className="hover:text-white transition-colors">All Shops</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Account</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link to="/orders" className="hover:text-white transition-colors">Order History</Link></li>
                <li><Link to="/following" className="hover:text-white transition-colors">Following</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Help</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition-colors cursor-pointer">Shipping Info</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Returns Policy</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Contact Us</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">ShopEase</h3>
              <p className="text-sm">Your one-stop online shop for everything you need. Quality products, competitive prices, and fast delivery.</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 ShopEase. All rights reserved. | S351F Online Shopping System</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
