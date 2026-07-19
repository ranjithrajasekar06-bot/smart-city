import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, Phone, MapPin, Building } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TN_DISTRICTS } from "../data/tnDistricts";

const Register: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    district: "",
    taluk: "",
    address: "",
  });
  const [districts, setDistricts] = useState<any[]>(TN_DISTRICTS);
  const [availableTaluks, setAvailableTaluks] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, phone, district, taluk, address } = formData;

  // Sync taluks list when district selection changes
  useEffect(() => {
    const selected = TN_DISTRICTS.find(d => d.districtName.en === district);
    if (selected) {
      setAvailableTaluks(selected.taluks);
      setFormData(prev => {
        // If the current taluk is already correct for the selected district, persist it, else reset to empty
        const talukExists = selected.taluks.some(t => t.en === prev.taluk);
        if (talukExists) {
          return prev;
        }
        return { ...prev, taluk: "" };
      });
    } else {
      setAvailableTaluks([]);
      setFormData(prev => ({ ...prev, taluk: "" }));
    }
  }, [district]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!district || !taluk) {
      return setError("Please select your District and Taluk.");
    }

    if (password !== confirmPassword) {
      return setError(t('auth.passwords_mismatch'));
    }

    setLoading(true);

    const attemptRegister = async (retries = 10): Promise<void> => {
      try {
        const { data } = await api.post("/auth/register", { 
          name, 
          email, 
          password,
          phone,
          district,
          taluk,
          address 
        });
        login(data);
        navigate("/");
      } catch (err: any) {
        if (err.isStarting && retries > 0) {
          console.log(`Server starting up, retrying registration... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          return attemptRegister(retries - 1);
        }
        const errorMessage = err.response?.data?.message || (err.isStarting ? (err.message || "The server is starting up. Please wait a moment and try again.") : t('auth.error_generic'));
        setError(errorMessage);
      }
    };

    await attemptRegister();
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-8 text-center text-3xl font-black text-slate-900 tracking-tight">TN Citizen Registration</h2>
          <p className="mt-3 text-center text-sm text-slate-500 font-medium">
            {t('auth.register_subtitle')}{" "}
            <Link to="/login" className="font-black text-blue-600 hover:text-blue-700 transition-colors">
              {t('nav.login')}
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-start space-x-3 rounded-r-xl">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                {t('auth.full_name')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                {t('auth.email_label')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="9876543210"
                />
              </div>
            </div>

            {/* District Dropdown */}
            <div>
              <label htmlFor="district" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                {t('fields.district')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  id="district"
                  name="district"
                  required
                  value={district}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all font-medium"
                >
                  <option value="">{t('fields.district')}</option>
                  {TN_DISTRICTS.map((d: any) => (
                    <option key={d.districtName.en} value={d.districtName.en}>
                      {i18n.language === 'ta' ? d.districtName.ta : d.districtName.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Taluk Dropdown */}
            <div>
              <label htmlFor="taluk" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                {t('fields.taluk')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  id="taluk"
                  name="taluk"
                  required
                  value={taluk}
                  onChange={handleChange}
                  disabled={!district}
                  className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all font-medium disabled:opacity-50 disabled:bg-slate-50"
                >
                  <option value="">{t('fields.taluk')}</option>
                  {availableTaluks.map((tName: any) => (
                    <option key={tName.en} value={tName.en}>
                      {i18n.language === 'ta' ? tName.ta : tName.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ward/Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Residency/Ward Address
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={2}
                value={address}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none"
                placeholder="Enter your complete house number, street address, and ward details."
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                {t('auth.password_label')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                {t('auth.confirm_password_label')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-12 pr-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('auth.registering')}
                </div>
              ) : "Register Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
