import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapPin, LogOut, User, PlusCircle, LayoutDashboard, List, Bell, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineStatus(true);
      const timer = setTimeout(() => setShowOnlineStatus(false), 5000);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">SmartCity</span>
            </Link>
            
            <div className="ml-4 flex items-center">
              {!isOnline && (
                <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter animate-pulse border border-red-200 shadow-sm">
                  <WifiOff className="h-3 w-3 mr-1.5" />
                  Offline Mode
                </div>
              )}
              {showOnlineStatus && (
                <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-green-200 shadow-sm animate-bounce">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                  Back Online
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/issues" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
              <List className="h-4 w-4 mr-1" />
              {t('nav.issues')}
            </Link>

            {user ? (
              <>
                <Link to="/report" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  {t('nav.report')}
                </Link>

                {user.role === "admin" && (
                  <Link to="/admin" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    {t('nav.admin')}
                  </Link>
                )}

                  <Link to="/profile" className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200 hover:text-blue-600 transition-colors">
                    <div className="flex items-center space-x-1 text-sm text-gray-700 hover:text-blue-600">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600 p-2 rounded-full transition-colors"
                    title={t('nav.logout')}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                  
                  <div className="ml-2 pl-2 border-l border-gray-200">
                    <NotificationBell />
                  </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
            
            <div className="ml-4 pl-4 border-l border-gray-200">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
