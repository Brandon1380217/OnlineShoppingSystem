import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../api';
import { CheckCircle, Truck, Zap, Clock, CreditCard, Banknote, ArrowLeft } from 'lucide-react';

const SHIPPING_METHODS = [
  { id: 'standard', name: 'Standard Shipping', desc: '5-7 business days', price: 5.99, icon: Truck, free_over: 50 },
  { id: 'express', name: 'Express Shipping', desc: '2-3 business days', price: 12.99, icon: Zap },
  { id: 'overnight', name: 'Overnight Shipping', desc: 'Next business day', price: 24.99, icon: Clock },
];

const PAYMENT_METHODS = [
  { id: 'credit_card', name: 'Credit / Debit Card', icon: CreditCard },
  { id: 'paypal', name: 'PayPal', icon: Banknote },
];

export default function Checkout() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shipping_address: user?.address || '',
    shipping_city: user?.city || '',
    shipping_state: user?.state || '',
    shipping_zip: user?.zip_code || '',
    shipping_country: user?.country || 'US',
    shipping_method: 'standard',
    payment_method: 'credit_card',
    card_number: '',
    card_expiry: '',
    card_cvc: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  if (!user) { navigate('/login'); return null; }
  if (cart.items.length === 0 && !success) { navigate('/cart'); return null; }

  const selectedShipping = SHIPPING_METHODS.find(m => m.id === form.shipping_method);
  const shippingCost = cart.summary.subtotal >= 50 && form.shipping_method === 'standard' ? 0 : selectedShipping.price;
  const tax = Math.round(cart.summary.subtotal * 0.08 * 100) / 100;
  const total = Math.round((cart.summary.subtotal + shippingCost + tax) * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.orders.checkout({
        shipping_method: form.shipping_method,
        shipping_address: form.shipping_address,
        shipping_city: form.shipping_city,
        shipping_state: form.shipping_state,
        shipping_zip: form.shipping_zip,
        shipping_country: form.shipping_country,
        payment_method: form.payment_method,
      });
      setSuccess(result);
      await fetchCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
        <p className="text-lg font-mono font-bold text-brand-600 mb-6">{success.order.order_number}</p>
        <div className="card p-6 text-left mb-6">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          {success.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm py-1.5">
              <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
              <span className="font-medium">{format(item.total_price)}</span>
            </div>
          ))}
          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span>{format(success.order.total)}</span>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link to={`/orders`} className="btn-primary">View Orders</Link>
          <Link to="/products" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input type="text" required value={form.shipping_address}
                    onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                    className="input-field" placeholder="123 Main Street" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input type="text" required value={form.shipping_city}
                    onChange={(e) => setForm({ ...form, shipping_city: e.target.value })}
                    className="input-field" placeholder="New York" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input type="text" required value={form.shipping_state}
                    onChange={(e) => setForm({ ...form, shipping_state: e.target.value })}
                    className="input-field" placeholder="NY" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                  <input type="text" required value={form.shipping_zip}
                    onChange={(e) => setForm({ ...form, shipping_zip: e.target.value })}
                    className="input-field" placeholder="10001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select value={form.shipping_country}
                    onChange={(e) => setForm({ ...form, shipping_country: e.target.value })}
                    className="input-field">
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="HK">Hong Kong</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">Delivery Method</h2>
              <div className="space-y-3">
                {SHIPPING_METHODS.map(method => {
                  const isFree = method.free_over && cart.summary.subtotal >= method.free_over;
                  return (
                    <label key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        form.shipping_method === method.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input type="radio" name="shipping" value={method.id} checked={form.shipping_method === method.id}
                        onChange={(e) => setForm({ ...form, shipping_method: e.target.value })}
                        className="w-4 h-4 text-brand-600" />
                      <method.icon className="w-5 h-5 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{method.name}</p>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                      </div>
                      <span className="font-semibold text-sm">
                        {isFree ? <span className="text-green-600">Free</span> : format(method.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Payment */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">Payment Method</h2>
              <div className="space-y-3 mb-4">
                {PAYMENT_METHODS.map(method => (
                  <label key={method.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      form.payment_method === method.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input type="radio" name="payment" value={method.id} checked={form.payment_method === method.id}
                      onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                      className="w-4 h-4 text-brand-600" />
                    <method.icon className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-sm">{method.name}</span>
                  </label>
                ))}
              </div>

              {form.payment_method === 'credit_card' && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input type="text" value={form.card_number} placeholder="4242 4242 4242 4242"
                      onChange={(e) => setForm({ ...form, card_number: e.target.value })}
                      className="input-field" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                      <input type="text" value={form.card_expiry} placeholder="MM/YY"
                        onChange={(e) => setForm({ ...form, card_expiry: e.target.value })}
                        className="input-field" maxLength={5} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                      <input type="text" value={form.card_cvc} placeholder="123"
                        onChange={(e) => setForm({ ...form, card_cvc: e.target.value })}
                        className="input-field" maxLength={4} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">This is a demo. No real payment will be processed.</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart.items.map(item => {
                  let price = item.variant_price || item.price;
                  if (item.is_deal && item.deal_discount > 0) price = price * (1 - item.deal_discount / 100);
                  return (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.image_url} alt="" className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">{format(price * item.quantity)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{format(cart.summary.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{shippingCost === 0 ? 'Free' : format(shippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{format(tax)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{format(total)}</span>
                </div>
              </div>
              <button type="submit" disabled={loading} onClick={handleSubmit}
                className="btn-primary w-full mt-4">
                {loading ? 'Processing...' : `Place Order - ${format(total)}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
