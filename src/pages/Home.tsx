import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Shield, Users, ArrowRight, CheckCircle, Clock, AlertCircle, ChevronRight, ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { toast } from "sonner";
import IssueCard, { Issue } from "../components/IssueCard";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentIssues = async () => {
      try {
        const { data } = await api.get("/issues?limit=3&sort=latest");
        setRecentIssues(data.slice(0, 3));
      } catch (error: any) {
        console.error("Error fetching recent issues:", error);
        const message = error.message || (error.isStarting ? "The server is starting up. Please wait a moment and try again." : "Failed to fetch recent issues.");
        toast.error(message);
      } finally {
        setLoadingIssues(false);
      }
    };
    fetchRecentIssues();
  }, []);

  const handleVote = async (e: React.MouseEvent, issueId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error(t('auth.login_required_vote') || "Please login to vote");
      return navigate("/login");
    }

    setVotingId(issueId);
    try {
      await api.post(`/issues/${issueId}/vote`);
      setRecentIssues(prev => prev.map(issue => 
        issue._id === issueId ? { ...issue, votes: issue.votes + 1 } : issue
      ));
      toast.success(t('details.vote_success') || "Vote added successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to vote");
    } finally {
      setVotingId(null);
    }
  };

  const handleReportDuplicate = async (issueId: string) => {
    if (!user) {
      toast.error("Please login to report duplicates");
      return navigate("/login");
    }

    try {
      await api.post(`/issues/${issueId}/report-duplicate`);
      toast.success("Issue reported as duplicate. Our team will review it.");
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.info("Duplicate report submitted (Demo Mode)");
      } else {
        toast.error(err.response?.data?.message || "Failed to report duplicate");
      }
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white pt-12 pb-20 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30" />
          <div className="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
          <div className="bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="text-center lg:text-left lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-200 mb-6">
                  {t('home.civic_tech')}
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-7xl tracking-tight font-black text-slate-900 leading-[1.1]">
                  {t('home.title').split(' ').map((word, i) => (
                    <span key={i} className={i === 1 ? "text-blue-600" : ""}>{word} </span>
                  ))}
                </h1>
                <p className="mt-6 md:mt-8 text-lg md:text-2xl text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {t('home.subtitle')}
                </p>
                <div className="mt-10 md:mt-12 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                  <Link
                    to="/report"
                    className="flex items-center justify-center px-8 md:px-10 py-4 md:py-5 text-base md:text-lg font-black rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 group"
                  >
                    {t('home.get_started')}
                    <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/issues"
                    className="flex items-center justify-center px-8 md:px-10 py-4 md:py-5 text-base md:text-lg font-black rounded-2xl text-slate-700 bg-white border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    {t('home.view_issues')}
                  </Link>
                </div>
              </motion.div>
            </div>
            <div className="mt-16 lg:mt-0 lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="relative max-w-lg mx-auto lg:max-w-none"
              >
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2.5rem] opacity-20 blur-2xl animate-pulse" />
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white">
                  <img
                    className="w-full h-[300px] md:h-[500px] object-cover"
                    src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                    alt="City infrastructure"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
                      <p className="text-white font-bold text-sm md:text-lg">Empowering citizens to build better cities together.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-slate-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: "Issues Resolved", value: "1,284", icon: CheckCircle, color: "text-green-400" },
              { label: "Active Citizens", value: "5,420", icon: Users, color: "text-blue-400" },
              { label: "Avg. Response Time", value: "24h", icon: Clock, color: "text-yellow-400" },
              { label: "Cities Covered", value: "12", icon: MapPin, color: "text-purple-400" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className={`h-6 w-6 md:h-8 md:w-8 mx-auto mb-3 md:mb-4 ${stat.color}`} />
                <p className="text-2xl md:text-4xl font-black text-white mb-1 md:mb-2">{stat.value}</p>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-blue-600 font-black uppercase tracking-widest text-sm mb-4">{t('home.how_it_works')}</h2>
            <p className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
              {t('home.building_smarter')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: t('home.spot_title'), desc: t('home.spot_desc'), icon: MapPin, color: "bg-blue-100 text-blue-600" },
              { title: t('home.community_title'), desc: t('home.community_desc'), icon: Users, color: "bg-purple-100 text-purple-600" },
              { title: t('home.action_title'), desc: t('home.action_desc'), icon: Shield, color: "bg-green-100 text-green-600" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-100 transition-all duration-300"
              >
                <div className={`flex items-center justify-center h-16 w-16 rounded-2xl ${feature.color} mb-8 shadow-inner`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Issues Section */}
      <div className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-16">
            <div>
              <h2 className="text-blue-600 font-black uppercase tracking-widest text-sm mb-4">Latest Reports</h2>
              <p className="text-4xl font-black text-slate-900">Recent Community Issues</p>
            </div>
            <Link to="/issues" className="hidden sm:flex items-center text-blue-600 font-black hover:text-blue-700 transition-colors group">
              View All Issues
              <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingIssues ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-100 animate-pulse h-96 rounded-[2.5rem]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentIssues.map((issue) => (
                <IssueCard
                  key={issue._id}
                  issue={issue as any}
                  onVote={handleVote}
                  votingId={votingId}
                  onReportDuplicate={handleReportDuplicate}
                />
              ))}
            </div>
          )}
          
          <div className="mt-12 sm:hidden text-center">
            <Link to="/issues" className="inline-flex items-center text-blue-600 font-black hover:text-blue-700 transition-colors group">
              View All Issues
              <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-slate-400 font-black uppercase tracking-widest text-xs mb-2">Transparency</h2>
            <p className="text-3xl font-black text-slate-900">Issue Lifecycle</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { status: "pending", icon: Clock, color: "bg-yellow-50 text-yellow-600 border-yellow-100", desc: t('home.status_pending_desc') },
              { status: "in-progress", icon: AlertCircle, color: "bg-blue-50 text-blue-600 border-blue-100", desc: t('home.status_progress_desc') },
              { status: "resolved", icon: CheckCircle, color: "bg-green-50 text-green-600 border-green-100", desc: t('home.status_resolved_desc') },
            ].map((item, i) => (
              <div key={i} className={`flex flex-col items-center text-center p-10 rounded-[2.5rem] border ${item.color} shadow-sm`}>
                <item.icon className="h-12 w-12 mb-6" />
                <h4 className="text-xl font-black mb-2 uppercase tracking-tight">{t(`issues.status.${item.status}`)}</h4>
                <p className="text-sm font-medium opacity-80 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
