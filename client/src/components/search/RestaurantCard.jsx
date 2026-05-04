import { useState } from 'react';
import OpeningHoursParser from 'opening_hours';
import ReviewSection from '../reviews/ReviewSection';

function titleCase(value) {
  return String(value)
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function categoryLabel(category) {
  const value = String(category || '');
  if (value === 'catering.restaurant') return 'Restaurant';
  if (value === 'catering.cafe') return 'Café';
  if (value === 'catering.fast_food') return 'Fast Food';
  if (value === 'catering.food_court') return 'Food Court';
  if (value === 'catering.street_food') return 'Street Food';
  return titleCase(value.replace(/^catering\./, ''));
}

function normalizeDecision(value) {
  if (!value) return null;
  return ['yes', 'only'].includes(String(value).toLowerCase());
}

function renderStars(rating) {
  const normalized = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return Array.from({ length: 5 }, (_, index) => (index < normalized ? '★' : '☆')).join('');
}

function parseOpeningState(raw) {
  if (!raw) return null;
  try {
    const parser = new OpeningHoursParser(raw);
    const isOpen = parser.getState(new Date());
    return isOpen ? 'Open now' : 'Closed';
  } catch {
    return null;
  }
}

function ActionButton({ onClick, label, bookmarked }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
      type="button"
    >
      {bookmarked ? '★' : '☆'} {label}
    </button>
  );
}

export default function RestaurantCard({
  restaurant,
  bookmarked = false,
  onToggleBookmark,
  onRemove,
  showBookmarkButton = true,
}) {
  const [showReviews, setShowReviews] = useState(false);
  
  const categories = Array.isArray(restaurant.allCategories) ? restaurant.allCategories : [];
  const openingState = parseOpeningState(restaurant.openingHours?.raw);
  const primaryAddress = restaurant.address?.full || null;
  const secondaryAddressParts = [restaurant.address?.suburb, restaurant.address?.city].filter(Boolean);
  const cuisine = restaurant.cuisine ? titleCase(String(restaurant.cuisine).replace(/_/g, ' ')) : null;
  const diet = restaurant.diet ? titleCase(String(restaurant.diet).replace(/_/g, ' ')) : null;
  const isTakeaway = normalizeDecision(restaurant.takeaway);
  const isDelivery = normalizeDecision(restaurant.delivery);
  const isDineIn = normalizeDecision(restaurant.dineIn);
  const isOutdoor = normalizeDecision(restaurant.outdoor);
  const isWheelchair = normalizeDecision(restaurant.wheelchair);
  const rating = restaurant.rating;
  const reviewCount = restaurant.reviewCount;
  const chipClassName = 'inline-flex items-center rounded-full bg-surface-100 dark:bg-surface-700 px-2.5 py-1 text-xs font-medium text-surface-600 dark:text-surface-200';

  return (
    <article className="card p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-white leading-tight">
            {restaurant.name}
          </h3>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center rounded-full bg-surface-100 dark:bg-surface-700 px-2.5 py-1 text-xs font-medium text-surface-600 dark:text-surface-200"
                >
                  {categoryLabel(category)}
                </span>
              ))}
            </div>
          )}
        </div>

        {showBookmarkButton ? (
          <button
            onClick={() => onToggleBookmark?.(restaurant)}
            className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
            type="button"
          >
            {bookmarked ? '★' : '☆'} Bookmark
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onRemove?.(restaurant)}
            className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {primaryAddress && (
        <div className="space-y-1 text-sm text-surface-600 dark:text-surface-300">
          <p className="font-medium text-surface-700 dark:text-surface-200">{primaryAddress}</p>
          {secondaryAddressParts.length > 0 && (
            <p>{secondaryAddressParts.join(', ')}</p>
          )}
        </div>
      )}

      {restaurant.openingHours?.raw && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span>🕒</span>
            {openingState ? (
              <span className={openingState === 'Open now' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                {openingState}
              </span>
            ) : (
              <span className="text-surface-500">{restaurant.openingHours.raw}</span>
            )}
          </div>
          {restaurant.openingHours.weekday && (
            <p className="text-surface-500">Weekdays: {restaurant.openingHours.weekday}</p>
          )}
          {restaurant.openingHours.weekend && (
            <p className="text-surface-500">Weekends: {restaurant.openingHours.weekend}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {cuisine && <span className={chipClassName}>Cuisine: {cuisine}</span>}
        {diet && <span className={chipClassName}>Diet: {diet}</span>}
        {isTakeaway && <span className={chipClassName}>Takeaway available</span>}
        {isDelivery && <span className={chipClassName}>Delivery available</span>}
        {isDineIn && <span className={chipClassName}>Dine-in</span>}
        {isOutdoor && <span className={chipClassName}>Outdoor seating</span>}
        {isWheelchair && <span className={chipClassName}>Wheelchair accessible</span>}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {restaurant.phone && (
          <a href={`tel:${restaurant.phone}`} className="text-brand-600 dark:text-brand-300 hover:underline">
            {restaurant.phone}
          </a>
        )}
        {restaurant.website && (
          <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-300 hover:underline">
            Visit website
          </a>
        )}
        {restaurant.email && (
          <a href={`mailto:${restaurant.email}`} className="text-brand-600 dark:text-brand-300 hover:underline">
            {restaurant.email}
          </a>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        {rating !== null && rating !== undefined ? (
          <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
            <span className="text-amber-500">{renderStars(rating)}</span>
            <span>{Number(rating).toFixed(1)}</span>
            {reviewCount !== null && reviewCount !== undefined && <span>({reviewCount} reviews)</span>}
          </div>
        ) : (
          <div></div>
        )}
        <button 
          onClick={() => setShowReviews(!showReviews)}
          className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline px-2 py-1 bg-brand-50 dark:bg-brand-900/20 rounded-lg transition-colors"
        >
          {showReviews ? 'Hide Reviews' : 'Show Reviews'}
        </button>
      </div>

      {showReviews && <ReviewSection restaurantId={restaurant.geoapifyId || restaurant._id || restaurant.id} />}
    </article>
  );
}
