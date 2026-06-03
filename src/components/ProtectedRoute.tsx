import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface ProtectedRouteProps {
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ adminOnly = false, superAdminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Deactivated user check
  if (user.isActive === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center space-y-6">
          <div className="mx-auto h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Account Deactivated</h1>
          <p className="text-slate-500 font-medium">Your account has been deactivated. Please contact the Smart City administration for assistance.</p>
        </div>
      </div>
    );
  }

  // Role Checks
  let allowed = true;
  if (superAdminOnly && user.role !== "super_admin") {
    allowed = false;
  } else if (adminOnly && user.role !== "admin" && user.role !== "super_admin") {
    allowed = false;
  }

  if (!allowed) {
    // Return 403 Forbidden page!
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 text-center space-y-6">
          <div className="mx-auto h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-100">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">403 Forbidden</h1>
            <p className="text-xs font-black text-red-500 uppercase tracking-widest">Access Denied</p>
          </div>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            You do not have the necessary permissions to access this page. Please log in with an authorized account or navigate back.
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
