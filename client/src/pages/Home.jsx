import MapView from '../components/map/MapView';
import RadiusSlider from '../components/map/RadiusSlider';
import LocationButton from '../components/map/LocationButton';
import { useLocation } from '../context/LocationContext';

export default function Home() {
  const { userLocation, locationError } = useLocation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-3 animate-fade-in">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl
                      text-surface-900 dark:text-white leading-tight">
          Where can you eat{' '}
          <span className="text-brand-500">now</span>?
        </h1>
        <p className="text-surface-500 dark:text-surface-400 text-base sm:text-lg max-w-2xl mx-auto">
          Discover the best restaurants, cafés, and street food near JIIT Noida — 
          in under 3 taps.
        </p>
      </div>

      {/* Location error banner */}
      {locationError && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200
                      dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700
                      dark:text-amber-300 flex items-center gap-2 animate-slide-up">
          <span>⚠️</span>
          <span>{locationError}</span>
          <LocationButton />
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end animate-slide-up">
        <div className="flex-1">
          <RadiusSlider />
        </div>
        <div className="flex gap-2 sm:flex-shrink-0">
          <LocationButton />
        </div>
      </div>

      {/* Map */}
      <div className="animate-fade-in">
        <MapView />
      </div>

      {/* Quick Info Cards */}
      {!userLocation && !locationError && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          <div className="card p-5 text-center space-y-2">
            <span className="text-3xl">📍</span>
            <h3 className="font-semibold text-surface-800 dark:text-surface-100">
              Auto-Locate
            </h3>
            <p className="text-sm text-surface-500">
              We'll find your position and show nearby spots instantly.
            </p>
          </div>
          <div className="card p-5 text-center space-y-2">
            <span className="text-3xl">🔍</span>
            <h3 className="font-semibold text-surface-800 dark:text-surface-100">
              Smart Filters
            </h3>
            <p className="text-sm text-surface-500">
              Filter by cuisine, budget, veg/non-veg, delivery & dine-in.
            </p>
          </div>
          <div className="card p-5 text-center space-y-2">
            <span className="text-3xl">⭐</span>
            <h3 className="font-semibold text-surface-800 dark:text-surface-100">
              Real Reviews
            </h3>
            <p className="text-sm text-surface-500">
              See ratings from fellow JIIT students you can trust.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
