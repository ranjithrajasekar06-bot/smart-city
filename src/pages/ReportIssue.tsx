import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "../context/AuthContext";
import { Camera, MapPin, AlertCircle, CheckCircle, Loader2, Sparkles, Navigation, RefreshCcw, X, Upload } from "lucide-react";
import { analyzeIssueImage, analyzeIssueDescription } from "../services/gemini";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, Zap, Tag, WifiOff, CloudOff, ZoomIn, Trash2, Eye } from "lucide-react";
import { saveOfflineReport } from "../services/offlineStorage";
import { TN_DISTRICTS } from "../data/tnDistricts";

// Fix for default marker icons in Leaflet with React
const markerIcon = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const markerShadow = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom pulsing icon for the selected location
const pulsingIcon = L.divIcon({
  className: 'custom-pulsing-icon',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-25"></div>
      <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const ReportIssue: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "pothole",
    customCategory: "",
    latitude: 0,
    longitude: 0,
    userAddress: "",
    issueLocation: "",
    pinCode: "",
    severity: "medium",
    urgency: "medium",
    keywords: [] as string[],
    district: "",
    taluk: "",
  });

  const [availableTaluks, setAvailableTaluks] = useState<any[]>([]);

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
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [captureMethod, setCaptureMethod] = useState<"upload" | "camera" | null>(null);
  const [aiAnalyzed, setAiAnalyzed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [position, setPosition] = useState<[number, number] | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    if (isLightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        district: prev.district || user.district || "",
        taluk: prev.taluk || user.taluk || "",
      }));
    }
  }, [user]);

  // Sync available taluks when district changes
  useEffect(() => {
    const selected = TN_DISTRICTS.find(d => d.districtName.en === formData.district);
    if (selected) {
      setAvailableTaluks(selected.taluks);
      setFormData(prev => {
        const talukExists = selected.taluks.some(t => t.en === prev.taluk);
        if (talukExists) {
          return prev;
        }
        return { ...prev, taluk: selected.taluks[0]?.en || "" };
      });
    } else {
      setAvailableTaluks([]);
      setFormData(prev => ({ ...prev, taluk: "" }));
    }
  }, [formData.district]);

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `captured-issue-${Date.now()}.jpg`, { type: "image/jpeg" });
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setCaptureMethod("camera");
            setAiAnalyzed(false);
            stopCamera();
            playFeedback();
          }
        }, "image/jpeg", 0.8);
      }
    }
  };

  const playFeedback = () => {
    // Haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    
    // Subtle sound cue using Web Audio API to avoid external assets
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio feedback failed", e);
    }
  };

  useEffect(() => {
    // Get user's current location initially
    handleLocateMe();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setCaptureMethod("upload");
      setAiAnalyzed(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!preview && !formData.description) return;
    
    setAnalyzing(true);
    setError("");
    
    try {
      let imageAnalysis: any = {};
      let textAnalysis: any = {};

      // 1. Analyze Image if available
      if (image) {
        const reader = new FileReader();
        const imagePromise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(image);
        });
        const base64data = await imagePromise as string;
        imageAnalysis = await analyzeIssueImage(base64data);
      }

      // 2. Analyze Description if available
      if (formData.description) {
        textAnalysis = await analyzeIssueDescription(formData.description);
      }

      // Merge results
      const isPredefined = categories.includes(imageAnalysis.category);
      
      setFormData(prev => ({
        ...prev,
        title: imageAnalysis.title || prev.title,
        description: imageAnalysis.description || prev.description,
        category: isPredefined ? imageAnalysis.category : (prev.category || "other"),
        customCategory: !isPredefined && imageAnalysis.category ? imageAnalysis.category : prev.customCategory,
        severity: textAnalysis.severity || imageAnalysis.severity || prev.severity,
        urgency: textAnalysis.urgency || prev.urgency,
        keywords: textAnalysis.keywords || prev.keywords
      }));

      if (textAnalysis.is_emergency) {
        setIsEmergency(true);
      } else {
        setIsEmergency(false);
      }

      setAnalyzing(false);
      setAiAnalyzed(true);
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      setError("AI analysis failed. Please fill in the details manually.");
      setAnalyzing(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.address) {
        const address = data.address;
        // Try to build a more concise location string
        const street = address.road || address.pedestrian || address.suburb || address.neighbourhood || "";
        const city = address.city || address.town || address.village || "";
        const locationStr = street && city ? `${street}, ${city}` : street || city || data.display_name;

        setFormData(prev => ({
          ...prev,
          issueLocation: locationStr,
          pinCode: address.postcode || prev.pinCode
        }));
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        setFormData((prev) => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
        reverseGeocode(e.latlng.lat, e.latlng.lng);
        setLocationAccuracy(null);
        playFeedback();
      },
    });

    return position === null ? null : <Marker position={position} icon={pulsingIcon} />;
  };

  const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.flyTo(center, 15);
      }
    }, [center, map]);
    return null;
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const newPos: [number, number] = [latitude, longitude];
          setPosition(newPos);
          setFormData((prev) => ({ ...prev, latitude, longitude }));
          reverseGeocode(latitude, longitude);
          setLocationAccuracy(accuracy);
          setIsLocating(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError(t('report.error_geolocation'));
          // Default to a city center if location fails (e.g., London)
          if (!position) {
            setPosition([51.505, -0.09]);
            setFormData((prev) => ({ ...prev, latitude: 51.505, longitude: -0.09 }));
          }
          setLocationAccuracy(null);
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError(t('report.error_unsupported'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return setError(t('report.error_image'));
    if (!position) return setError(t('report.error_location'));

    const finalCategory = formData.category === "other" ? formData.customCategory : formData.category;
    if (!finalCategory) return setError("Please specify a category");

    setLoading(true);
    setError("");

    if (!formData.district) return setError("Please select a District");
    if (!formData.taluk) return setError("Please select a Taluk");

    if (!isOnline) {
      try {
        await saveOfflineReport({
          title: formData.title,
          description: formData.description,
          category: finalCategory,
          latitude: formData.latitude,
          longitude: formData.longitude,
          user_address: formData.userAddress,
          issue_location: formData.issueLocation,
          pin_code: formData.pinCode,
          severity: formData.severity,
          urgency: formData.urgency,
          keywords: formData.keywords,
          district: formData.district,
          taluk: formData.taluk,
          imageBlob: image,
          imageName: image.name,
          timestamp: Date.now()
        });
        setIsOfflineMode(true);
        setSuccess(true);
        setTimeout(() => navigate("/issues"), 3000);
        return;
      } catch (err) {
        console.error("Error saving offline report:", err);
        setError("Failed to save report offline. Please try again.");
        setLoading(false);
        return;
      }
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", finalCategory);
    data.append("latitude", formData.latitude.toString());
    data.append("longitude", formData.longitude.toString());
    data.append("user_address", formData.userAddress);
    data.append("issue_location", formData.issueLocation);
    data.append("pin_code", formData.pinCode);
    data.append("image", image);
    data.append("severity", formData.severity);
    data.append("urgency", formData.urgency);
    data.append("keywords", JSON.stringify(formData.keywords));
    data.append("district", formData.district);
    data.append("taluk", formData.taluk);

    try {
      console.log("Submitting issue with user:", user?.name);
      await api.post("/issues", data);
      setSuccess(true);
      setTimeout(() => navigate("/issues"), 2000);
    } catch (err: any) {
      console.error("Error reporting issue:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to report issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
            {isOfflineMode ? (
              <CloudOff className="h-10 w-10 text-blue-600" />
            ) : (
              <CheckCircle className="h-10 w-10 text-green-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isOfflineMode ? "Saved Offline" : t('report.success_title')}
          </h2>
          <p className="text-gray-600">
            {isOfflineMode 
              ? "You are currently offline. Your report has been saved locally and will automatically sync when you are back online."
              : t('report.success_desc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-blue-100/50 border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">{t('report.title')}</h1>
              <p className="text-blue-100 text-base md:text-lg font-medium max-w-2xl">{t('report.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {preview && !analyzing && (
                <button
                  type="button"
                  onClick={handleAIAnalysis}
                  className="flex items-center space-x-2 bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-white/30 transition-all shadow-lg border border-white/30 active:scale-95"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{t('report.ai_analyze')}</span>
                </button>
              )}
              {analyzing && (
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest border border-white/30">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('report.ai_analyzing')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-12 space-y-8 md:space-y-10">
          {isEmergency && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-600 text-white p-6 rounded-2xl shadow-xl flex items-start space-x-4 border-2 border-red-400"
            >
              <div className="bg-white/20 p-2 rounded-xl">
                <ShieldAlert className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black uppercase tracking-tight mb-1">Emergency Detected</h3>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  Our AI analysis has identified this as a potential life-threatening emergency. 
                  <span className="block mt-2 font-black underline decoration-2 underline-offset-4">
                    PLEASE CALL EMERGENCY SERVICES (911/112) IMMEDIATELY IF THERE IS AN IMMEDIATE DANGER TO LIFE OR PROPERTY.
                  </span>
                </p>
                <button 
                  type="button"
                  onClick={() => setIsEmergency(false)}
                  className="mt-4 text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors border border-white/20"
                >
                  Dismiss Warning
                </button>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-start space-x-3 rounded-r-xl">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-6 md:space-y-8">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('report.form.title_label')}</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('report.form.title_placeholder')}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Your Address</label>
                <textarea
                  required
                  rows={2}
                  value={formData.userAddress}
                  onChange={(e) => setFormData({ ...formData, userAddress: e.target.value })}
                  placeholder="Enter your full address"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('fields.district')}</label>
                  <select
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all font-medium appearance-none"
                  >
                    <option value="">{t('fields.district')}</option>
                    {TN_DISTRICTS.map((d: any) => (
                      <option key={d.districtName.en} value={d.districtName.en}>
                        {i18n.language === 'ta' ? d.districtName.ta : d.districtName.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('fields.taluk')}</label>
                  <select
                    required
                    value={formData.taluk}
                    onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                    disabled={!formData.district}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all font-medium appearance-none disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">{t('fields.taluk')}</option>
                    {availableTaluks.map((t: any) => (
                      <option key={t.en} value={t.en}>
                        {i18n.language === 'ta' ? t.ta : t.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pin Code</label>
                  <input
                    type="text"
                    required
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    placeholder="Pin Code"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('report.form.category_label')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all font-medium appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{t(`issues.category.${cat}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Issue Location</label>
                <input
                  type="text"
                  required
                  value={formData.issueLocation}
                  onChange={(e) => setFormData({ ...formData, issueLocation: e.target.value })}
                  placeholder="Street name or landmark"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>

              {formData.category === "other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Custom Category Name</label>
                  <input
                    type="text"
                    required
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    placeholder="e.g., Abandoned Vehicle"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                </motion.div>
              )}
            </div>

            <div className="space-y-6 md:space-y-8">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('report.form.image_label')}</label>
                <div className="relative group">
                  <AnimatePresence mode="wait">
                    {!isCameraActive ? (
                      preview ? (
                        <motion.div
                          key="preview-card"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white border text-left border-slate-200/90 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center gap-4 md:gap-5 shadow-lg shadow-slate-100/40 relative group overflow-hidden w-full"
                        >
                          {/* Inner soft background gradient/glow */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-transparent to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                          {/* Thumbnail Frame */}
                          <div className="relative w-28 h-28 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl overflow-hidden shadow-md border border-slate-200 flex-shrink-0 group/img bg-slate-150">
                            <img 
                              src={preview} 
                              alt="Selected report issue" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" 
                            />
                            {/* Hover Overlay Zoom */}
                            <button
                              type="button"
                              onClick={() => setIsLightboxOpen(true)}
                              className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1.5 text-white border-0 cursor-pointer w-full h-full"
                              title="Zoom In"
                            >
                              <Eye className="h-5 w-5 animate-pulse text-white" />
                              <span className="text-[9px] font-black tracking-widest text-slate-100 uppercase">
                                {i18n.language === "ta" ? "பெரிதாக்கு" : "Zoom In"}
                              </span>
                            </button>
                          </div>

                          {/* Detail / Action Column */}
                          <div className="flex-1 min-w-0 w-full relative z-10">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {/* Source Device / Image Type Badge */}
                              {captureMethod === "camera" ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-150 animate-pulse">
                                  <Camera className="h-3 w-3 text-emerald-600 mr-0.5" />
                                  <span>{i18n.language === "ta" ? "நேரடி கேமரா" : "Live Camera"}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-150">
                                  <Upload className="h-3 w-3 text-blue-600 mr-0.5" />
                                  <span>{i18n.language === "ta" ? "கணினி கோப்பு" : "Local File"}</span>
                                </span>
                              )}

                              {/* AI State badge */}
                              {aiAnalyzed && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                  <Sparkles className="h-2.5 w-2.5 text-purple-500 mr-0.5" />
                                  <span>{i18n.language === "ta" ? "AI பகுப்பாய்வு" : "AI Analyzed"}</span>
                                </span>
                              )}
                            </div>

                            {/* Filename and Meta Details */}
                            <h4 className="text-sm font-bold text-slate-800 truncate mb-1 pr-6" title={image?.name || "captured-report.jpg"}>
                              {image?.name || "captured-report.jpg"}
                            </h4>

                            <div className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                              <span>{(image?.size ? (image.size / 1024).toFixed(1) + " KB" : "Live image")}</span>
                              <span className="text-slate-200">•</span>
                              <span>{image?.type?.split('/')[1] || "jpeg"}</span>
                            </div>

                            {/* Divider line */}
                            <div className="h-px bg-slate-100 my-2.5" />

                            {/* Actions bar */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Option to Trigger AI Analysis right here */}
                              {!aiAnalyzed && !analyzing ? (
                                <button
                                  type="button"
                                  onClick={handleAIAnalysis}
                                  className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm active:translate-y-0 cursor-pointer"
                                >
                                  <Sparkles className="h-3 w-3 animate-pulse text-purple-500 mr-0.5" />
                                  <span>{i18n.language === "ta" ? "AI பகுப்பாய்வு" : "Optimize with AI"}</span>
                                </button>
                              ) : analyzing ? (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100/50 border border-purple-200 px-2.5 py-1.5 rounded-lg">
                                  <Loader2 className="h-3 w-3 animate-spin text-purple-600 mr-0.5" />
                                  <span>{i18n.language === "ta" ? "AI பகுப்பாய்வு செய்கிறது..." : "Analyzing..."}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                                  <CheckCircle className="h-3 w-3 text-emerald-600 mr-0.5" />
                                  <span>{i18n.language === "ta" ? "படிவம் நிரப்பப்பட்டது" : "AI Autofilled"}</span>
                                </span>
                              )}

                              {/* Upload Different Option */}
                              <label className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95 duration-150 cursor-pointer">
                                <Upload className="h-3 w-3 mr-0.5" />
                                <span>{i18n.language === "ta" ? "மாற்று கோப்பு" : "Choose Other"}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                              </label>

                              {/* Recapture if camera is preferred */}
                              <button
                                type="button"
                                onClick={startCamera}
                                className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95 duration-150 cursor-pointer"
                              >
                                <Camera className="h-3 w-3 mr-0.5" />
                                <span>{i18n.language === "ta" ? "மீண்டும் எடுக்குக" : "Recapture"}</span>
                              </button>

                              {/* Remove completely */}
                              <button
                                type="button"
                                onClick={() => {
                                  setImage(null);
                                  setPreview(null);
                                  setCaptureMethod(null);
                                  setAiAnalyzed(false);
                                }}
                                className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-red-650 hover:bg-red-50 hover:text-red-750 border border-transparent hover:border-red-100 px-2.5 py-1.5 rounded-lg transition-all ml-auto cursor-pointer"
                                title="Remove Image"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-0.5" />
                                <span className="hidden xs:inline">{i18n.language === "ta" ? "நீக்குக" : "Remove"}</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="upload-ui"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4 w-full"
                        >
                          <div className="relative h-48 md:h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 w-full">
                            <label className="cursor-pointer flex flex-col items-center p-6 text-center w-full h-full justify-center">
                              <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="h-8 w-8 text-blue-600" />
                              </div>
                              <span className="text-sm font-bold text-slate-600">{t('report.form.image_click')}</span>
                              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">JPG, PNG up to 5MB</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="flex items-center space-x-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:underline whitespace-nowrap"
                            >
                              <Camera className="h-4 w-4" />
                              <span>{i18n.language === "ta" ? "நேரடி புகைப்படம் எடுக்கவும்" : "Or capture real-time photo"}</span>
                            </button>
                          </div>
                        </motion.div>
                      )
                    ) : (
                      <motion.div
                        key="camera-ui"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-black rounded-2xl overflow-hidden h-48 md:h-64 shadow-2xl"
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-4 md:space-x-6">
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="p-2.5 md:p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all"
                          >
                            <X className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="p-3.5 md:p-4 bg-white text-blue-600 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all"
                          >
                            <Camera className="h-5 w-5 md:h-6 md:w-6" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { stopCamera(); startCamera(); }}
                            className="p-2.5 md:p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all"
                          >
                            <RefreshCcw className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                  {t('report.form.location_label')}
                </label>
                <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                  {position && (
                    <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker />
                      <MapUpdater center={position} />
                    </MapContainer>
                  )}
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="absolute bottom-4 right-4 z-[1000] bg-white px-3 py-2 rounded-full shadow-lg hover:bg-slate-50 transition-all text-blue-600 border border-slate-100 flex items-center space-x-2"
                    title={t('report.locate_me')}
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('report.locate_me')}</span>
                  </button>
                </div>

                {/* Geolocation Accuracy Visual Indicator */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isLocating ? 'bg-blue-400' :
                        locationAccuracy === null ? 'bg-amber-400' :
                        locationAccuracy <= 15 ? 'bg-emerald-400' :
                        locationAccuracy <= 50 ? 'bg-yellow-400' : 'bg-rose-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        isLocating ? 'bg-blue-500' :
                        locationAccuracy === null ? 'bg-amber-500' :
                        locationAccuracy <= 15 ? 'bg-emerald-500' :
                        locationAccuracy <= 50 ? 'bg-yellow-500' : 'bg-rose-500'
                      }`}></span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {i18n.language === "ta" ? "ஜிபிஎஸ் துல்லியம்" : "GPS Accuracy"}
                      </span>
                      <span className="text-xs font-bold text-slate-700 flex flex-wrap items-center gap-2">
                        {isLocating ? (
                          <span className="text-slate-400 animate-pulse">
                            {i18n.language === "ta" ? "கணக்கிடப்படுகிறது..." : "Calculating..."}
                          </span>
                        ) : locationAccuracy === null ? (
                          <span className="text-slate-500">
                            {i18n.language === "ta" ? "கைமுறை வரைபடம் (தனிப்பயன் இடம்)" : "Manual Pin (Custom Location)"}
                          </span>
                        ) : (
                          <>
                            <span className="font-mono text-slate-800">{locationAccuracy.toFixed(1)}m</span>
                            <span className={`inline-flex items-center text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${
                              locationAccuracy <= 15 ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                              locationAccuracy <= 50 ? 'bg-yellow-50 text-yellow-700 border border-yellow-150' :
                              'bg-rose-50 text-rose-700 border border-rose-150'
                            }`}>
                              {locationAccuracy <= 15 ? (i18n.language === "ta" ? "மிக நன்று" : "Excellent") :
                               locationAccuracy <= 50 ? (i18n.language === "ta" ? "மிதமானது" : "Moderate") :
                               (i18n.language === "ta" ? "குறைவானது" : "Poor")}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer animate-fade-in"
                  >
                    <RefreshCcw className={`h-3 w-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{i18n.language === "ta" ? "ஜிபிஎஸ் புதுப்பி" : "Refresh GPS"}</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 mt-2 italic">{t('report.form.location_hint')}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('report.form.desc_label')}</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('report.form.desc_placeholder')}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Severity</label>
              <div className="flex items-center space-x-2">
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all font-medium appearance-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <div className={`p-3 rounded-xl ${
                  formData.severity === 'high' ? 'bg-red-100 text-red-600' : 
                  formData.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">How severe is the physical damage or impact?</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Urgency</label>
              <div className="flex items-center space-x-2">
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all font-medium appearance-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <div className={`p-3 rounded-xl ${
                  formData.urgency === 'critical' ? 'bg-red-200 text-red-700 animate-pulse' :
                  formData.urgency === 'high' ? 'bg-red-100 text-red-600' : 
                  formData.urgency === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">How quickly does this need to be addressed?</p>
            </div>
          </div>

          {/* NLP Analysis Results */}
          <AnimatePresence>
            {(formData.keywords.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex items-center space-x-3">
                  <Tag className="h-5 w-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detected Keywords</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {formData.keywords.map((kw, idx) => (
                        <span key={idx} className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading || analyzing}
              className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {t('report.form.submitting')}
                </>
              ) : (
                t('report.form.submit')
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Modal for Premium Image Preview */}
      <AnimatePresence>
        {isLightboxOpen && preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10 shadow-lg cursor-pointer z-50"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Scale Image */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-white/10 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()} // Prevent click through to backdrop
            >
              <img
                src={preview}
                alt="Enlarged issue preview"
                className="max-w-full max-h-[80vh] object-contain"
              />
              {/* Optional footer metadata inside lightbox */}
              <div className="absolute bottom-0 left-0 right-0 bg-slate-900/85 backdrop-blur-sm px-5 py-3 border-t border-white/5 flex items-center justify-between text-white">
                <span className="text-xs font-bold truncate pr-4">{image?.name || "captured-photo.jpg"}</span>
                <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 bg-white/10 px-2 py-0.5 rounded uppercase">
                  {image?.size ? (image.size / 1024).toFixed(1) + " KB" : ""}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportIssue;

