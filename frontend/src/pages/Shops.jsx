import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import ChatWidget from '../components/ChatWidget';
import { Store, Users, Package, Heart, HeartOff, ArrowLeft, Star, MessageSquare, Lock } from 'lucide-react';

export function ShopsList() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.shops.list().then(setShops).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Shops</h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card h-40 animate-pulse bg-gray-200" />)}
        </div>
      ) : shops.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No shops available yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shops.map(shop => (
            <Link key={shop.id} to={`/shops/${shop.id}`} className="card p-6 text-center hover:shadow-md transition-all group">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-brand-50 flex items-center justify-center">
                <Store className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                {shop.company_name || `${shop.first_name}'s Shop`}
              </h3>
              {shop.review_count > 0 && (
                <div className="flex items-center justify-center mt-2">
                  <StarRating rating={shop.rating} count={shop.review_count} size="sm" />
                </div>
              )}
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {shop.product_count} products</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {shop.follower_count} followers</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ShopDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);

  const loadShop = async () => {
    try {
      const d = await api.shops.get(id);
      setData(d);
    } catch { navigate('/shops'); }
    finally { setLoading(false); }
  };

  const loadReviews = async () => {
    try {
      const r = await api.shops.reviews(id);
      setReviewData(r);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadShop(); loadReviews(); }, [id]);

  const toggleFollow = async () => {
    if (!user) { navigate('/login'); return; }
    setFollowLoading(true);
    try {
      if (data.shop.is_following) await api.shops.unfollow(id);
      else await api.shops.follow(id);
      await loadShop();
    } catch (err) { alert(err.message); }
    finally { setFollowLoading(false); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { alert('Please select a rating'); return; }
    if (!confirm('Submit your review?\n\nOnce submitted, your review cannot be edited or deleted.')) return;
    setSubmittingReview(true);
    try {
      await api.shops.submitReview(id, reviewForm);
      setReviewForm({ rating: 0, comment: '' });
      setReviewFormOpen(false);
      await Promise.all([loadShop(), loadReviews()]);
    } catch (err) { alert(err.message); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><div className="animate-pulse h-64 bg-gray-200 rounded-xl" /></div>;
  if (!data) return null;

  const { shop, products } = data;
  const avgRating = reviewData?.avg_rating || shop.rating || 0;
  const reviewCount = reviewData?.count ?? shop.review_count ?? 0;
  const myReview = reviewData?.reviews.find(r => user && r.user_id === user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/shops" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> All Shops
      </Link>

      <div className="card p-6 mb-8">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
            <Store className="w-10 h-10 text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{shop.company_name || `${shop.first_name}'s Shop`}</h1>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
              {reviewCount > 0 ? (
                <span className="flex items-center gap-1">
                  <StarRating rating={avgRating} count={reviewCount} size="sm" />
                </span>
              ) : (
                <span className="text-xs text-gray-400">No shop reviews yet</span>
              )}
              <span className="flex items-center gap-1"><Package className="w-4 h-4" /> {shop.product_count} products</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {shop.follower_count} followers</span>
              <span>Joined {new Date(shop.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={toggleFollow} disabled={followLoading}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              shop.is_following
                ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}>
            {shop.is_following ? <><HeartOff className="w-4 h-4" /> Unfollow</> : <><Heart className="w-4 h-4" /> Follow</>}
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Shop Reviews ({reviewCount})
          </h2>
          {user && shop.can_review && !myReview && !reviewFormOpen && (
            <button onClick={() => setReviewFormOpen(true)}
              className="btn-primary text-sm !px-4 !py-2">
              Write a Review
            </button>
          )}
          {user && myReview && (
            <span className="text-xs text-gray-500 italic">You have reviewed this shop. Reviews are final and cannot be edited.</span>
          )}
          {user && !shop.can_review && !myReview && (
            <p className="text-xs text-gray-500 italic">Purchase from this shop to leave a review</p>
          )}
        </div>

        {reviewData && reviewCount > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-100">
            <div className="md:col-span-1 text-center md:text-left">
              <p className="text-4xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
              <StarRating rating={avgRating} size="md" />
              <p className="text-sm text-gray-500 mt-1">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              {[5,4,3,2,1].map(star => {
                const b = reviewData.breakdown.find(r => r.rating === star);
                const count = b ? b.count : 0;
                const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-gray-600">{star}<Star className="w-3 h-3 inline fill-yellow-400 text-yellow-400 ml-0.5" /></span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-gray-500 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {reviewFormOpen && !myReview && (
          <form onSubmit={submitReview} className="mb-6 p-4 bg-brand-50/50 border border-brand-100 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Share your experience</h3>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 mb-3 inline-block">
              Reviews are final - once submitted you will not be able to edit or delete your rating.
            </p>
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-1">Your rating</p>
              <StarRating rating={reviewForm.rating} size="lg" interactive
                onChange={(r) => setReviewForm(f => ({ ...f, rating: r }))} />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Comment (optional)</label>
              <textarea value={reviewForm.comment}
                onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                rows={3} className="input-field"
                placeholder="Tell other customers about your experience with this shop..." />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={submittingReview || !reviewForm.rating} className="btn-primary text-sm !px-4 !py-2">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setReviewFormOpen(false)} className="btn-secondary text-sm !px-4 !py-2">Cancel</button>
            </div>
          </form>
        )}

        {reviewData && reviewData.reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this shop!</p>
        ) : reviewData && (
          <div className="space-y-3">
            {reviewData.reviews.map(r => (
              <div key={r.id} className={`p-4 rounded-lg border ${user && r.user_id === user.id ? 'bg-brand-50/30 border-brand-100' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm text-gray-900 flex items-center gap-1.5">
                      {r.first_name} {r.last_name?.charAt(0)}.
                      {user && r.user_id === user.id && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full border border-brand-100">
                          You <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </p>
                    <StarRating rating={r.rating} />
                  </div>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Products ({products.length})</h2>
      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-12">This shop has no products yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      <ChatWidget shop={shop} />
    </div>
  );
}

export function Following() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.shops.following().then(setFollowing).finally(() => setLoading(false));
  }, [user]);

  const handleUnfollow = async (id) => {
    await api.shops.unfollow(id);
    setFollowing(prev => prev.filter(s => s.id !== id));
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}</div></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shops You Follow</h1>
      {following.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Not following any shops</h3>
          <p className="text-gray-500 mt-1">Follow shops to get updates on new products and deals.</p>
          <Link to="/shops" className="btn-primary mt-4 inline-block">Browse Shops</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {following.map(shop => (
            <div key={shop.id} className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                <Store className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex-1">
                <Link to={`/shops/${shop.id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                  {shop.company_name || `${shop.first_name}'s Shop`}
                </Link>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span>{shop.product_count} products</span>
                  <span>{shop.follower_count} followers</span>
                  <span>Followed {new Date(shop.followed_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => handleUnfollow(shop.id)}
                className="btn-secondary text-xs !px-3 !py-1.5 flex items-center gap-1">
                <HeartOff className="w-3 h-3" /> Unfollow
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
