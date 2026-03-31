import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Shield, Users, ArrowRight, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Civic Tech for Better Cities
                </span>
                <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  {t('home.title')}
                </h1>
                <p className="mt-6 text-lg text-gray-500 sm:text-xl">
                  {t('home.subtitle')}
                </p>
                <div className="mt-10 sm:flex sm:justify-center lg:justify-start space-x-4">
                  <Link
                    to="/report"
                    className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-colors"
                  >
                    {t('home.get_started')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/issues"
                    className="flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-colors"
                  >
                    {t('home.view_issues')}
                  </Link>
                </div>
              </motion.div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md overflow-hidden"
              >
                <img
                  className="w-full"
                  src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                  alt="City infrastructure"
                />
                <div className="absolute inset-0 bg-blue-600 mix-blend-multiply opacity-10"></div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">{t('home.how_it_works')}</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('home.building_smarter')}
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-6">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('home.spot_title')}</h3>
              <p className="mt-4 text-gray-500">
                {t('home.spot_desc')}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('home.community_title')}</h3>
              <p className="mt-4 text-gray-500">
                {t('home.community_desc')}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('home.action_title')}</h3>
              <p className="mt-4 text-gray-500">
                {t('home.action_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex items-center space-x-4 p-6 rounded-xl bg-yellow-50 border border-yellow-100">
              <Clock className="h-10 w-10 text-yellow-600" />
              <div>
                <h4 className="font-bold text-yellow-900">{t('issues.status.pending')}</h4>
                <p className="text-sm text-yellow-700">{t('home.status_pending_desc')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-6 rounded-xl bg-blue-50 border border-blue-100">
              <AlertCircle className="h-10 w-10 text-blue-600" />
              <div>
                <h4 className="font-bold text-blue-900">{t('issues.status.in-progress')}</h4>
                <p className="text-sm text-blue-700">{t('home.status_progress_desc')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-6 rounded-xl bg-green-50 border border-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
              <div>
                <h4 className="font-bold text-green-900">{t('issues.status.resolved')}</h4>
                <p className="text-sm text-green-700">{t('home.status_resolved_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
