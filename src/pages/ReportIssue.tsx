import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "../context/AuthContext";
import { Camera, MapPin, AlertCircle, CheckCircle, Loader2, Sparkles, Navigation, RefreshCcw, X, Upload } from "lucide-react";
import { analyzeIssueImage } from "../services/gemini";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";

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
  const { t } = useTranslation();
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
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [position, setPosition] = useState<[number, number] | null>(null);

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
    }
  };

  const handleAIAnalysis = async () => {
    if (!preview) return;
    
    setAnalyzing(true);
    setError("");
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(image!);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const analysis = await analyzeIssueImage(base64data);
        
        // Check if category is in predefined list
        const isPredefined = categories.includes(analysis.category);
        
        setFormData(prev => ({
          ...prev,
          title: analysis.title || prev.title,
          description: analysis.description || prev.description,
          category: isPredefined ? analysis.category : "other",
          customCategory: !isPredefined ? analysis.category : ""
        }));
        setAnalyzing(false);
      };
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
          const { latitude, longitude } = pos.coords;
          const newPos: [number, number] = [latitude, longitude];
          setPosition(newPos);
          setFormData((prev) => ({ ...prev, latitude, longitude }));
          reverseGeocode(latitude, longitude);
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
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('report.success_title')}</h2>
          <p className="text-gray-600">{t('report.success_desc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-blue-50/50 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('report.title')}</h1>
            <p className="text-gray-600">{t('report.subtitle')}</p>
          </div>
          {preview && !analyzing && (
            <button
              onClick={handleAIAnalysis}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t('report.ai_analyze')}</span>
            </button>
          )}
          {analyzing && (
            <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('report.ai_analyzing')}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('report.form.title_label')}</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('report.form.title_placeholder')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Address</label>
                <textarea
                  required
                  rows={2}
                  value={formData.userAddress}
                  onChange={(e) => setFormData({ ...formData, userAddress: e.target.value })}
                  placeholder="Enter your full address"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pin Code</label>
                  <input
                    type="text"
                    required
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    placeholder="Pin Code"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('report.form.category_label')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{t(`issues.category.${cat}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Location</label>
                <input
                  type="text"
                  required
                  value={formData.issueLocation}
                  onChange={(e) => setFormData({ ...formData, issueLocation: e.target.value })}
                  placeholder="Street name or landmark"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formData.category === "other" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Custom Category Name</label>
                  <input
                    type="text"
                    required
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    placeholder="e.g., Abandoned Vehicle"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('report.form.image_label')}</label>
                <div className="relative group">
                  <AnimatePresence mode="wait">
                    {!isCameraActive ? (
                      <motion.div
                        key="upload-ui"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                              preview ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                            }`}
                          >
                            {preview ? (
                              <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <>
                                <Upload className="h-10 w-10 text-gray-400 mb-2 group-hover:text-blue-500" />
                                <span className="text-sm text-gray-500 group-hover:text-blue-600 font-medium">{t('report.form.image_click')}</span>
                              </>
                            )}
                          </label>
                          {preview && (
                            <button
                              type="button"
                              onClick={() => { setImage(null); setPreview(null); }}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="flex items-center space-x-2 text-blue-600 font-bold text-sm hover:underline"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Or capture real-time photo</span>
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="camera-ui"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-black rounded-xl overflow-hidden h-64 shadow-2xl"
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-6">
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all"
                          >
                            <X className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="p-4 bg-white text-blue-600 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all"
                          >
                            <Camera className="h-6 w-6" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { stopCamera(); startCamera(); }}
                            className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all"
                          >
                            <RefreshCcw className="h-5 w-5" />
                          </button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                  {t('report.form.location_label')}
                </label>
                <div className="relative h-48 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
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
                    className="absolute bottom-4 right-4 z-[1000] bg-white px-3 py-2 rounded-full shadow-lg hover:bg-gray-50 transition-all text-blue-600 border border-gray-100 flex items-center space-x-2"
                    title={t('report.locate_me')}
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    <span className="text-xs font-bold">{t('report.locate_me')}</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic">{t('report.form.location_hint')}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('report.form.desc_label')}</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('report.form.desc_placeholder')}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading || analyzing}
              className="bg-blue-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
    </div>
  );
};

export default ReportIssue;

