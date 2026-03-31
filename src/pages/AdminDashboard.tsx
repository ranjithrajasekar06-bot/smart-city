import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { LayoutDashboard, CheckCircle, Clock, AlertCircle, List, FileText, PieChart as PieChartIcon, Sparkles, Lightbulb, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { getCityInsights } from "../services/gemini";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Analytics {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  inProgressIssues: number;
  rejectedIssues?: number;
  categoryStats: { _id: string; count: number }[];
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
  createdAt: string;
  votes: number;
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async (retryCount = 0) => {
      try {
        const [analyticsRes, issuesRes] = await Promise.all([
          api.get("/issues/analytics"),
          api.get("/issues?status=pending&limit=5")
        ]);
        
        setAnalytics(analyticsRes.data);
        setRecentIssues(issuesRes.data);
        
        // Fetch AI insights after analytics
        fetchAIInsights(analyticsRes.data);
      } catch (error: any) {
        if (error.isStarting && retryCount < 5) {
          console.log(`AdminDashboard: Server starting, retrying in 3s (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchData(retryCount + 1), 3000);
          return;
        }
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
      const [analyticsRes, issuesRes] = await Promise.all([
        api.get("/issues/analytics"),
        api.get("/issues?status=pending&limit=5")
      ]);
      setAnalytics(analyticsRes.data);
      setRecentIssues(issuesRes.data);
    } catch (error) {
      console.error("Error updating issue status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) return null;

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.title')}</h1>
        </div>
        <button 
          onClick={() => analytics && fetchAIInsights(analytics)}
          disabled={loadingAI}
          className="flex items-center space-x-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <Sparkles className={`h-4 w-4 text-purple-600 ${loadingAI ? "animate-pulse" : ""}`} />
          <span>{loadingAI ? t('admin.analyzing') : t('admin.refresh_ai')}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.stats.total')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.totalIssues}</p>
          <p className="text-sm text-gray-500 mt-1">{t('admin.stats.total_desc')}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">{t('admin.stats.pending')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.pendingIssues}</p>
          <p className="text-sm text-gray-500 mt-1">{t('admin.stats.pending_desc')}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{t('admin.stats.active')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.inProgressIssues}</p>
          <p className="text-sm text-gray-500 mt-1">{t('admin.stats.active_desc')}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest">{t('admin.stats.resolved')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.resolvedIssues}</p>
          <p className="text-sm text-gray-500 mt-1">{t('admin.stats.resolved_desc')}</p>
        </div>
      </div>

      {/* AI Insights Section */}
      {aiInsights && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10"
        >
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl border border-purple-100 shadow-sm">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">{t('admin.ai_insights')}</h3>
            </div>
            <ul className="space-y-4">
              {aiInsights.insights.map((insight, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <div className="h-5 w-5 rounded-full bg-purple-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-purple-700">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 p-8 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex items-center space-x-2 mb-6">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">{t('admin.ai_recommendations')}</h3>
            </div>
            <ul className="space-y-4">
              {aiInsights.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <div className="h-5 w-5 rounded-full bg-blue-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-blue-700">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Recent Issues for Review */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-10 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h3 className="font-bold text-gray-900">{t('admin.review_title')}</h3>
          </div>
          <Link to="/issues?status=pending" className="text-blue-600 text-sm font-bold hover:underline">
            {t('admin.view_all')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-4">{t('admin.table.title')}</th>
                <th className="px-8 py-4">{t('admin.table.category')}</th>
                <th className="px-8 py-4">{t('admin.table.reported_on')}</th>
                <th className="px-8 py-4">{t('admin.table.votes')}</th>
                <th className="px-8 py-4 text-right">{t('admin.table.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentIssues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center text-gray-500">
                    {t('admin.table.no_pending')}
                  </td>
                </tr>
              ) : (
                recentIssues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-4 font-semibold text-gray-900">{issue.title}</td>
                    <td className="px-8 py-4">
                      <span className="text-xs uppercase tracking-widest bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">
                        {t(`issues.category.${issue.category}`)}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-500">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-blue-600">{issue.votes}</td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => navigate(`/issues/${issue._id}`)}
                          className="text-blue-600 font-bold text-xs hover:underline"
                        >
                          {t('admin.table.view')}
                        </button>
                        <button
                          onClick={() => handleQuickAction(issue._id, "in-progress")}
                          className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold hover:bg-blue-100 transition-colors"
                        >
                          {t('admin.table.approve')}
                        </button>
                        <button
                          onClick={() => handleQuickAction(issue._id, "rejected")}
                          className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold hover:bg-red-100 transition-colors"
                        >
                          {t('admin.table.reject')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-8">
            <List className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">{t('admin.charts.category')}</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.categoryStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "#6b7280" }} 
                  tickFormatter={(val) => t(`issues.category.${val}`)}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  cursor={{ fill: "#f9fafb" }}
                  formatter={(value: any) => [value, t('admin.table.votes')]}
                  labelFormatter={(label) => t(`issues.category.${label}`)}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analytics.categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-8">
            <PieChartIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">{t('admin.charts.status')}</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: t('issues.status.pending'), value: analytics.pendingIssues },
                    { name: t('issues.status.in-progress'), value: analytics.inProgressIssues },
                    { name: t('issues.status.resolved'), value: analytics.resolvedIssues },
                    { name: t('issues.status.rejected'), value: analytics.rejectedIssues || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#F59E0B" />
                  <Cell fill="#3B82F6" />
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center flex-wrap gap-4 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-xs text-gray-500">{t('issues.status.pending')}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-xs text-gray-500">{t('issues.status.in-progress')}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs text-gray-500">{t('issues.status.resolved')}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-xs text-gray-500">{t('issues.status.rejected')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

