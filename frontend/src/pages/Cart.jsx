import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

export default function Cart() {
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your cart</h2>
        <p className="text-gray-500 mb-6">You need to be logged in to add items to your cart.</p>
        <Link to="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  const handleRemove = async (id) => {
    setRemoving(id);
    await removeItem(id);
    setRemoving(null);
  };

  const getEffectivePrice = (item) => {
    let price = item.variant_price || item.price;
    if (item.is_deal && item.deal_discount > 0) {
      price = price * (1 - item.deal_discount / 100);
    }
    return price;
  };

  const shipping = cart.summary.subtotal >= 50 ? 0 : 5.99;
  const tax = Math.round(cart.summary.subtotal * 0.08 * 100) / 100;
  const total = Math.round((cart.summary.subtotal + shipping + tax) * 100) / 100;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart ({cart.summary.item_count} items)</h1>
        <button onClick={clearCart} className="text-sm text-red-600 hover:underline">Clear Cart</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map(item => {
            const price = getEffectivePrice(item);
            return (
              <div key={item.id} className="card p-4 flex gap-4">
                <Link to={`/products/${item.slug}`} className="shrink-0">
                  <img src={item.image_url} alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=No+Image'; }} />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {item.brand_name && <p className="text-xs text-brand-600 font-medium">{item.brand_name}</p>}
                      <Link to={`/products/${item.slug}`} className="font-medium text-gray-900 hover:text-brand-600 line-clamp-2">
                        {item.name}
                      </Link>
                      {item.variant_name && <p className="text-sm text-gray-500 mt-0.5">{item.variant_name}</p>}
                    </div>
                    <p className="text-lg font-bold text-gray-900 shrink-0">${(price * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1.5 hover:bg-gray-50 transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-gray-50 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">${price.toFixed(2)} each</span>
                      <button onClick={() => handleRemove(item.id)} disabled={removing === item.id}
                        className="text-red-500 hover:text-red-700 p-1 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-bold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">${cart.summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (8%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-green-600 mt-3">Add ${(50 - cart.summary.subtotal).toFixed(2)} more for free shipping!</p>
            )}
            <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <Link to="/products" className="block text-center text-sm text-brand-600 hover:underline mt-3">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
