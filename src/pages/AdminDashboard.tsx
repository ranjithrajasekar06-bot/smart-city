import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Clock, FileText, PieChart as PieChartIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getCityInsights } from "../services/gemini";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AnalyticsSection from "../components/admin/AnalyticsSection";
import ReviewCenterSection from "../components/admin/ReviewCenterSection";

interface Analytics {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  inProgressIssues: number;
  rejectedIssues?: number;
  categoryStats: { _id: string; count: number }[];
  severityStats?: { _id: string; count: number }[];
  urgencyStats?: { _id: string; count: number }[];
}

interface AIInsights {
  insights: string[];
  recommendations: string[];
}

interface Issue {
  _id: string;
  title: string;
  status: string;
  category: string;
  severity: string;
  urgency: string;
  urgency_verified?: boolean;
  createdAt: string;
  votes: number;
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [reviewStatus, setReviewStatus] = useState<string>("pending,in-progress");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<"analytics" | "review">("analytics");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, issuesRes] = await Promise.all([
          api.get("/issues/analytics"),
          api.get(`/issues?status=${reviewStatus}&limit=10`)
        ]);
        
        setAnalytics(analyticsRes.data);
        setRecentIssues(issuesRes.data);
        
        // Fetch AI insights after analytics
        fetchAIInsights(analyticsRes.data);
      } catch (error: any) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, reviewStatus]);

  const fetchAIInsights = async (data: Analytics) => {
    setLoadingAI(true);
    try {
      const insights = await getCityInsights(data);
      setAiInsights(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleQuickAction = async (issueId: string, status: string) => {
    try {
      await api.put(`/issues/${issueId}/status`, { status });
      // Refresh data
      refreshData();
      toast.success("Issue status updated successfully!");
    } catch (error) {
      console.error("Error updating issue status:", error);
      toast.error("Failed to update issue status");
    }
  };

  const handleUrgencyAction = async (issueId: string, urgency: string, verified: boolean) => {
    try {
      await api.put(`/issues/${issueId}/urgency`, { urgency, urgency_verified: verified });
      refreshData();
      toast.success("Urgency verified successfully!");
    } catch (error) {
      console.error("Error updating urgency:", error);
      toast.error("Failed to verify urgency");
    }
  };

  const refreshData = async () => {
    const [analyticsRes, issuesRes] = await Promise.all([
      api.get("/issues/analytics"),
      api.get(`/issues?status=${reviewStatus}&limit=10`)
    ]);
    setAnalytics(analyticsRes.data);
    setRecentIssues(issuesRes.data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.error_loading')}</h2>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          {t('admin.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{t('admin.title')}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate("/admin/reports")}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-white border border-slate-200 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Reports</span>
          </button>
          <button 
            onClick={() => analytics && fetchAIInsights(analytics)}
            disabled={loadingAI}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-white border border-slate-200 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 active:scale-95"
          >
            <Sparkles className={`h-4 w-4 text-purple-600 ${loadingAI ? "animate-pulse" : ""}`} />
            <span>{loadingAI ? t('admin.analyzing') : 'AI Insights'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl mb-10 w-full md:w-fit">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "analytics" ? "bg-white text-blue-600 shadow-lg shadow-slate-200/50" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <PieChartIcon className="h-4 w-4" />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "review" ? "bg-white text-blue-600 shadow-lg shadow-slate-200/50" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Review</span>
        </button>
      </div>

      {activeTab === "analytics" ? (
        <AnalyticsSection 
          analytics={analytics} 
          aiInsights={aiInsights} 
        />
      ) : (
        <ReviewCenterSection 
          recentIssues={recentIssues}
          reviewStatus={reviewStatus}
          setReviewStatus={setReviewStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleQuickAction={handleQuickAction}
          handleUrgencyAction={handleUrgencyAction}
          onViewIssue={(id) => navigate(`/issues/${id}`)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

