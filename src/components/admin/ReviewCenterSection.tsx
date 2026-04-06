import React from "react";
import { Clock, List, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

interface ReviewCenterSectionProps {
  recentIssues: Issue[];
  reviewStatus: string;
  setReviewStatus: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleQuickAction: (issueId: string, status: string) => Promise<void>;
  handleUrgencyAction: (issueId: string, urgency: string, verified: boolean) => Promise<void>;
  onViewIssue: (issueId: string) => void;
}

const ReviewCenterSection: React.FC<ReviewCenterSectionProps> = ({
  recentIssues,
  reviewStatus,
  setReviewStatus,
  searchQuery,
  setSearchQuery,
  handleQuickAction,
  handleUrgencyAction,
  onViewIssue
}) => {
  const { t } = useTranslation();

  const filteredIssues = recentIssues.filter(i => 
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-10 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Review Center</h3>
              <p className="text-xs text-gray-500">Manage and update reported issues</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
              <List className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setReviewStatus("pending,in-progress")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reviewStatus === "pending,in-progress" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                All Active
              </button>
              <button
                onClick={() => setReviewStatus("pending")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reviewStatus === "pending" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t('issues.status.pending')}
              </button>
              <button
                onClick={() => setReviewStatus("in-progress")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reviewStatus === "in-progress" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t('issues.status.in-progress')}
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-4">{t('admin.table.title')}</th>
                <th className="px-8 py-4">{t('admin.table.category')}</th>
                <th className="px-8 py-4">Severity / Urgency</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">{t('admin.table.votes')}</th>
                <th className="px-8 py-4 text-right">{t('admin.table.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-gray-500">
                    {recentIssues.length === 0 
                      ? (reviewStatus === "pending" ? t('admin.table.no_pending') : t('admin.table.no_in_progress'))
                      : "No issues match your search"}
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="font-semibold text-gray-900">{issue.title}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{new Date(issue.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-[10px] uppercase tracking-widest bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">
                        {t(`issues.category.${issue.category}`, { defaultValue: issue.category })}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-600' : 
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center ${
                            issue.urgency === 'critical' ? 'bg-red-200 text-red-700' :
                            issue.urgency === 'high' ? 'bg-red-100 text-red-600' : 
                            issue.urgency === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {issue.urgency}
                            {issue.urgency_verified && <CheckCircle className="h-2.5 w-2.5 ml-1" />}
                          </span>
                        </div>
                        {!issue.urgency_verified && (
                          <button
                            onClick={() => handleUrgencyAction(issue._id, issue.urgency, true)}
                            className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline text-left"
                          >
                            Verify Urgency
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <select
                        value={issue.status}
                        onChange={(e) => handleQuickAction(issue._id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all ${
                          issue.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          issue.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                          issue.status === "resolved" ? "bg-green-100 text-green-700" :
                          "bg-red-100 text-red-700"
                        }`}
                      >
                        <option value="pending">{t('issues.status.pending')}</option>
                        <option value="in-progress">{t('issues.status.in-progress')}</option>
                        <option value="resolved">{t('issues.status.resolved')}</option>
                        <option value="rejected">{t('issues.status.rejected')}</option>
                      </select>
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-blue-600">{issue.votes}</td>
                    <td className="px-8 py-4 text-right">
                      <button
                        onClick={() => onViewIssue(issue._id)}
                        className="text-blue-600 font-bold text-xs hover:underline"
                      >
                        {t('admin.table.view')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <Link to={`/issues?status=${reviewStatus}`} className="text-blue-600 text-xs font-bold hover:underline">
            {t('admin.view_all')} in Issue Explorer
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewCenterSection;
