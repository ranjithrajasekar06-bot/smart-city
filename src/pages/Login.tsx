import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { LogIn, Mail, Lock, AlertCircle, Loader2, KeyRound, ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Forgot / Reset Password state
  const [forgotMode, setForgotMode] = useState<"login" | "forgot" | "reset">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [simulatedToken, setSimulatedToken] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const attemptLogin = async (retries = 3): Promise<void> => {
      try {
        const { data } = await api.post("/auth/login", { email, password });
        login(data);
        
        // Redirect to dashboards based on system roles
        toast.success(`Welcome back, ${data.name}!`);
        if (data.role === "super_admin") {
          navigate("/superadmin");
        } else if (data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } catch (err: any) {
        if (err.isStarting && retries > 0) {
          console.log(`Server starting up, retrying login... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          return attemptLogin(retries - 1);
        }
        const errorMessage = err.response?.data?.message || (err.isStarting ? (err.message || "The server is starting up. Please wait.") : t('auth.error_generic'));
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    await attemptLogin();
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email: forgotEmail });
      toast.success("Forgot password token generated!");
      if (data.mockToken) {
        setSimulatedToken(data.mockToken);
        setForgotMode("reset");
        setResetToken(data.mockToken);
      } else {
        toast.info("If email exists, a token will be processed.");
        setForgotMode("login");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to process forgot password request.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", { token: resetToken, password: newPassword });
      toast.success(data.message || "Password successfully updated!");
      setForgotMode("login");
      setEmail(forgotEmail);
      setPassword("");
      setSimulatedToken(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to reset password. Token might be invalid/expired.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {/* LOGIN MODE */}
        {forgotMode === "login" && (
          <>
            <div>
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-8 text-center text-3xl font-black text-slate-900 tracking-tight">{t('auth.signin_title')}</h2>
              <p className="mt-3 text-center text-sm text-slate-500 font-medium">
                {t('auth.signin_subtitle')}{" "}
                <Link to="/register" className="font-black text-blue-600 hover:text-blue-700 transition-colors">
                  {t('auth.create_account')}
                </Link>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-start space-x-3 rounded-r-xl">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email-address" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    {t('auth.email_label')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium animate-none hover:border-slate-300"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                      {t('auth.password_label')}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotMode("forgot");
                        setError("");
                      }}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium hover:border-slate-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('auth.signing_in')}
                    </div>
                  ) : t('auth.signin_button')}
                </button>
              </div>
            </form>
          </>
        )}

        {/* FORGOT PASSWORD EMAIL REQUEST PAGE */}
        {forgotMode === "forgot" && (
          <>
            <div>
              <button
                type="button"
                onClick={() => setForgotMode("login")}
                className="inline-flex items-center text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Login
              </button>
              
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-200">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-8 text-center text-3xl font-black text-slate-900 tracking-tight">Forgot Password</h2>
              <p className="mt-3 text-center text-sm text-slate-500 font-medium">
                Enter your email address to generate a secure simulation recovery token.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-start space-x-3 rounded-r-xl animate-none">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium hover:border-slate-300"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </div>
                  ) : "Generate Recovery Token"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* RESET PASSWORD CHALLENGE PAGE */}
        {forgotMode === "reset" && (
          <>
            <div>
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-green-500 shadow-lg shadow-green-200">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="mt-8 text-center text-3xl font-black text-slate-900 tracking-tight">Reset Password</h2>
              <p className="mt-3 text-center text-sm text-slate-500 font-medium">
                Simulated recovery. Copy the security token generated below and choose your password.
              </p>
            </div>

            {simulatedToken && (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-sky-700 font-black text-xs uppercase tracking-wider">
                  <Info className="h-4 w-4 animate-pulse text-sky-600" />
                  <span>Developer Simulation Notice</span>
                </div>
                <p className="text-xs text-sky-600 font-medium leading-relaxed">
                  In production, this token would be emailed to you. Use the token below to confirm verification:
                </p>
                <div className="p-2.5 bg-sky-100 rounded-xl text-center select-all font-mono font-bold text-xs text-slate-800 break-all select-all">
                  {simulatedToken}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-start space-x-3 rounded-r-xl">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Simulation Token
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium hover:border-slate-300"
                    placeholder="Reset token"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium hover:border-slate-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium hover:border-slate-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode("login");
                    setSimulatedToken(null);
                  }}
                  className="w-1/3 flex justify-center py-4 px-4 border border-slate-200 text-xs font-black uppercase tracking-widest rounded-xl text-slate-500 bg-white hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex justify-center py-4 px-4 border border-transparent text-xs font-black uppercase tracking-widest rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;
