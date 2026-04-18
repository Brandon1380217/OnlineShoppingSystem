import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';
import { ShoppingCart, Heart, Truck, Shield, RotateCcw, Check, Minus, Plus, ChevronRight, Clock, Package, Store } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    api.products.get(slug)
      .then(d => { setData(d); setSelectedVariant(d.variants.length > 0 ? d.variants[0] : null); })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-10 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  if (!data) return null;
  const { product, variants, reviews, related, shop } = data;
  const isComingSoon = new Date(product.release_date) > new Date();
  const effectivePrice = product.is_deal && product.deal_discount > 0
    ? product.price * (1 - product.deal_discount / 100)
    : product.price;
  const displayPrice = selectedVariant?.price || effectivePrice;
  const allImages = product.images?.length > 0 ? product.images : [product.image_url];

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    setAdding(true);
    try {
      await addToCart(product.id, selectedVariant?.id, quantity);
      setAddedMessage('Added to cart!');
      setTimeout(() => setAddedMessage(''), 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/products" className="hover:text-brand-600">Products</Link>
        {product.category_name && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/products?category=${product.category_slug}`} className="hover:text-brand-600">{product.category_name}</Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
            <img src={allImages[selectedImage]} alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/600x600?text=No+Image'; }} />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-3">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-brand-500' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.brand_name && (
            <Link to={`/products?brand=${product.brand_slug}`} className="text-brand-600 font-medium text-sm hover:underline">
              {product.brand_name}
            </Link>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 mb-3">{product.name}</h1>

          <div className="flex items-center gap-4 mb-4">
            <StarRating rating={product.rating} count={product.review_count} size="md" />
            <span className="text-sm text-gray-500">{product.purchase_count.toLocaleString()} purchased</span>
          </div>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
            {(product.compare_at_price || (product.is_deal && product.deal_discount > 0)) && (
              <>
                <span className="text-lg text-gray-400 line-through">${(product.compare_at_price || product.price).toFixed(2)}</span>
                {product.is_deal && product.deal_discount > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-sm font-semibold rounded">
                    Save {product.deal_discount}%
                  </span>
                )}
              </>
            )}
          </div>

          {isComingSoon && (
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-3 rounded-lg mb-4">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Coming Soon - Available {new Date(product.release_date).toLocaleDateString()}</span>
            </div>
          )}

          {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
            <p className="text-orange-600 text-sm font-medium mb-4">Only {product.stock_quantity} left in stock!</p>
          )}
          {product.stock_quantity === 0 && !isComingSoon && (
            <p className="text-red-600 text-sm font-medium mb-4">Out of stock</p>
          )}

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Options</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map(v => (
                  <button key={v.id} onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      selectedVariant?.id === v.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    {v.name}
                    {v.price && v.price !== product.price && <span className="ml-1 text-gray-500">(${v.price.toFixed(2)})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to cart */}
          {!isComingSoon && product.stock_quantity > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 hover:bg-gray-50 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 font-medium text-center min-w-[3rem]">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="p-2.5 hover:bg-gray-50 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button onClick={handleAddToCart} disabled={adding}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {addedMessage ? (
                  <><Check className="w-5 h-5" /> {addedMessage}</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
                )}
              </button>
            </div>
          )}

          {/* Trust */}
          <div className="grid grid-cols-3 gap-3 py-4 border-t border-gray-100">
            {[
              { icon: Truck, text: 'Free shipping over $50' },
              { icon: Shield, text: 'Secure checkout' },
              { icon: RotateCcw, text: '30-day returns' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <item.icon className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Sold by */}
          {shop && (
            <Link to={`/shops/${shop.id}`}
              className="mt-4 flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sold by {shop.company_name || `${shop.first_name}'s Shop`}</p>
                <p className="text-xs text-brand-600">Visit shop &rarr;</p>
              </div>
            </Link>
          )}

          {/* Product Info */}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">SKU</span>
              <span className="font-medium">{product.sku}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Category</span>
              <Link to={`/products?category=${product.category_slug}`} className="font-medium text-brand-600 hover:underline">{product.category_name}</Link>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Release Date</span>
              <span className="font-medium">{new Date(product.release_date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{review.first_name} {review.last_name?.charAt(0)}.</p>
                    <StarRating rating={review.rating} />
                  </div>
                  <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                {review.title && <p className="font-semibold text-sm mt-2">{review.title}</p>}
                {review.comment && <p className="text-gray-600 text-sm mt-1">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
