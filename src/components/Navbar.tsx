import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapPin, LogOut, User, PlusCircle, LayoutDashboard, List, Bell, WifiOff, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-black text-slate-900 tracking-tight">Smart<span className="text-blue-600">City</span></span>
            </Link>
            
            <div className="ml-8 flex items-center">
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

          <div className="hidden md:flex items-center space-x-1">
            <Link to="/issues" className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-all hover:bg-blue-50">
              <List className="h-4 w-4 mr-2" />
              {t('nav.issues')}
            </Link>

            {user ? (
              <>
                <Link to="/report" className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-all hover:bg-blue-50">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {t('nav.report')}
                </Link>

                {user.role === "admin" && (
                  <Link to="/admin" className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-all hover:bg-blue-50">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {t('nav.admin')}
                  </Link>
                )}

                <div className="h-8 w-px bg-slate-200 mx-2" />

                <Link to="/profile" className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs border-2 border-white shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-sm text-slate-700 hidden md:block">{user.name}</span>
                </Link>
                
                <div className="flex items-center space-x-1">
                  <NotificationBell />
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-600 p-2.5 rounded-xl transition-all hover:bg-red-50"
                    title={t('nav.logout')}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-slate-600 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-blue-50">
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
            
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <NotificationBell />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
          <div className="px-4 pt-4 pb-8 space-y-3">
            <Link
              to="/issues"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-4 p-5 rounded-3xl bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-blue-500 transition-colors">
                <List className="h-5 w-5 text-blue-600" />
              </div>
              <span>{t('nav.issues')}</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/report"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-4 p-5 rounded-3xl bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <PlusCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <span>{t('nav.report')}</span>
                </Link>

                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-4 p-5 rounded-3xl bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <LayoutDashboard className="h-5 w-5 text-blue-600" />
                    </div>
                    <span>{t('nav.admin')}</span>
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-4 p-5 rounded-3xl bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs border-2 border-white shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                </Link>

                <div className="flex flex-col space-y-3 p-2">
                  <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <LanguageSwitcher />
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-center space-x-3 p-5 rounded-3xl bg-red-50 text-red-600 font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 p-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center p-5 rounded-3xl bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-xs hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm active:scale-95 border border-slate-100"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center p-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 active:scale-95"
                >
                  {t('nav.register')}
                </Link>
                <div className="flex justify-center pt-4">
                  <LanguageSwitcher />
                </div>
              </div>
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
