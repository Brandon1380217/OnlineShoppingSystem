import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import { Filter, X, ChevronDown, SlidersHorizontal } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name_asc', label: 'Name: A-Z' },
];

const RELEASE_FILTERS = [
  { value: '', label: 'All Releases' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'coming_soon', label: 'Coming Soon' },
];

const RATING_FILTERS = [
  { value: '', label: 'Any Rating' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    min_rating: searchParams.get('min_rating') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    release_filter: searchParams.get('release_filter') || '',
    deals_only: searchParams.get('deals_only') || '',
    sort: searchParams.get('sort') || 'popular',
    page: searchParams.get('page') || '1',
  };

  useEffect(() => {
    api.products.categories().then(setCategories);
    api.products.brands().then(setBrands);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.products.list(params)
      .then(data => { setProducts(data.products); setPagination(data.pagination); })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value); else newParams.delete(key);
    if (key !== 'page') newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => setSearchParams({});

  const activeFilterCount = [filters.category, filters.brand, filters.min_rating, filters.release_filter, filters.deals_only, filters.min_price, filters.max_price].filter(Boolean).length;

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Category</h3>
        <div className="space-y-1.5">
          <button onClick={() => updateFilter('category', '')}
            className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!filters.category ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            All Categories
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => updateFilter('category', cat.slug)}
              className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${filters.category === cat.slug ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {cat.name} <span className="text-gray-400">({cat.product_count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Brand</h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          <button onClick={() => updateFilter('brand', '')}
            className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!filters.brand ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            All Brands
          </button>
          {brands.filter(b => b.product_count > 0).map(brand => (
            <button key={brand.id} onClick={() => updateFilter('brand', brand.slug)}
              className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${filters.brand === brand.slug ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {brand.name} <span className="text-gray-400">({brand.product_count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Customer Rating</h3>
        <div className="space-y-1.5">
          {RATING_FILTERS.map(r => (
            <button key={r.value} onClick={() => updateFilter('min_rating', r.value)}
              className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${filters.min_rating === r.value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Release */}
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Release Date</h3>
        <div className="space-y-1.5">
          {RELEASE_FILTERS.map(r => (
            <button key={r.value} onClick={() => updateFilter('release_filter', r.value)}
              className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${filters.release_filter === r.value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={filters.min_price}
            onChange={(e) => updateFilter('min_price', e.target.value)}
            className="input-field text-sm !py-1.5 w-full" />
          <span className="text-gray-400">-</span>
          <input type="number" placeholder="Max" value={filters.max_price}
            onChange={(e) => updateFilter('max_price', e.target.value)}
            className="input-field text-sm !py-1.5 w-full" />
        </div>
      </div>

      {/* Deals */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filters.deals_only === 'true'}
            onChange={(e) => updateFilter('deals_only', e.target.checked ? 'true' : '')}
            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500" />
          <span className="text-sm font-medium text-gray-700">Deals Only</span>
        </label>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="text-sm text-red-600 hover:underline flex items-center gap-1">
          <X className="w-3 h-3" /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {filters.search ? `Results for "${filters.search}"` : filters.deals_only ? 'Deals & Discounts' : 'All Products'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total} products found</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(!showFilters)}
            className="md:hidden btn-secondary text-sm !px-3 !py-2 flex items-center gap-1">
            <SlidersHorizontal className="w-4 h-4" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}
            className="input-field text-sm !py-2 !w-auto">
            {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto md:relative md:inset-auto md:z-auto md:bg-transparent md:p-0' : 'hidden'} md:block w-64 shrink-0`}>
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="font-bold text-lg">Filters</h2>
            <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
          </div>
          <FilterSidebar />
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-5 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No products found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
              <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => updateFilter('page', String(page))}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === pagination.page ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}>
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
