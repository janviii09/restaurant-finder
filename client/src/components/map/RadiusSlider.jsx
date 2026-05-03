import { useFilters } from '../../context/FilterContext';

const radiusSteps = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000];

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
        min={500}
        max={5000}
        step={100}
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
        <span>500m</span>
        <span>2.5km</span>
        <span>5km</span>
      </div>
    </div>
  );
}
