import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { FilterProvider } from './context/FilterContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';

function AppContent() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Phase 3+ routes will be added here */}
            {/* <Route path="/search" element={<Search />} /> */}
            {/* <Route path="/restaurant/:slug" element={<RestaurantDetail />} /> */}
            {/* <Route path="/login" element={<Login />} /> */}
            {/* <Route path="/register" element={<Register />} /> */}
            {/* <Route path="/profile" element={<Profile />} /> */}
            {/* <Route path="/add-restaurant" element={<AddRestaurant />} /> */}
            {/* <Route path="/admin" element={<AdminDashboard />} /> */}

            {/* 404 catch-all */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  <span className="text-6xl mb-4">🍽️</span>
                  <h2 className="font-display font-bold text-2xl text-surface-800 dark:text-surface-100">
                    Page Not Found
                  </h2>
                  <p className="text-surface-500 mt-2 mb-6">
                    This page doesn't exist. Let's get you back to finding food!
                  </p>
                  <a href="/" className="btn-primary">
                    ← Back to Home
                  </a>
                </div>
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-surface-200 dark:border-surface-800 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-surface-400">
            <p>
              🍽️ <span className="font-semibold">Restaurant Finder</span> — Made for JIIT Noida students
            </p>
            <p className="mt-1 text-xs">
              Sectors 62, 128 &amp; nearby · Open-source · Built with ❤️
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <FilterProvider>
            <AppContent />
          </FilterProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
