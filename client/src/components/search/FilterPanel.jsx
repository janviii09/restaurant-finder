import { CUISINE_OPTIONS } from '../../utils/constants';
import { useFilters } from '../../context/FilterContext';

export default function FilterPanel() {
  const { filters, dispatch } = useFilters();

  return (
    <div className="card p-5 space-y-5">
      <h3 className="font-display font-bold text-lg text-surface-800 dark:text-surface-100">
        Filters
      </h3>

      {/* Cuisine chips */}
      <div>
        <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-2">Cuisine</label>
        <div className="flex flex-wrap gap-1.5">
          {CUISINE_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => dispatch({ type: 'TOGGLE_CUISINE', payload: c })}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                filters.cuisine.includes(c)
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle filters */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: '🟢 Pure Veg', active: filters.pureVeg, action: 'TOGGLE_PURE_VEG' },
          { label: '🚴 Delivery', active: filters.hasDelivery, action: 'TOGGLE_DELIVERY' },
        ].map(({ label, active, action }) => (
          <button
            key={action}
            onClick={() => dispatch({ type: action })}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-center ${
              active
                ? 'bg-brand-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reset */}
      <button
        onClick={() => dispatch({ type: 'RESET_FILTERS' })}
        className="btn-secondary w-full text-xs"
      >
        Reset All Filters
      </button>
    </div>
  );
}
