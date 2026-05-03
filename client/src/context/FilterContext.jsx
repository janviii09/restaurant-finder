import { createContext, useContext, useReducer } from 'react';

const FilterContext = createContext(null);

const initialFilters = {
  query: '',
  radius: 2000,           // meters (default 2 km)
  cuisine: [],             // e.g. ['North Indian', 'Chinese']
  maxCost: null,           // max cost for two
  pureVeg: false,
  hasDelivery: false,
  hasSeating: false,
  sortBy: 'distance',      // 'distance' | 'rating' | 'costForTwo'
  sortOrder: 'asc',        // 'asc' | 'desc'
};

function filterReducer(state, action) {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_RADIUS':
      return { ...state, radius: action.payload };
    case 'TOGGLE_CUISINE': {
      const cuisine = state.cuisine.includes(action.payload)
        ? state.cuisine.filter((c) => c !== action.payload)
        : [...state.cuisine, action.payload];
      return { ...state, cuisine };
    }
    case 'SET_MAX_COST':
      return { ...state, maxCost: action.payload };
    case 'TOGGLE_PURE_VEG':
      return { ...state, pureVeg: !state.pureVeg };
    case 'TOGGLE_DELIVERY':
      return { ...state, hasDelivery: !state.hasDelivery };
    case 'TOGGLE_SEATING':
      return { ...state, hasSeating: !state.hasSeating };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
    case 'RESET_FILTERS':
      return { ...initialFilters };
    default:
      return state;
  }
}

export function FilterProvider({ children }) {
  const [filters, dispatch] = useReducer(filterReducer, initialFilters);

  return (
    <FilterContext.Provider value={{ filters, dispatch }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

export default FilterContext;
