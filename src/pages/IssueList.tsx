import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { MapPin, ThumbsUp, MessageSquare, Filter, Search, ChevronRight, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  status: "pending" | "in-progress" | "resolved";
  votes: number;
  createdAt: string;
  user_id?: {
    name: string;
  };
}

const IssueList: React.FC = () => {
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
      if (error.isStarting && retryCount < 3) {
        console.log(`IssueList: Server starting, retrying in 2s (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchIssues(retryCount + 1), 2000);
        return;
      }
      console.error("IssueList: Error fetching issues:", error);
    } finally {
      if (!loading) setLoading(false); // Only set to false if we're not retrying
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
            Pending
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
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
          <h1 className="text-3xl font-bold text-gray-900">Community Issues</h1>
          <p className="text-gray-500 mt-1">View and support infrastructure reports in your area.</p>
        </div>
        <Link
          to="/report"
          className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
        >
          Report New Issue
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">All Categories</option>
              <option value="pothole">Potholes</option>
              <option value="garbage">Garbage</option>
              <option value="streetlight">Streetlights</option>
              <option value="water">Water/Sewage</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sort By</label>
          <select
            value={filter.sort}
            onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="latest">Latest First</option>
            <option value="votes">Most Voted</option>
            <option value="priority">Priority</option>
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
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No issues found</h3>
          <p className="text-gray-500">Try adjusting your filters or report a new issue.</p>
        </div>
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
                    {issue.category}
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
                      by {issue.user_id?.name || "Anonymous"}
                    </div>
                  </div>
                  <Link
                    to={`/issues/${issue._id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center"
                  >
                    Details
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
