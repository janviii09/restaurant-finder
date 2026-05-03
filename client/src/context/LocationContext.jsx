import { createContext, useContext, useEffect, useState } from 'react';

const LocationContext = createContext(null);

export const CAMPUSES = {
  'Sector 62': { lat: 28.6304, lng: 77.371 },
  'Sector 128': { lat: 28.5355, lng: 77.391 },
};

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null);
  const [state, setState] = useState('requesting');

  function getLocation() {
    if (!navigator.geolocation) {
      setState('fallback');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setState('granted');
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        if (err.code === 1) {
          setState('denied');
        } else {
          setState('fallback');
        }
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  }

  useEffect(() => {
    setState('requesting');
    getLocation();
  }, []);

  const chooseCampus = (campusName) => {
    const campus = CAMPUSES[campusName];
    if (!campus) return;
    setCoords(campus);
    setState('fallback');
  };

  return (
    <LocationContext.Provider
      value={{
        coords,
        state,
        setCoords,
        setState,
        getLocation,
        chooseCampus,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export default LocationContext;
