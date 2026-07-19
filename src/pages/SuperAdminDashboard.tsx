import React, { useState, useEffect } from "react";
import api from "../services/api";
import { TN_DISTRICTS, getTranslatedDistrict, getTranslatedTaluk } from "../data/tnDistricts";
import { useTranslation } from "react-i18next";
import { 
  Users, 
  ShieldAlert, 
  FileCheck, 
  AlertTriangle, 
  Activity, 
  UserPlus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  XCircle,
  Loader2, 
  RefreshCw, 
  FileText,
  MapPin,
  Building2,
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Search,
  Map,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "taluk_admin" | "super_admin";
  district: string;
  taluk: string;
  isActive: boolean;
  createdAt: string;
}

interface AuditLog {
  _id: string;
  userId?: string;
  userName?: string;
  action: string;
  role: string;
  timestamp: string;
}

interface Analytics {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  inProgressIssues: number;
  emergencyIssues: number;
  resolutionRate: number;
  totalCitizens: number;
  totalTalukAdmins: number;
  categoryStats: Array<{ _id: string; count: number }>;
  priorityStats: Array<{ _id: string; count: number }>;
  monthlyTrends: Array<{ month: string; count: number }>;
  districtComparison: Array<{ district: string; count: number }>;
  talukComparison: Array<{ taluk: string; count: number }>;
  topProblemAreas: Array<{ district: string; taluk: string; count: number }>;
}

// Use standard TN_DISTRICTS instead of local subset
const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4"];

const SuperAdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"analytics" | "admins" | "audit">("analytics");
  const [loading, setLoading] = useState(true);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Modal / Form state for Admin Creation/Edit
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminDistrict, setAdminDistrict] = useState("");
  const [adminTaluk, setAdminTaluk] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminIsActive, setAdminIsActive] = useState(true);
  
  // Search & Filter UI state
  const [adminSearch, setAdminSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [availableTaluksForm, setAvailableTaluksForm] = useState<any[]>([]);
  
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, adminsRes, logsRes] = await Promise.all([
        api.get("/issues/analytics"),
        api.get("/taluk-admin/list"),
        api.get("/superadmin/audit-logs")
      ]);
      setAnalytics(analyticsRes.data);
      setAdminsList(adminsRes.data);
      setAuditLogs(logsRes.data);
    } catch (error: any) {
      console.error("Failed to load Super Admin data:", error);
      toast.error(error.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Sync Form Taluks list when District field changes
  useEffect(() => {
    const selected = TN_DISTRICTS.find(d => d.districtName.en === adminDistrict);
    if (selected) {
      setAvailableTaluksForm(selected.taluks);
      const talukExists = selected.taluks.some(t => t.en === adminTaluk);
      if (!talukExists) {
        setAdminTaluk(selected.taluks[0]?.en || "");
      }
    } else {
      setAvailableTaluksForm([]);
      setAdminTaluk("");
    }
  }, [adminDistrict]);

  const resetForm = () => {
    setAdminName("");
    setAdminEmail("");
    setAdminDistrict(TN_DISTRICTS[0].districtName.en);
    setAdminTaluk(TN_DISTRICTS[0].taluks[0].en);
    setAdminPassword("");
    setAdminIsActive(true);
    setIsEditMode(false);
    setEditingAdminId(null);
    setShowPassword(false);
  };

  const openCreateModal = () => {
    resetForm();
    setAdminModalOpen(true);
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdminId(admin._id);
    setAdminName(admin.name);
    setAdminEmail(admin.email);
    setAdminDistrict(admin.district);
    setAdminTaluk(admin.taluk);
    setAdminPassword(""); // Leave blank unless they want to change
    setAdminIsActive(admin.isActive);
    setIsEditMode(true);
    setShowPassword(false);
    setAdminModalOpen(true);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminDistrict || !adminTaluk) {
      toast.error("Please assign a District and Taluk.");
      return;
    }

    if (!isEditMode && !adminPassword) {
      toast.error("Password is required for new Taluk Admin.");
      return;
    }

    setActionLoading(true);
    try {
      if (isEditMode && editingAdminId) {
        const payload: any = {
          name: adminName,
          email: adminEmail,
          district: adminDistrict,
          taluk: adminTaluk,
          isActive: adminIsActive,
        };
        if (adminPassword.trim() !== "") {
          payload.password = adminPassword;
        }

        await api.put(`/taluk-admin/update/${editingAdminId}`, payload);
        toast.success(`Taluk Admin successfully updated.`);
      } else {
        const payload = {
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          district: adminDistrict,
          taluk: adminTaluk,
        };

        await api.post("/taluk-admin/create", payload);
        toast.success(`Tamil Nadu Taluk Admin account created.`);
      }
      
      setAdminModalOpen(false);
      resetForm();
      await fetchAllData();
    } catch (error: any) {
      console.error("Taluk Admin action failed:", error);
      toast.error(error.response?.data?.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Admin "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/taluk-admin/delete/${id}`);
      toast.success(`Taluk Admin "${name}" removed.`);
      await fetchAllData();
    } catch (error: any) {
      console.error("Failed to delete admin:", error);
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const filteredAdmins = adminsList.filter((admin) => {
    const matchesSearch = 
      admin.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
      admin.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
      admin.taluk.toLowerCase().includes(adminSearch.toLowerCase());
    
    const matchesDistrict = districtFilter === "all" || admin.district === districtFilter;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      
      {/* TN Government State Header Banner */}
      <div className="bg-[#1e293b] text-white py-12 px-4 sm:px-6 lg:px-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-10 bottom-0 opacity-10 pointer-events-none">
          <Building2 className="h-64 w-64 text-slate-100" />
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0 relative z-10">
          <div>
            <div className="flex items-center space-x-3 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1.5">
              <Shield className="h-4 w-4" />
              <span>Tamil Nadu Government Governance Portal</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">State Administration Dashboard</h1>
            <p className="text-slate-350 font-medium text-sm mt-1 max-w-xl">
              Super Admin Control Core: configure Taluk authorities, audit active security records, and view real-time state statistics.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-3.5 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              title="Refresh State Data"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Taluk Admin</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-slate-200/50 p-1.5 rounded-2xl max-w-md mb-8 border border-slate-200/50">
          {(["analytics", "admins", "audit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setAdminSearch("");
              }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/10"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              {tab === "admins" ? "Taluk Admins" : tab === "audit" ? "Audit Logbook" : tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-wider">Syncing state-wide datasets...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && analytics && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* State Stats Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Citizens</span>
                      <h3 className="text-3xl font-black text-slate-900 mt-1">{analytics.totalCitizens}</h3>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taluk Authorities</span>
                      <h3 className="text-3xl font-black text-slate-900 mt-1">{analytics.totalTalukAdmins}</h3>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-[#eff6ff] text-blue-600 rounded-2xl">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Reports</span>
                      <h3 className="text-3xl font-black text-slate-900 mt-1">{analytics.totalIssues}</h3>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-red-55 text-red-600 rounded-2xl">
                      <ShieldAlert className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emergency Events</span>
                      <h3 className="text-3xl font-black text-slate-900 mt-1">{analytics.emergencyIssues}</h3>
                    </div>
                  </div>
                </div>

                {/* District Comparison Chart & Category Division */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* District comparison bar chart */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-150/80 lg:col-span-2">
                    <div className="flex items-center space-x-2 text-slate-950 mb-6">
                      <Map className="h-5 w-5 text-blue-600" />
                      <div>
                        <h2 className="text-base font-black text-slate-800">District-wise Report Density</h2>
                        <p className="text-xs text-slate-400">Comparative issues distribution per Tamil Nadu District</p>
                      </div>
                    </div>

                    <div className="h-80 w-full text-xs font-mono">
                      {analytics.districtComparison?.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400">
                          No reports logged across districts yet.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.districtComparison}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="district" stroke="#94a3b8" tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={45} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Priority and Categoric Breakdown pie chart */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-150/80">
                    <div className="flex items-center space-x-2 text-slate-950 mb-6">
                      <Activity className="h-5 w-5 text-indigo-500" />
                      <div>
                        <h2 className="text-base font-black text-slate-800">Category Spread</h2>
                        <p className="text-xs text-slate-400">Constituent issues categories</p>
                      </div>
                    </div>

                    <div className="h-64 w-full flex items-center justify-center">
                      {analytics.categoryStats?.length === 0 ? (
                        <span className="text-xs text-slate-400">No categoric data compiled.</span>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.categoryStats}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="count"
                              nameKey="_id"
                            >
                              {analytics.categoryStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 justify-center text-[10px] font-bold uppercase">
                      {analytics.categoryStats?.map((entry, index) => (
                        <div key={entry._id} className="flex items-center space-x-1 border border-slate-100 rounded-md px-2 py-0.5 whitespace-nowrap">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="text-slate-600">{entry._id}: {entry.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monthly trends & Top problematic taluks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Monthly submission trends */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-150/80">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-base font-black text-slate-800">Monthly Submissions</h2>
                        <p className="text-xs text-slate-400">Issue reports intake rate</p>
                      </div>
                      <div className="text-xs font-black bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                        State Overview
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Problem areas taluk ranking table */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-150/80">
                    <div className="mb-6">
                      <h2 className="text-base font-black text-slate-800">Most Problematic Taluks</h2>
                      <p className="text-xs text-slate-400">High-volume open reports regions ranking</p>
                    </div>

                    <div className="space-y-4">
                      {analytics.topProblemAreas?.length === 0 ? (
                        <div className="text-slate-450 text-xs py-8 text-center">
                          All regions are perfectly resolved / clean!
                        </div>
                      ) : (
                        analytics.topProblemAreas?.map((item, idx) => (
                          <div key={`${item.district}-${item.taluk}`} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="flex items-center space-x-3.5">
                              <span className="h-8 w-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black text-sm">
                                #{idx + 1}
                              </span>
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">{item.taluk}</h4>
                                <p className="text-xs text-slate-400 font-medium">District: {item.district}</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center text-xs font-black text-orange-700 bg-orange-100/70 border border-orange-200/50 px-3 py-1 rounded-md">
                              {item.count} Reports
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TALUK ADMINS LISTING & MANAGEMENT */}
            {activeTab === "admins" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-150/80 overflow-hidden">
                  
                  {/* Top controls header */}
                  <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Taluk Authorities Directory</h2>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Assigned government administrators managing specific administrative sub-divisions</p>
                    </div>
                    <button
                      onClick={openCreateModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center space-x-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add Taluk Admin</span>
                    </button>
                  </div>

                  {/* Search and Filters row */}
                  <div className="bg-slate-50/50 p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search box */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Search by name, email, or taluk..."
                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-905 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-xs transition-all"
                      />
                    </div>
                    
                    {/* District Selector Filter */}
                    <div>
                      <select
                        value={districtFilter}
                        onChange={(e) => setDistrictFilter(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                      >
                        <option value="all">Filter: All Districts</option>
                        {TN_DISTRICTS.map((d: any) => (
                          <option key={d.districtName.en} value={d.districtName.en}>
                            {i18n.language === 'ta' ? d.districtName.ta : d.districtName.en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Authorities List Table */}
                  <div className="overflow-x-auto">
                    {filteredAdmins.length === 0 ? (
                      <div className="p-16 text-center text-slate-400 space-y-3">
                        <Users className="h-12 w-12 mx-auto text-slate-200" />
                        <p className="text-sm font-bold">No registered Taluk Admins match your query.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th className="py-4 px-6">Officer Name</th>
                            <th className="py-4 px-6">Official Email</th>
                            <th className="py-4 px-6">Assigned District</th>
                            <th className="py-4 px-6">Assigned Taluk</th>
                            <th className="py-4 px-6 text-center">Authority State</th>
                            <th className="py-4 px-6 text-right">Moderations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAdmins.map((admin) => (
                            <tr key={admin._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-bold text-slate-800">{admin.name}</td>
                              <td className="py-4 px-6 text-xs text-slate-600 font-mono">{admin.email}</td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                                  {getTranslatedDistrict(admin.district, i18n.language)}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-110">
                                  {getTranslatedTaluk(admin.taluk, i18n.language)}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                  admin.isActive
                                    ? "bg-green-50 text-green-700 border border-green-100"
                                    : "bg-red-50 text-red-750 border border-red-100"
                                }`}>
                                  {admin.isActive ? (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      <span>Active Duty</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3.5 w-3.5" />
                                      <span>Suspended / Disabled</span>
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right space-x-2">
                                <button
                                  onClick={() => openEditModal(admin)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                  title="Edit Authority Boundaries"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Revoke Authority Duty"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* AUDIT LOG BOOK */}
            {activeTab === "audit" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-150/80 overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-slate-50">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Administrative Auditor Logbook</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Permanent tamper-resistant records of admin assignments, moderator logons, and status switches.</p>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
                    {auditLogs.length === 0 ? (
                      <div className="p-16 text-center text-slate-400 space-y-3">
                        <FileText className="h-12 w-12 mx-auto text-slate-200" />
                        <p className="text-sm font-bold">No administrative transactions reported yet.</p>
                      </div>
                    ) : (
                      auditLogs.map((log) => (
                        <div key={log._id} className="p-5 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1.5 max-w-2xl">
                            <p className="text-sm font-bold text-slate-800">{log.action}</p>
                            <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                              <span className="flex items-center text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md">
                                {log.role}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-slate-500">{log.userName || "System Auditor"}</span>
                            </div>
                          </div>
                          
                          <div className="text-[10px] font-bold text-slate-350 font-mono whitespace-nowrap shrink-0">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* TALUK ADMIN REGISTER / EDIT MODAL */}
      <AnimatePresence>
        {adminModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-105 relative"
            >
              <div className="p-8 border-b border-slate-50 bg-[#1e293b] text-white">
                <h3 className="text-2xl font-black tracking-tight">
                  {isEditMode ? "Modify Boundary Card" : "Register Taluk Authority"}
                </h3>
                <p className="text-slate-300 font-medium text-xs mt-1">
                  {isEditMode ? "Update bound administrative limits for active officer." : "Appoint an officer to represent a regional Tamil Nadu taluk."}
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="p-8 space-y-5">
                
                {/* Officer Name */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Officer Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Users className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 text-slate-905 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all"
                      placeholder="e.g. Thirumavalavan M"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Official Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 text-slate-905 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all"
                      placeholder="officer@tn.gov.in"
                    />
                  </div>
                </div>

                {/* District Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Assigned District
                  </label>
                  <select
                    value={adminDistrict}
                    onChange={(e) => setAdminDistrict(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm bg-white"
                  >
                    <option value="">Select District</option>
                    {TN_DISTRICTS.map((d: any) => (
                      <option key={d.districtName.en} value={d.districtName.en}>
                        {i18n.language === 'ta' ? d.districtName.ta : d.districtName.en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Taluk Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Assigned Taluk Jurisdiction
                  </label>
                  <select
                    value={adminTaluk}
                    onChange={(e) => setAdminTaluk(e.target.value)}
                    disabled={!adminDistrict}
                    className="appearance-none block w-full px-4 py-3 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm bg-white disabled:opacity-50"
                  >
                    <option value="">Select Taluk</option>
                    {availableTaluksForm.map((tName: any) => (
                      <option key={tName.en} value={tName.en}>
                        {i18n.language === 'ta' ? tName.ta : tName.en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Password {isEditMode && <span className="text-[10px] text-slate-400 font-sans tracking-normal uppercase">(leave blank to keep unchanged)</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!isEditMode}
                      minLength={6}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="appearance-none block w-full pl-12 pr-10 py-3 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all"
                      placeholder={isEditMode ? "••••••••" : "Min 6 characters"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Active Duty Permit toggle */}
                {isEditMode && (
                  <div className="flex items-center justify-between p-4 bg-slate-55 rounded-2xl border border-slate-100">
                    <div>
                      <span className="block text-xs font-black uppercase text-slate-700 tracking-wider">Account Active</span>
                      <span className="text-[10px] text-slate-400 font-medium leading-none block">If active, officer can log in and moderate issues.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminIsActive(!adminIsActive)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        adminIsActive ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          adminIsActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* Button actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(false)}
                    className="w-1/3 flex justify-center py-3.5 border border-slate-205 text-xs font-black uppercase tracking-widest rounded-xl text-slate-500 bg-white hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-2/3 flex justify-center py-3.5 border border-transparent text-xs font-black uppercase tracking-widest rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 text-center"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isEditMode ? (
                      "Save Officer"
                    ) : (
                      "Appoint Officer"
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SuperAdminDashboard;
