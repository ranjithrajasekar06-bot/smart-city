import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
  Users, 
  ShieldAlert, 
  FileCheck, 
  AlertTriangle, 
  Settings, 
  Activity, 
  UserPlus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  XCircle,
  Loader2, 
  RefreshCw, 
  FileText,
  UserCheck, 
  Zap,
  MapPin,
  Building2,
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "admin";
  department: string;
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
  totalCitizens: number;
  totalAdmins: number;
  totalIssues: number;
  emergencyIssues: number;
  departmentStats: { [key: string]: number };
  statusStats: { [key: string]: number };
  activityTimeline?: Array<{ date: string; fullDate: string; actions: number }>;
}

const DEPARTMENTS = [
  "Road Maintenance",
  "Water Supply",
  "Electricity",
  "Waste Management",
  "Emergency Services"
];

const SuperAdminDashboard: React.FC = () => {
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
  const [adminDepartment, setAdminDepartment] = useState(DEPARTMENTS[0]);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminIsActive, setAdminIsActive] = useState(true);
  
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, adminsRes, logsRes] = await Promise.all([
        api.get("/superadmin/analytics"),
        api.get("/superadmin/admins"),
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

  const resetForm = () => {
    setAdminName("");
    setAdminEmail("");
    setAdminDepartment(DEPARTMENTS[0]);
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
    setAdminDepartment(admin.department);
    setAdminPassword(""); // leave password blank by default during edit
    setAdminIsActive(admin.isActive);
    setIsEditMode(true);
    setShowPassword(false);
    setAdminModalOpen(true);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditMode && !adminPassword) {
      toast.error("Password is required for new Admin creation.");
      return;
    }

    setActionLoading(true);
    try {
      if (isEditMode && editingAdminId) {
        // Edit flow
        const payload: any = {
          name: adminName,
          email: adminEmail,
          department: adminDepartment,
          isActive: adminIsActive,
        };
        if (adminPassword.trim() !== "") {
          payload.password = adminPassword;
        }

        const { data } = await api.put(`/superadmin/admins/${editingAdminId}`, payload);
        toast.success(`Admin "${data.name}" successfully updated.`);
      } else {
        // Create flow
        const payload = {
          name: adminName,
          email: adminEmail,
          department: adminDepartment,
          password: adminPassword,
        };

        const { data } = await api.post("/superadmin/admins", payload);
        toast.success(`Admin "${data.name}" successfully created.`);
      }
      
      setAdminModalOpen(false);
      resetForm();
      await fetchAllData();
    } catch (error: any) {
      console.error("Admin action failed:", error);
      toast.error(error.response?.data?.message || "Action failed. Please verify fields.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAdminStatus = async (admin: AdminUser) => {
    try {
      const { data } = await api.put(`/superadmin/admins/${admin._id}`, {
        ...admin,
        isActive: !admin.isActive
      });
      toast.success(`Admin "${data.name}" deactivation state updated.`);
      await fetchAllData();
    } catch (error: any) {
      console.error("Toggle admin status failed:", error);
      toast.error(error.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Admin "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/superadmin/admins/${id}`);
      toast.success(`Admin "${name}" deleted.`);
      await fetchAllData();
    } catch (error: any) {
      console.error("Failed to delete admin:", error);
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
          <div>
            <div className="flex items-center space-x-3 text-blue-400 font-black text-xs uppercase tracking-widest mb-1">
              <Shield className="h-4 w-4 animate-pulse" />
              <span>Administration Command Core</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Super Admin Hub</h1>
            <p className="text-slate-400 font-medium text-sm mt-1">
              Complete platform control: Audit, Analytics, and Department Authority curation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              title="Sync Platform Data"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create Admin</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Responsive Dashboard Tabs */}
        <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-2xl max-w-md mb-8">
          {(["analytics", "admins", "audit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              {tab === "audit" ? "Audit Logs" : tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-wider">Syncing smart platform data...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* ANALYTICS VIEW */}
            {activeTab === "analytics" && analytics && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl shadow-sm">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Citizens</span>
                      <h3 className="text-3xl font-black text-slate-900 mt-1">{analytics.totalCitizens}</h3>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Admins</span>
                      <h3 className="text-3xl font-black text-slate-900 mt-1">{analytics.totalAdmins}</h3>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl shadow-sm">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Issues</span>
                      <h3 className="text-3xl font-black text-slate-900 mt-1">{analytics.totalIssues}</h3>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl shadow-sm">
                      <ShieldAlert className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical Alerts</span>
                      <h3 className="text-3xl font-black text-slate-900 mt-1">{analytics.emergencyIssues}</h3>
                    </div>
                  </div>
                </div>

                {/* Admin Activity Timeline Line Chart */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-md border border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                    <div>
                      <div className="flex items-center space-x-2 text-slate-950">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-black tracking-tight text-slate-800">Admin Activity Timeline</h2>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Recorded administrative and logging actions over the past 30 days</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                      <span>Real-time Monitoring</span>
                    </div>
                  </div>

                  <div className="h-80 w-full font-sans text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analytics.activityTimeline || []}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          fontSize={11}
                          fontFamily="sans-serif"
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={11}
                          fontFamily="sans-serif"
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          dx={-5}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1">
                                  <p className="font-bold text-slate-400">{item.fullDate}</p>
                                  <p className="font-black text-white text-sm">
                                    {payload[0].value} {item.actions === 1 ? 'Action' : 'Actions'}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="actions"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                          activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }}
                          name="Actions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Grid for distributions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Department Statistics Table / Card */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-md border border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-950 mb-6">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-black tracking-tight uppercase tracking-widest text-sm text-slate-400">Department Metrics</h2>
                    </div>

                    <div className="space-y-4">
                      {DEPARTMENTS.map((dept) => {
                        const count = analytics.departmentStats[dept] || 0;
                        const percent = analytics.totalIssues > 0 
                          ? Math.round((count / analytics.totalIssues) * 100) 
                          : 0;

                        return (
                          <div key={dept} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700">{dept}</span>
                              <span className="font-black text-slate-900">{count} reports ({percent}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Statistics */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-md border border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-950 mb-6">
                      <Activity className="h-5 w-5 text-green-600" />
                      <h2 className="text-lg font-black tracking-tight uppercase tracking-widest text-sm text-slate-400">Status Distribution</h2>
                    </div>

                    <div className="space-y-5">
                      {["pending", "in-progress", "resolved", "rejected"].map((status) => {
                        const count = analytics.statusStats[status] || 0;
                        const colors: { [key: string]: string } = {
                          pending: "bg-yellow-500",
                          "in-progress": "bg-blue-500",
                          resolved: "bg-green-500",
                          rejected: "bg-red-500",
                        };

                        return (
                          <div key={status} className="flex items-center justify-between p-3.5 bg-slate-55 relative rounded-2xl border border-slate-100">
                            <div className="flex items-center space-x-3">
                              <span className={`w-3.5 h-3.5 rounded-full ${colors[status] || "bg-slate-400"}`}></span>
                              <span className="text-xs font-black uppercase tracking-widest text-slate-700">{status}</span>
                            </div>
                            <span className="font-black text-sm text-slate-900">{count} ({analytics.totalIssues > 0 ? Math.round((count / analytics.totalIssues) * 100) : 0}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Fast Action Guidance */}
                <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-105 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-sm">Automated Emergency Triggers are Active</h4>
                    <p className="text-xs text-slate-500 font-medium">Critical issues are monitored server-side through the AI issue filter. Administrators of the respective department are alerted immediately.</p>
                  </div>
                  <button 
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Configure New Authority
                  </button>
                </div>

              </motion.div>
            )}

            {/* ADMINS MANAGEMENT VIEW */}
            {activeTab === "admins" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2rem] shadow-md border border-slate-100 overflow-hidden">
                  
                  {/* Top bar inside the Admin management module */}
                  <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Admin Accounts</h2>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Departments authority management logs.</p>
                    </div>
                    <button
                      onClick={openCreateModal}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add New Admin</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    {adminsList.length === 0 ? (
                      <div className="p-16 text-center text-slate-400 space-y-3">
                        <Users className="h-12 w-12 mx-auto text-slate-200" />
                        <p className="text-sm font-bold">No Admin accounts have been registered yet.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th className="py-4 px-6">Name</th>
                            <th className="py-4 px-6">Email</th>
                            <th className="py-4 px-6">Department Auth</th>
                            <th className="py-4 px-6 text-center">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {adminsList.map((admin) => (
                            <tr key={admin._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-bold text-slate-800">{admin.name}</td>
                              <td className="py-4 px-6 text-xs text-slate-600 font-mono">{admin.email}</td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-bold font-sans">
                                  {admin.department}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <button
                                  onClick={() => toggleAdminStatus(admin)}
                                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                    admin.isActive
                                      ? "bg-green-50 text-green-700 hover:bg-green-100/70"
                                      : "bg-red-50 text-red-700 hover:bg-red-100/70"
                                  } transition-colors`}
                                >
                                  {admin.isActive ? (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      <span>Active</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3.5 w-3.5" />
                                      <span>Disabled</span>
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="py-4 px-6 text-right space-x-2">
                                <button
                                  onClick={() => openEditModal(admin)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                  title="Edit Admin Settings"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Permanently Delete Admin"
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

            {/* AUDIT LOGS VIEW */}
            {activeTab === "audit" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2rem] shadow-md border border-slate-100 overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-slate-50">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Security Audit Logging</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Automated tracking of system state actions, logins, and moderation.</p>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
                    {auditLogs.length === 0 ? (
                      <div className="p-16 text-center text-slate-400 space-y-3">
                        <FileText className="h-12 w-12 mx-auto text-slate-200" />
                        <p className="text-sm font-bold">No Audit activities recorded in database yet.</p>
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
                              <span className="font-mono">{log.userName || "System"}</span>
                            </div>
                          </div>
                          
                          <div className="text-[10px] font-bold text-slate-300 font-mono whitespace-nowrap shrink-0">
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

      {/* ADMIN CREATION & EDITING MODAL */}
      <AnimatePresence>
        {adminModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 relative"
            >
              <div className="p-8 border-b border-slate-50">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isEditMode ? "Modify Admin Account" : "Register Authority"}
                </h3>
                <p className="text-slate-400 font-medium text-xs mt-1">
                  {isEditMode ? "Edit name, department authority, and login permissions." : "Create a separate Admin authority for specified department."}
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="p-8 space-y-6">
                
                {/* Name */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Full Name
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
                      className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Email Address
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
                      className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all"
                      placeholder="jane@smartcity.gov"
                    />
                  </div>
                </div>

                {/* Department Authority dropdown */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Assigned Department Authority
                  </label>
                  <select
                    value={adminDepartment}
                    onChange={(e) => setAdminDepartment(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm bg-white"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Password input with visual hide/show */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Password {isEditMode && <span className="text-[10px] text-slate-400 uppercase tracking-normal font-sans">(leave blank to keep unchanged)</span>}
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
                      placeholder={isEditMode ? "••••••••" : "Strong password"}
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

                {/* Active permission switch */}
                {isEditMode && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <span className="block text-xs font-black uppercase text-slate-700 tracking-wider">Account Active</span>
                      <span className="text-[10px] text-slate-400 font-medium leading-none block">If toggled off, the admin is fully locked out.</span>
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

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(false)}
                    className="w-1/3 flex justify-center py-3.5 border border-slate-200 text-xs font-black uppercase tracking-widest rounded-xl text-slate-500 bg-white hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-2/3 flex justify-center py-3.5 border border-transparent text-xs font-black uppercase tracking-widest rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/10 active:scale-95 text-center"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isEditMode ? (
                      "Save Account"
                    ) : (
                      "Register Admin"
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
