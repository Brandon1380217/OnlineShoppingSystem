import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowRight, Truck, Shield, RotateCcw, Sparkles, Flame, Tag, Clock } from 'lucide-react';

export default function Home() {
  const { format } = useCurrency();
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
      {/* Hero — signature gradient, Fraunces display type, decorative glow blobs */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 text-white">
        <div aria-hidden className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-accent-500/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-secondary-300/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-semibold uppercase tracking-wider ring-1 ring-white/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Curated for you
            </span>
            <h1 className="font-display text-display-1 md:text-[4.5rem] leading-[1.05] tracking-tight mb-6">
              Shop <span className="italic bg-gradient-to-r from-accent-300 to-accent-500 bg-clip-text text-transparent">extraordinary</span> things, effortlessly.
            </h1>
            <p className="text-lg md:text-xl text-white/85 mb-8 max-w-xl leading-relaxed">
              Thousands of products from trusted shops. Fast delivery, easy returns, and member-only deals — in HKD, USD, GBP, and EUR.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-base ease-standard">
                Shop Now
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/products?deals_only=true"
                className="inline-flex items-center gap-2 border-2 border-white/60 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 hover:border-white transition-colors duration-base">
                <Flame className="w-4 h-4" /> Today's Deals
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-10 text-sm text-white/75">
              <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Secure checkout</div>
              <div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Fast shipping</div>
              <div className="hidden sm:flex items-center gap-2"><RotateCcw className="w-4 h-4" /> 30-day returns</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', desc: `On orders over ${format(50)}` },
              { icon: Shield, title: 'Secure Payments', desc: 'Encrypted transactions' },
              { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
              { icon: Sparkles, title: 'Member Deals', desc: 'Exclusive discounts' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                  <item.icon className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{item.title}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">
        {/* Categories */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-label text-primary-600 dark:text-primary-400 mb-1">Browse</p>
              <h2 className="font-display text-h1 text-neutral-900 dark:text-neutral-50">Shop by Category</h2>
            </div>
            <Link to="/products" className="text-primary-600 dark:text-primary-400 font-medium text-sm hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`}
                className="group card-lift p-5 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center text-2xl overflow-hidden group-hover:scale-105 transition-transform duration-base ease-standard">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <Tag className="w-6 h-6 text-primary-600 dark:text-primary-300" />
                  )}
                </div>
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{cat.name}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{cat.product_count} products</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Deals */}
        {deals.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-label text-accent-600 dark:text-accent-400 mb-1 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Limited time
                </p>
                <h2 className="font-display text-h1 text-neutral-900 dark:text-neutral-50">Hot Deals</h2>
              </div>
              <Link to="/products?deals_only=true" className="text-primary-600 dark:text-primary-400 font-medium text-sm hover:underline flex items-center gap-1">
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
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-label text-secondary-600 dark:text-secondary-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Fresh drops
                </p>
                <h2 className="font-display text-h1 text-neutral-900 dark:text-neutral-50">New Arrivals</h2>
              </div>
              <Link to="/products?release_filter=last_30_days&sort=newest" className="text-primary-600 dark:text-primary-400 font-medium text-sm hover:underline flex items-center gap-1">
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
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-label text-primary-600 dark:text-primary-400 mb-1">Best sellers</p>
              <h2 className="font-display text-h1 text-neutral-900 dark:text-neutral-50">Most Popular</h2>
            </div>
            <Link to="/products?sort=popular" className="text-primary-600 dark:text-primary-400 font-medium text-sm hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popular.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Callout — signature gradient card with Fraunces italic accent */}
        <section>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-primary-900 to-primary-700 text-white p-10 md:p-14 shadow-xl">
            <div aria-hidden className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="relative max-w-xl">
              <h3 className="font-display text-h1 leading-tight mb-3">
                Built for <span className="italic text-accent-300">every</span> wallet.
              </h3>
              <p className="text-white/80 mb-6">
                Switch currency in the header — display prices in HKD, USD, GBP, or EUR instantly. Check out in your preferred currency with confidence.
              </p>
              <Link to="/products" className="btn-accent inline-flex items-center gap-2">
                Start shopping <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
