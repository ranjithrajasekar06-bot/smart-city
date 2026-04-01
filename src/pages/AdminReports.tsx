import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Download, Calendar, Filter, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { motion } from "motion/react";

// Extend jsPDF with autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const AdminReports: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "all",
    status: "all",
  });

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

  const convertToCSV = (data: any[]) => {
    const fields = ["title", "description", "category", "status", "votes", "createdAt", "latitude", "longitude", "user_address", "issue_location", "pin_code"];
    const header = fields.join(",") + "\n";
    const rows = data.map(item => {
      return fields.map(field => {
        let val = item[field];
        if (typeof val === "string") {
          // Escape quotes and wrap in quotes
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",");
    }).join("\n");
    return header + rows;
  };

  const handleDownloadCSV = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/issues", { params: { ...filters, limit: 1000 } });
      
      if (!data || data.length === 0) {
        toast.error("No data found for the selected filters");
        return;
      }

      const csv = convertToCSV(data);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `smartcity_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV Report downloaded successfully");
    } catch (error) {
      console.error("CSV Generation Error:", error);
      toast.error("Failed to generate CSV report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/issues", { params: { ...filters, limit: 1000 } });
      
      if (!data || data.length === 0) {
        toast.error("No data found for the selected filters");
        return;
      }

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Blue-600
      doc.text("SmartCity Community Platform", 14, 22);
      
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text("Government Issue Report", 14, 32);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);
      doc.text(`Filters: Category: ${filters.category}, Status: ${filters.status}`, 14, 46);
      if (filters.startDate || filters.endDate) {
        doc.text(`Date Range: ${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`, 14, 52);
      }

      const tableRows = data.map((issue: any) => [
        issue.title,
        t(`issues.category.${issue.category}`, { defaultValue: issue.category }),
        t(`issues.status.${issue.status}`, { defaultValue: issue.status }),
        issue.issue_location || "N/A",
        issue.pin_code || "N/A",
        issue.votes,
        new Date(issue.createdAt).toLocaleDateString()
      ]);

      doc.autoTable({
        startY: 60,
        head: [["Title", "Category", "Status", "Location", "Pin Code", "Votes", "Date"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillStyle: [59, 130, 246] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });

      doc.save(`smartcity_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF Report downloaded successfully");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate("/admin")}
        className="flex items-center text-gray-500 hover:text-gray-700 mb-8 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold">Report Generation</h1>
            </div>
            <p className="text-blue-100 max-w-xl">
              Generate detailed reports for government auditing and city planning. 
              Export issue data in professional PDF or data-ready CSV formats.
            </p>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Date Range */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Data Filters
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{t(`issues.category.${cat}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-10 border border-gray-100">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg mt-1">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Report Preview</h4>
                <p className="text-xs text-gray-500 mt-1">
                  The generated report will include issue titles, categories, current status, vote counts, and submission dates. 
                  CSV exports include additional metadata like geographic coordinates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              Download PDF Report
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={loading}
              className="flex-1 bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              Download CSV Data
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center space-x-2 text-gray-400 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>Reports are generated based on the current system state.</span>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
