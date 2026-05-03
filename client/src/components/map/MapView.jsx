import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';
import { useLocation } from '../../context/LocationContext';
import { useFilters } from '../../context/FilterContext';
import { fetchNearbyRestaurants } from '../../services/restaurantService';

// ─── Fix Leaflet default icon paths (Vite issue) ──────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom user location icon
const userIcon = new L.DivIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
      <div class="absolute w-8 h-8 bg-blue-400/30 rounded-full animate-ping"></div>
    </div>
  `,
  className: 'user-location-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Custom restaurant icon
const restaurantIcon = new L.DivIcon({
  html: `
    <div class="flex items-center justify-center w-8 h-8 bg-brand-500 rounded-full border-2 border-white shadow-lg text-white text-sm">
      🍽️
    </div>
  `,
  className: 'restaurant-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// ─── Sub-component: fly map to user location ──────────────────────
function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

// ─── Main Map Component ───────────────────────────────────────────
export default function MapView() {
  const { userLocation, isLocating } = useLocation();
  const { filters } = useFilters();
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // JIIT Sector 62 as default center
  const defaultCenter = [28.6285, 77.3640];

  const center = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    return defaultCenter;
  }, [userLocation]);

  // Fetch nearby restaurants when location or filters change
  useEffect(() => {
    if (!userLocation) return;

    const loadRestaurants = async () => {
      setIsLoading(true);
      try {
        const data = await fetchNearbyRestaurants(
          userLocation.lat,
          userLocation.lng,
          filters.radius,
          {
            cuisine: filters.cuisine.join(','),
            maxCost: filters.maxCost,
            pureVeg: filters.pureVeg || undefined,
            hasDelivery: filters.hasDelivery || undefined,
            hasSeating: filters.hasSeating || undefined,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            q: filters.query || undefined,
          }
        );
        setRestaurants(data);
      } catch (err) {
        console.error('Failed to fetch restaurants:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, [userLocation, filters]);

  return (
    <div className="relative w-full">
      {/* Loading overlay */}
      {(isLoading || isLocating) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            {isLocating ? 'Finding your location...' : 'Loading restaurants...'}
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        className="h-[70vh] w-full rounded-2xl shadow-xl z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToUser position={userLocation ? [userLocation.lat, userLocation.lng] : null} />

        {/* User location marker */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold text-surface-900">📍 You are here</p>
                  <p className="text-xs text-surface-500 mt-1">
                    Accuracy: ~{Math.round(userLocation.accuracy)}m
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Radius circle */}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={filters.radius}
              pathOptions={{
                color: '#ff2d3f',
                fillColor: '#ff2d3f',
                fillOpacity: 0.06,
                weight: 1.5,
                dashArray: '6 4',
              }}
            />
          </>
        )}

        {/* Restaurant markers with clustering */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {restaurants.map((restaurant) => (
            <Marker
              key={restaurant._id}
              position={[
                restaurant.location.coordinates[1], // lat
                restaurant.location.coordinates[0], // lng
              ]}
              icon={restaurantIcon}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-surface-900 text-base leading-tight">
                    {restaurant.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1.5 text-sm">
                    <span className="flex items-center gap-0.5 text-amber-500">
                      ⭐ {restaurant.avgRating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="text-surface-400">·</span>
                    <span className="text-surface-600">
                      ₹{restaurant.costForTwo || '–'} for two
                    </span>
                  </div>

                  {restaurant.cuisine?.length > 0 && (
                    <p className="text-xs text-surface-500 mt-1">
                      {restaurant.cuisine.slice(0, 3).join(', ')}
                    </p>
                  )}

                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {restaurant.pureVeg && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                        🟢 Pure Veg
                      </span>
                    )}
                    {restaurant.hasDelivery && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                        🚴 Delivery
                      </span>
                    )}
                    {restaurant.hasSeating && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                        🪑 Dine-in
                      </span>
                    )}
                  </div>

                  <a
                    href={`/restaurant/${restaurant.slug}`}
                    className="inline-block mt-2 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
                  >
                    View Details →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Restaurant count badge */}
      {!isLoading && restaurants.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <div className="glass px-3 py-1.5 rounded-xl text-sm font-medium">
            🍽️ {restaurants.length} place{restaurants.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}
    </div>
  );
}
