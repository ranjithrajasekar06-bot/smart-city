import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { User, Mail, Shield, Calendar, List, AlertCircle, Loader2, Clock, Activity, CheckCircle, ChevronRight } from "lucide-react";
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
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 h-24 md:h-32 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>
            <div className="px-6 pb-8">
              <div className="relative -mt-12 md:-mt-16 mb-6 flex justify-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="h-24 w-24 md:h-32 md:w-32 rounded-[2rem] bg-white p-1.5 shadow-2xl shadow-blue-200/50"
                >
                  <div className="h-full w-full rounded-[1.75rem] bg-blue-50 flex items-center justify-center border-2 border-blue-100">
                    <User className="h-12 w-12 md:h-16 md:w-16 text-blue-600" />
                  </div>
                </motion.div>
              </div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h2>
                <div className="inline-flex items-center mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  <Shield className="h-3 w-3 mr-1.5" />
                  {t(`nav.${user.role}`)}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-slate-600 text-sm p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:shadow-slate-100">
                  <div className="p-2 bg-white rounded-xl shadow-sm mr-4">
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="font-medium truncate">{user.email}</span>
                </div>
                <div className="flex items-center text-slate-600 text-sm p-3 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:shadow-slate-100">
                  <div className="p-2 bg-white rounded-xl shadow-sm mr-4">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                  </div>
                  <span className="font-medium">
                    {user.createdAt 
                      ? t('profile.joined', { date: new Date(user.createdAt).toLocaleDateString() }) 
                      : t('profile.joined_recently')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">{t('profile.account_stats')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-blue-50 p-5 rounded-2xl text-center border border-blue-100 shadow-sm"
              >
                <div className="text-3xl font-black text-blue-600 mb-1">{userIssues.length}</div>
                <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{t('profile.reports')}</div>
              </motion.div>
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-green-50 p-5 rounded-2xl text-center border border-green-100 shadow-sm"
              >
                <div className="text-3xl font-black text-green-600 mb-1">
                  {userIssues.filter(i => i.status === 'resolved').length}
                </div>
                <div className="text-[10px] text-green-500 font-black uppercase tracking-widest">{t('profile.resolved')}</div>
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
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px]">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center">
                <div className="p-3 bg-blue-600 rounded-2xl mr-4 shadow-lg shadow-blue-200">
                  <List className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('profile.your_issues')}</h2>
                  <p className="text-xs text-slate-500 font-medium">{t('profile.total')}: {userIssues.length}</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse border border-slate-100"></div>
                    ))}
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center text-red-700 font-medium"
                  >
                    <AlertCircle className="h-6 w-6 mr-4 text-red-500" />
                    {error}
                  </motion.div>
                ) : userIssues.length === 0 ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                  >
                    <div className="bg-slate-50 h-24 w-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                      <List className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{t('profile.no_issues')}</h3>
                    <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">{t('profile.no_issues_desc')}</p>
                    <Link
                      to="/report"
                      className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
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
                          className="group p-5 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-default"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center flex-1 min-w-0">
                              <div className={`p-3 rounded-xl mr-5 ${config.color.split(' ')[0]} transition-all group-hover:bg-white group-hover:shadow-md group-hover:scale-110`}>
                                <StatusIcon className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link to={`/issues/${issue._id}`} className="block">
                                  <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate tracking-tight">
                                    {issue.title}
                                  </h4>
                                </Link>
                                <div className="flex flex-wrap items-center mt-1.5 gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{t(`issues.category.${issue.category}`)}</span>
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(issue.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end sm:w-auto">
                              <div className={`flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${config.color}`}>
                                <span className={`h-2 w-2 rounded-full ${config.dot} mr-2 animate-pulse`}></span>
                                {config.label}
                              </div>
                              <Link 
                                to={`/issues/${issue._id}`}
                                className="sm:hidden p-2 bg-slate-100 text-slate-400 rounded-xl"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </Link>
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
