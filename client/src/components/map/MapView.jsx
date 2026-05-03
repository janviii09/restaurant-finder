import { useLocation } from '../../context/LocationContext';

export default function MapView() {
  const { coords, state } = useLocation();

  if (!coords) {
    return (
      <div className="card p-6 text-center text-surface-500">
        Waiting for location ({state})
      </div>
    );
  }

  return (
    <div className="card p-6 text-center">
      <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Selected location</h3>
      <p className="text-surface-500 mt-2">
        Lat: {coords.lat.toFixed(5)} | Lng: {coords.lng.toFixed(5)}
      </p>
      <a
        className="text-brand-600 dark:text-brand-300 hover:underline mt-3 inline-block"
        href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=15/${coords.lat}/${coords.lng}`}
        target="_blank"
        rel="noreferrer"
      >
        Open map
      </a>
    </div>
  );
}
