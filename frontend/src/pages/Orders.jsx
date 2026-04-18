import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Package, Truck, CheckCircle, Clock, XCircle, RotateCcw, RefreshCw, Eye, ShoppingCart, ThumbsUp } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmed' },
  processing: { color: 'bg-indigo-100 text-indigo-800', icon: RefreshCw, label: 'Processing' },
  packed: { color: 'bg-purple-100 text-purple-800', icon: Package, label: 'Packed' },
  shipped: { color: 'bg-cyan-100 text-cyan-800', icon: Truck, label: 'Shipped' },
  out_for_delivery: { color: 'bg-teal-100 text-teal-800', icon: Truck, label: 'Out for Delivery' },
  delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
  returned: { color: 'bg-orange-100 text-orange-800', icon: RotateCcw, label: 'Returned' },
  refunded: { color: 'bg-gray-100 text-gray-800', icon: RotateCcw, label: 'Refunded' },
};

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try { const data = await api.orders.list({}); setOrders(data.orders); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const viewOrderDetail = async (orderId) => {
    try { const data = await api.orders.get(orderId); setOrderDetail(data); setSelectedOrder(orderId); }
    catch { /* ignore */ }
  };

  const handleCancel = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setActionLoading(`cancel-${orderId}`);
    try {
      await api.orders.cancel(orderId);
      await loadOrders();
      if (selectedOrder === orderId) viewOrderDetail(orderId);
    } catch (err) { alert(err.message); }
    finally { setActionLoading(''); }
  };

  const handleConfirmReceived = async (orderId) => {
    if (!confirm('Confirm that you have received this order?')) return;
    setActionLoading(`confirm-${orderId}`);
    try {
      await api.orders.confirmReceived(orderId);
      await loadOrders();
      if (selectedOrder === orderId) viewOrderDetail(orderId);
    } catch (err) { alert(err.message); }
    finally { setActionLoading(''); }
  };

  const handleReturn = async (orderId) => {
    setActionLoading(`return-${orderId}`);
    try {
      await api.orders.returnOrder(orderId, { reason: returnReason });
      setShowReturnModal(null);
      setReturnReason('');
      await loadOrders();
      if (selectedOrder === orderId) viewOrderDetail(orderId);
    } catch (err) { alert(err.message); }
    finally { setActionLoading(''); }
  };

  const handleReorder = async (order) => {
    try {
      const detail = await api.orders.get(order.id);
      for (const item of detail.items) {
        try {
          await api.cart.add({ product_id: item.product_id, variant_id: item.variant_id || null, quantity: item.quantity });
        } catch { /* skip unavailable items */ }
      }
      navigate('/cart');
    } catch (err) { alert(err.message); }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
          <p className="text-gray-500 mt-1">Start shopping to see your orders here.</p>
          <Link to="/products" className="btn-primary mt-4 inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            const isExpanded = selectedOrder === order.id;
            const isDeliveredNotConfirmed = order.status === 'delivered' && !order.received_confirmed_at;
            const isReceivedConfirmed = !!order.received_confirmed_at;

            return (
              <div key={order.id} className="card">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <p className="font-mono font-bold text-sm">{order.order_number}</p>
                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" /> {status.label}
                      </span>
                      {isReceivedConfirmed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <ThumbsUp className="w-3 h-3" /> Received
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${order.total.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{order.shipping_method} shipping</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    {order.items?.slice(0, 4).map(item => (
                      <img key={item.id} src={item.product_image} alt={item.product_name}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=N/A'; }} />
                    ))}
                    {order.items?.length > 4 && <span className="text-sm text-gray-500">+{order.items.length - 4} more</span>}
                    <span className="text-sm text-gray-500 ml-2">{order.items?.reduce((sum, i) => sum + i.quantity, 0)} item(s)</span>
                  </div>

                  {order.tracking_number && (
                    <p className="text-xs text-gray-500 mb-3">
                      Tracking: <span className="font-mono font-medium text-gray-700">{order.tracking_number}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => isExpanded ? setSelectedOrder(null) : viewOrderDetail(order.id)}
                      className="btn-secondary text-xs !px-3 !py-1.5 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>

                    {isDeliveredNotConfirmed && (
                      <button onClick={() => handleConfirmReceived(order.id)}
                        disabled={actionLoading === `confirm-${order.id}`}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {actionLoading === `confirm-${order.id}` ? 'Confirming...' : 'Confirm Received'}
                      </button>
                    )}

                    {['pending', 'confirmed'].includes(order.status) && (
                      <button onClick={() => handleCancel(order.id)}
                        disabled={actionLoading === `cancel-${order.id}`}
                        className="btn-danger text-xs !px-3 !py-1.5 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Cancel Order
                      </button>
                    )}

                    {order.status === 'delivered' && !isReceivedConfirmed && (
                      <button onClick={() => setShowReturnModal(order.id)}
                        className="btn-secondary text-xs !px-3 !py-1.5 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Request Return
                      </button>
                    )}

                    {['delivered', 'cancelled', 'refunded'].includes(order.status) && (
                      <button onClick={() => handleReorder(order)}
                        className="btn-secondary text-xs !px-3 !py-1.5 flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" /> Order Again
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && orderDetail && (
                  <div className="border-t bg-gray-50 p-5">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Items</h4>
                        <div className="space-y-3">
                          {orderDetail.items.map(item => (
                            <div key={item.id} className="flex gap-3 bg-white p-3 rounded-lg">
                              <img src={item.product_image} alt="" className="w-14 h-14 object-cover rounded"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=N/A'; }} />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.product_name}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity} x ${item.unit_price.toFixed(2)}</p>
                              </div>
                              <p className="font-medium text-sm">${item.total_price.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Shipping Address</h4>
                          <p className="text-sm text-gray-600">
                            {orderDetail.order.shipping_address}<br />
                            {orderDetail.order.shipping_city}, {orderDetail.order.shipping_state} {orderDetail.order.shipping_zip}<br />
                            {orderDetail.order.shipping_country}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Payment</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${orderDetail.order.subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{orderDetail.order.shipping_cost === 0 ? 'Free' : `$${orderDetail.order.shipping_cost.toFixed(2)}`}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${orderDetail.order.tax.toFixed(2)}</span></div>
                            {orderDetail.order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${orderDetail.order.discount.toFixed(2)}</span></div>}
                            <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>${orderDetail.order.total.toFixed(2)}</span></div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Delivery Status</h4>
                          <div className="space-y-2">
                            {orderDetail.order.created_at && <div className="flex items-center gap-2 text-sm"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-gray-600">Order placed - {new Date(orderDetail.order.created_at).toLocaleString()}</span></div>}
                            {orderDetail.order.shipped_at && <div className="flex items-center gap-2 text-sm"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-gray-600">Shipped - {new Date(orderDetail.order.shipped_at).toLocaleString()}</span></div>}
                            {orderDetail.order.delivered_at && <div className="flex items-center gap-2 text-sm"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-gray-600">Delivered - {new Date(orderDetail.order.delivered_at).toLocaleString()}</span></div>}
                            {orderDetail.order.received_confirmed_at && <div className="flex items-center gap-2 text-sm"><div className="w-2 h-2 bg-emerald-500 rounded-full" /><span className="text-emerald-700 font-medium">Received confirmed - {new Date(orderDetail.order.received_confirmed_at).toLocaleString()}</span></div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showReturnModal === order.id && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                      <h3 className="font-bold text-lg mb-4">Request Return</h3>
                      <p className="text-sm text-gray-500 mb-4">Order: {order.order_number}</p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for return</label>
                        <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)}
                          className="input-field" rows={3} placeholder="Tell us why you'd like to return this order..." />
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button onClick={() => { setShowReturnModal(null); setReturnReason(''); }} className="btn-secondary flex-1">Cancel</button>
                        <button onClick={() => handleReturn(order.id)} disabled={actionLoading === `return-${order.id}`} className="btn-primary flex-1">
                          {actionLoading === `return-${order.id}` ? 'Submitting...' : 'Submit Return'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
