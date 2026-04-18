import { Star } from 'lucide-react';

export default function StarRating({ rating, count, size = 'sm', interactive = false, onChange }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          >
            <Star
              className={`${sizeClass} ${
                star <= Math.round(rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : star - 0.5 <= rating
                  ? 'fill-yellow-200 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
      {rating > 0 && <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="text-sm text-gray-400">({count.toLocaleString()})</span>}
    </div>
  );
}
