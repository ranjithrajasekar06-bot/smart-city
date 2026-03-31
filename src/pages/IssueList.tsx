import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { MapPin, ThumbsUp, MessageSquare, Filter, Search, ChevronRight, Clock, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  status: "pending" | "in-progress" | "resolved" | "rejected";
  votes: number;
  createdAt: string;
  user_id?: {
    name: string;
  };
}

const IssueList: React.FC = () => {
  const { t } = useTranslation();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: "",
    status: "",
    sort: "latest",
  });

  const fetchIssues = async (retryCount = 0) => {
    setLoading(true);
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
      if (error.isStarting && retryCount < 5) {
        console.log(`IssueList: Server starting, retrying in 3s (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchIssues(retryCount + 1), 3000);
        return;
      }
      console.error("IssueList: Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            {t('issues.status.pending')}
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t('issues.status.in-progress')}
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('issues.status.resolved')}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t('issues.status.rejected')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('issues.title')}</h1>
          <p className="text-gray-500 mt-1">{t('issues.subtitle')}</p>
        </div>
        <Link
          to="/report"
          className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
        >
          {t('issues.report_new')}
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('issues.category_label')}</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">{t('issues.all_categories')}</option>
              <option value="pothole">{t('issues.potholes')}</option>
              <option value="garbage">{t('issues.garbage')}</option>
              <option value="streetlight">{t('issues.streetlights')}</option>
              <option value="water">{t('issues.water')}</option>
              <option value="other">{t('issues.other')}</option>
            </select>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('issues.status_label')}</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">{t('issues.status.all')}</option>
            <option value="pending">{t('issues.status.pending')}</option>
            <option value="in-progress">{t('issues.status.in-progress')}</option>
            <option value="resolved">{t('issues.status.resolved')}</option>
            <option value="rejected">{t('issues.status.rejected')}</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('issues.sort_label')}</label>
          <select
            value={filter.sort}
            onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="latest">{t('issues.sort.latest')}</option>
            <option value="votes">{t('issues.sort.votes')}</option>
            <option value="priority">{t('issues.sort.priority')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse h-96 rounded-xl"></div>
          ))}
        </div>
      ) : !Array.isArray(issues) || issues.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 max-w-2xl mx-auto"
        >
          <div className="bg-blue-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('issues.no_issues')}</h2>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            {t('issues.no_issues_desc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/report" 
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center"
            >
              {t('issues.report_new')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button 
              onClick={() => setFilter({ status: "", category: "", sort: "latest" })}
              className="text-gray-600 font-bold hover:text-gray-900 px-8 py-4"
            >
              {t('issues.clear_filters')}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(issues) && issues.map((issue) => (
            <motion.div
              key={issue._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={issue.image_url}
                  alt={issue.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3">
                  {getStatusBadge(issue.status)}
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded font-bold">
                    {t(`issues.${issue.category}s`)}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{issue.title}</h3>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4 h-10">{issue.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-500 text-sm">
                      <ThumbsUp className="h-4 w-4 mr-1 text-blue-500" />
                      {issue.votes}
                    </div>
                    <div className="text-xs text-gray-400">
                      {t('issues.by')} {issue.user_id?.name || t('issues.anonymous')}
                    </div>
                  </div>
                  <Link
                    to={`/issues/${issue._id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center"
                  >
                    {t('issues.details')}
                    <ChevronRight className="h-4 w-4 ml-0.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IssueList;
