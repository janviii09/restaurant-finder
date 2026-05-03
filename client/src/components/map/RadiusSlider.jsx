import { useFilters } from '../../context/FilterContext';
import { MIN_RADIUS, MAX_RADIUS } from '../../utils/constants';

export default function RadiusSlider() {
  const { filters, dispatch } = useFilters();

  const handleChange = (e) => {
    dispatch({ type: 'SET_RADIUS', payload: Number(e.target.value) });
  };

  const formatRadius = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters} m`;
  };

  return (
    <div className="glass rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="radius-slider"
          className="text-sm font-semibold text-surface-700 dark:text-surface-200"
        >
          Search Radius
        </label>
        <span className="text-sm font-bold text-brand-500">
          {formatRadius(filters.radius)}
        </span>
      </div>

      <input
        id="radius-slider"
        type="range"
        min={MIN_RADIUS}
        max={MAX_RADIUS}
        step={500}
        value={filters.radius}
        onChange={handleChange}
        className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full
                   appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-5
                   [&::-webkit-slider-thumb]:h-5
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-brand-500
                   [&::-webkit-slider-thumb]:shadow-md
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:transition-transform
                   [&::-webkit-slider-thumb]:hover:scale-110"
      />

      <div className="flex justify-between text-[10px] text-surface-400 mt-1">
        <span>{(MIN_RADIUS / 1000).toFixed(0)}km</span>
        <span>{((MIN_RADIUS + MAX_RADIUS) / 2 / 1000).toFixed(1)}km</span>
        <span>{(MAX_RADIUS / 1000).toFixed(0)}km</span>
      </div>
    </div>
  );
}
