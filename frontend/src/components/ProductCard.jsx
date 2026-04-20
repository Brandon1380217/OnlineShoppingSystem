import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { Clock } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function ProductCard({ product }) {
  const { format } = useCurrency();
  const isComingSoon = new Date(product.release_date) > new Date();
  const effectivePrice = product.is_deal && product.deal_discount > 0
    ? product.price * (1 - product.deal_discount / 100)
    : product.price;

  return (
    <Link to={`/products/${product.slug}`} className="card group hover:shadow-md transition-all duration-200">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
        />
        {product.is_deal === 1 && product.deal_discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            -{product.deal_discount}%
          </span>
        )}
        {isComingSoon && (
          <span className="absolute top-3 left-3 bg-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Coming Soon
          </span>
        )}
      </div>
      <div className="p-4">
        {product.brand_name && (
          <p className="text-xs font-medium text-brand-600 mb-1">{product.brand_name}</p>
        )}
        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-2 group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>
        <StarRating rating={product.rating} count={product.review_count} />
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">{format(effectivePrice)}</span>
          {(product.compare_at_price || (product.is_deal && product.deal_discount > 0)) && (
            <span className="text-sm text-gray-400 line-through">
              {format(product.compare_at_price || product.price)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {product.purchase_count > 0 ? `${product.purchase_count.toLocaleString()} purchased` : 'New product'}
        </p>
      </div>
    </Link>
  );
}
