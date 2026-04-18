import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import { ArrowRight, Truck, Shield, RotateCcw, Sparkles, Flame, Tag, Clock } from 'lucide-react';

export default function Home() {
  const [deals, setDeals] = useState([]);
  const [popular, setPopular] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.products.list({ deals_only: true, limit: 4, sort: 'popular' }).then(d => setDeals(d.products));
    api.products.list({ limit: 8, sort: 'popular' }).then(d => setPopular(d.products));
    api.products.list({ release_filter: 'last_30_days', limit: 4, sort: 'newest' }).then(d => setNewReleases(d.products));
    api.products.categories().then(setCategories);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Discover Amazing Products at Unbeatable Prices
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              Shop from thousands of products with fast delivery, easy returns, and member-exclusive deals. Your satisfaction is our priority.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="bg-white text-brand-700 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/products?deals_only=true" className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors inline-flex items-center gap-2">
                <Flame className="w-4 h-4" /> Today's Deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
              { icon: Shield, title: 'Secure Payments', desc: 'Encrypted transactions' },
              { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
              { icon: Sparkles, title: 'Member Deals', desc: 'Exclusive discounts' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 rounded-lg">
                  <item.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/products" className="text-brand-600 font-medium text-sm hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`}
                className="group card p-4 text-center hover:shadow-md transition-all">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-brand-50 flex items-center justify-center text-2xl overflow-hidden">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <Tag className="w-6 h-6 text-brand-600" />
                  )}
                </div>
                <h3 className="font-medium text-sm text-gray-900 group-hover:text-brand-600 transition-colors">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{cat.product_count} products</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Deals */}
        {deals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Flame className="w-6 h-6 text-red-500" /> Hot Deals
              </h2>
              <Link to="/products?deals_only=true" className="text-brand-600 font-medium text-sm hover:underline flex items-center gap-1">
                All Deals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {deals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* New Releases */}
        {newReleases.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-500" /> New Arrivals
              </h2>
              <Link to="/products?release_filter=last_30_days&sort=newest" className="text-brand-600 font-medium text-sm hover:underline flex items-center gap-1">
                See More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newReleases.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Popular */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Most Popular</h2>
            <Link to="/products?sort=popular" className="text-brand-600 font-medium text-sm hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popular.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
