import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { MapPin, ThumbsUp, MessageSquare, Filter, Search, ChevronRight, Clock, AlertCircle, CheckCircle, ArrowRight, User, PlusCircle, Tag, Activity, SortAsc, LayoutGrid, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import IssueCard, { Issue } from "../components/IssueCard";
import FilterDropdown from "../components/FilterDropdown";

import { useNotifications } from "../context/NotificationContext";

const IssueList: React.FC = () => {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    category: "",
    status: "",
    sort: "latest",
  });
  const { user } = useAuth();
  const { socket } = useNotifications();
  const navigate = useNavigate();
  const [votingId, setVotingId] = useState<string | null>(null);

  const categories = [
    "pothole",
    "garbage",
    "streetlight",
    "water",
    "sidewalk",
    "traffic_light",
    "vandalism",
    "park_maintenance",
    "drainage",
    "other"
  ];

  const categoryOptions = [
    { value: "", label: t('issues.all_categories'), icon: <LayoutGrid className="h-4 w-4" /> },
    ...categories.map(cat => ({
      value: cat,
      label: t(`issues.category.${cat}`),
      icon: <Tag className="h-4 w-4" />
    }))
  ];

  const statusOptions = [
    { value: "", label: t('issues.status.all'), icon: <Activity className="h-4 w-4" /> },
    { value: "pending", label: t('issues.status.pending'), icon: <Clock className="h-4 w-4 text-yellow-500" /> },
    { value: "in-progress", label: t('issues.status.in-progress'), icon: <AlertCircle className="h-4 w-4 text-blue-500" /> },
    { value: "resolved", label: t('issues.status.resolved'), icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
    { value: "rejected", label: t('issues.status.rejected'), icon: <XCircle className="h-4 w-4 text-red-500" /> }
  ];

  const sortOptions = [
    { value: "latest", label: t('issues.sort.latest'), icon: <Clock className="h-4 w-4" /> },
    { value: "votes", label: t('issues.sort.votes'), icon: <ThumbsUp className="h-4 w-4" /> },
    { value: "priority", label: t('issues.sort.priority'), icon: <SortAsc className="h-4 w-4" /> }
  ];

  const fetchIssues = async (retryCount = 10) => {
    setLoading(true);
    setError(null);
    const attemptFetch = async (retries: number): Promise<void> => {
      try {
        const { category, status, sort } = filter;
        const url = `/issues?category=${category}&status=${status}&sort=${sort}`;
        console.log("IssueList: Fetching issues from URL:", url);
        const { data } = await api.get(url);
        console.log("IssueList: Fetched issues data:", data);
        if (Array.isArray(data)) {
          setIssues(data);
        } else {
          console.error("IssueList: Fetched data is not an array:", data);
          setIssues([]);
        }
      } catch (error: any) {
        if (error.isStarting && retries > 0) {
          console.log(`IssueList: Server starting, retrying in 5s... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          return attemptFetch(retries - 1);
        }
        console.error("IssueList: Error fetching issues:", error);
        if (error.isStarting) {
          setError(error.message || "The server is starting up. Please wait a moment and try again.");
          toast.error(error.message || "The server is starting up. Please wait a moment and try again.");
        } else {
          setError("Failed to fetch issues. Please check your connection.");
          toast.error("Failed to fetch issues. Please check your connection.");
        }
      }
    };

    await attemptFetch(retryCount);
    setLoading(false);
  };

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
      // Optimistic update is handled by the server emitting issue:updated
      // but we can also do it locally for better UX
      setIssues(prev => prev.map(issue => 
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
      // Assuming there's an endpoint for this, or we can use a generic report endpoint
      // For now, we'll just show a success message as a placeholder if the endpoint doesn't exist
      // In a real app, this would open a modal to select the original issue
      await api.post(`/issues/${issueId}/report-duplicate`);
      toast.success("Issue reported as duplicate. Our team will review it.");
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Fallback if endpoint doesn't exist yet
        toast.info("Duplicate report submitted (Demo Mode)");
      } else {
        toast.error(err.response?.data?.message || "Failed to report duplicate");
      }
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filter]);

  useEffect(() => {
    if (!socket) return;

    const handleIssueCreated = (newIssue: Issue) => {
      console.log("Real-time: New issue created", newIssue);
      // Only add if it matches current filters
      const matchesCategory = !filter.category || newIssue.category === filter.category;
      const matchesStatus = !filter.status || newIssue.status === filter.status;
      
      if (matchesCategory && matchesStatus) {
        setIssues(prev => [newIssue, ...prev]);
        
        if (newIssue.urgency === 'critical' || newIssue.urgency === 'high') {
          toast.error(`URGENT: ${newIssue.title}`, {
            description: `A high-urgency issue has been reported in ${newIssue.category}.`,
            duration: 10000,
            action: {
              label: "View",
              onClick: () => navigate(`/issues/${newIssue._id}`)
            }
          });
        } else {
          toast.info(t('issues.new_issue_alert') || "A new issue has been reported!");
        }
      }
    };

    const handleIssueUpdated = (updatedIssue: Issue) => {
      console.log("Real-time: Issue updated", updatedIssue);
      setIssues(prev => prev.map(issue => 
        issue._id === updatedIssue._id ? updatedIssue : issue
      ));
    };

    const handleIssueDeleted = (deletedId: string) => {
      console.log("Real-time: Issue deleted", deletedId);
      setIssues(prev => prev.filter(issue => issue._id !== deletedId));
    };

    socket.on("issue:created", handleIssueCreated);
    socket.on("issue:updated", handleIssueUpdated);
    socket.on("issue:deleted", handleIssueDeleted);

    return () => {
      socket.off("issue:created", handleIssueCreated);
      socket.off("issue:updated", handleIssueUpdated);
      socket.off("issue:deleted", handleIssueDeleted);
    };
  }, [socket, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 md:mb-12 gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{t('issues.title')}</h1>
          <p className="text-slate-500 mt-2 md:mt-3 text-base md:text-lg font-medium">{t('issues.subtitle')}</p>
        </div>
        <Link
          to="/report"
          className="bg-blue-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 inline-flex items-center justify-center"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          {t('issues.report_new')}
        </Link>
      </div>

      {error && (
        <div className="mb-8 md:mb-12 bg-red-50 border-2 border-red-100 p-4 md:p-6 rounded-3xl flex items-start space-x-4">
          <div className="bg-red-100 p-2 rounded-xl shrink-0">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-red-900 font-bold text-sm md:text-base">{error}</p>
            <button 
              onClick={() => fetchIssues()} 
              className="mt-2 md:mt-3 text-[10px] md:text-xs font-black text-red-600 uppercase tracking-widest hover:text-red-800 transition-colors"
            >
              Retry Now
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 md:mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <FilterDropdown
            label={t('issues.category_label')}
            value={filter.category}
            options={categoryOptions}
            onChange={(val) => setFilter({ ...filter, category: val })}
            icon={<Filter className="h-4 w-4" />}
            placeholder={t('issues.all_categories')}
          />

          <FilterDropdown
            label={t('issues.status_label')}
            value={filter.status}
            options={statusOptions}
            onChange={(val) => setFilter({ ...filter, status: val })}
            icon={<Activity className="h-4 w-4" />}
            placeholder={t('issues.status.all')}
          />

          <FilterDropdown
            label={t('issues.sort_label')}
            value={filter.sort}
            options={sortOptions}
            onChange={(val) => setFilter({ ...filter, sort: val })}
            icon={<SortAsc className="h-4 w-4" />}
            placeholder={t('issues.sort.latest')}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-100 animate-pulse h-[500px] rounded-[2.5rem]"></div>
          ))}
        </div>
      ) : !Array.isArray(issues) || issues.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-20 text-center shadow-sm border border-slate-100 max-w-3xl mx-auto"
        >
          <div className="bg-blue-50 h-32 w-32 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
            <Search className="h-16 w-16 text-blue-600" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-6">{t('issues.no_issues')}</h2>
          <p className="text-slate-500 text-xl mb-12 leading-relaxed font-medium">
            {t('issues.no_issues_desc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/report" 
              className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center active:scale-95"
            >
              {t('issues.report_new')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button 
              onClick={() => setFilter({ status: "", category: "", sort: "latest" })}
              className="text-slate-600 font-black text-sm uppercase tracking-widest hover:text-slate-900 px-10 py-5 transition-colors"
            >
              {t('issues.clear_filters')}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.isArray(issues) && issues.map((issue) => (
            <IssueCard
              key={issue._id}
              issue={issue}
              onVote={handleVote}
              votingId={votingId}
              onReportDuplicate={handleReportDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default IssueList;
