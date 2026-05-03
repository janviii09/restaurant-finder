import { useLocation } from '../../context/LocationContext';

export default function LocationButton() {
  const { coords, state, getLocation, setState } = useLocation();

  const isLocating = state === 'requesting';

  return (
    <button
      id="btn-locate-me"
      onClick={() => {
        setState('requesting');
        getLocation();
      }}
      disabled={isLocating}
      className="btn-primary gap-2 text-sm"
      title={state === 'denied' ? 'Location denied' : 'Locate me'}
    >
      {isLocating ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Locating...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          {coords ? 'Re-locate' : 'Find Me'}
        </>
      )}
    </button>
  );
}
