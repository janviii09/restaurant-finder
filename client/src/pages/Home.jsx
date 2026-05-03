import { CAMPUSES, useLocation } from '../context/LocationContext';

export default function Home() {
  const { state, chooseCampus } = useLocation();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <section className="text-center space-y-3">
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-surface-900 dark:text-white">
          JIIT Food Finder
        </h1>
        <p className="text-surface-500 max-w-2xl mx-auto">
          Discover restaurants, cafes, and fast food around Sector 62 and Sector 128.
        </p>
        <a href="/search" className="btn-primary inline-flex mt-3">
          Start Exploring
        </a>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Current location mode</h2>
        <p className="text-surface-500 mt-1">{state}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {Object.keys(CAMPUSES).map((name) => (
            <button
              key={name}
              onClick={() => chooseCampus(name)}
              className="btn-secondary text-left"
            >
              Use {name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
