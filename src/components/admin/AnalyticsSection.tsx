import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { FileText, Clock, AlertCircle, CheckCircle, TrendingUp, Lightbulb, List, PieChart as PieChartIcon } from "lucide-react";
import { motion } from "motion/react";
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

interface AnalyticsSectionProps {
  analytics: Analytics;
  aiInsights: AIInsights | null;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ analytics, aiInsights }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
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
        </div>
      )}

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
                  tickFormatter={(val) => t(`issues.category.${val}`, { defaultValue: val })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                  cursor={{ fill: "#f9fafb" }}
                  formatter={(value: any) => [value, t('admin.table.votes')]}
                  labelFormatter={(label) => t(`issues.category.${label}`, { defaultValue: label })}
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
    </motion.div>
  );
};

export default AnalyticsSection;
