import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { User, Mail, Shield, Calendar, List, AlertCircle, Loader2, Clock, Activity, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

interface Issue {
  _id: string;
  title: string;
  category: string;
  status: "pending" | "in-progress" | "resolved" | "rejected";
  createdAt: string;
}

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("Profile: Component mounted. User from context:", user);
  }, [user]);

  useEffect(() => {
    const fetchUserIssues = async (retryCount = 0) => {
      if (!user?._id) return;
      try {
        const { data } = await api.get(`/issues?user_id=${user._id}`);
        if (Array.isArray(data)) {
          setUserIssues(data);
        } else {
          console.error("Profile: Fetched issues data is not an array:", data);
          setUserIssues([]);
        }
      } catch (err: any) {
        if (err.isStarting && retryCount < 10) {
          console.log(`Profile: Server starting, retrying in 3s (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchUserIssues(retryCount + 1), 3000);
          return;
        }
        console.error("Error fetching user issues:", err);
        setError(t('profile.error_load'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserIssues();
  }, [user?._id]);

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">{t('profile.authenticating')}</p>
        </motion.div>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      dot: "bg-yellow-500",
      icon: Clock,
      label: t('issues.status.pending')
    },
    "in-progress": {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      dot: "bg-blue-500",
      icon: Activity,
      label: t('issues.status.in-progress')
    },
    resolved: {
      color: "bg-green-100 text-green-800 border-green-200",
      dot: "bg-green-500",
      icon: CheckCircle,
      label: t('issues.status.resolved')
    },
    rejected: {
      color: "bg-red-100 text-red-800 border-red-200",
      dot: "bg-red-500",
      icon: AlertCircle,
      label: t('issues.status.rejected')
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-24"></div>
            <div className="px-6 pb-6">
              <div className="relative -mt-12 mb-4">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="h-24 w-24 rounded-2xl bg-white p-1 shadow-md mx-auto"
                >
                  <div className="h-full w-full rounded-xl bg-blue-50 flex items-center justify-center">
                    <User className="h-12 w-12 text-blue-600" />
                  </div>
                </motion.div>
              </div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{t(`nav.${user.role}`)}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center text-gray-600 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Mail className="h-4 w-4 mr-3 text-gray-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Shield className="h-4 w-4 mr-3 text-gray-400" />
                  <span className="capitalize">{t('profile.account_type', { role: t(`nav.${user.role}`) })}</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                  <span>
                    {user.createdAt 
                      ? t('profile.joined', { date: new Date(user.createdAt).toLocaleDateString() }) 
                      : t('profile.joined_recently')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t('profile.account_stats')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100"
              >
                <div className="text-2xl font-bold text-blue-600">{userIssues.length}</div>
                <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">{t('profile.reports')}</div>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-green-50 p-4 rounded-xl text-center border border-green-100"
              >
                <div className="text-2xl font-bold text-green-600">
                  {userIssues.filter(i => i.status === 'resolved').length}
                </div>
                <div className="text-[10px] text-green-600 font-semibold uppercase tracking-wider">{t('profile.resolved')}</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* User Activity Main */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <List className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="font-bold text-gray-900">{t('profile.your_issues')}</h2>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {userIssues.length} {t('profile.total')}
              </span>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse border border-gray-100"></div>
                    ))}
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center text-red-700"
                  >
                    <AlertCircle className="h-5 w-5 mr-3" />
                    {error}
                  </motion.div>
                ) : userIssues.length === 0 ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <List className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('profile.no_issues')}</h3>
                    <p className="text-gray-500 mb-6">{t('profile.no_issues_desc')}</p>
                    <Link
                      to="/report"
                      className="inline-flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                    >
                      {t('profile.report_first')}
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {userIssues.map((issue, index) => {
                      const config = statusConfig[issue.status];
                      const StatusIcon = config.icon;
                      
                      return (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={issue._id}
                          className="group p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-default"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1 min-w-0 mr-4">
                              <div className={`p-2 rounded-lg mr-4 ${config.color.split(' ')[0]} transition-colors group-hover:bg-white`}>
                                <StatusIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link to={`/issues/${issue._id}`} className="block">
                                  <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                    {issue.title}
                                  </h4>
                                </Link>
                                <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                                  <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-md">{t(`issues.category.${issue.category}`)}</span>
                                  <span>•</span>
                                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <div className={`flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.color}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${config.dot} mr-2 animate-pulse`}></span>
                                {config.label}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
