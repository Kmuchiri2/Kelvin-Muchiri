
import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import PublicDashboard from './components/PublicDashboard';
import ManagementLogin from './components/ManagementLogin';
import ManagementDashboard from './components/ManagementDashboard';

const Header: React.FC<{ onLogout: () => void; isAuthenticated: boolean }> = ({ onLogout, isAuthenticated }) => {
    const location = useLocation();

    const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
        const isActive = location.pathname === to;
        return (
            <Link to={to} className={`px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                {children}
            </Link>
        );
    };

    return (
        <nav className="bg-slate-800 dark:bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <span className="text-white text-lg font-semibold">BLOOM STUDIOS KENYA</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <NavLink to="/">Public</NavLink>
                        <NavLink to="/management">Management</NavLink>
                        {isAuthenticated && (
                            <button onClick={onLogout} className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white">
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');

  const handleLoginSuccess = useCallback((newPin: string) => {
    setPin(newPin);
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setPin('');
    setIsAuthenticated(false);
  }, []);

  return (
    <HashRouter>
        <Header onLogout={handleLogout} isAuthenticated={isAuthenticated} />
        <main className="p-4 sm:p-6 lg:p-8">
            <Routes>
                <Route path="/" element={<PublicDashboard />} />
                <Route
                    path="/management"
                    element={
                        isAuthenticated ? (
                            <ManagementDashboard pin={pin} onLogout={handleLogout} />
                        ) : (
                            <ManagementLogin onLoginSuccess={handleLoginSuccess} />
                        )
                    }
                />
            </Routes>
        </main>
    </HashRouter>
  );
}

export default App;