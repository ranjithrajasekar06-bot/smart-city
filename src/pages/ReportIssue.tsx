import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "../context/AuthContext";
import { Camera, MapPin, AlertCircle, CheckCircle, Loader2, Sparkles, Navigation } from "lucide-react";
import { analyzeIssueImage } from "../services/gemini";
import { useTranslation } from "react-i18next";

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

const ReportIssue: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "pothole",
    latitude: 0,
    longitude: 0,
  });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [position, setPosition] = useState<[number, number] | null>(null);

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
        
        setFormData(prev => ({
          ...prev,
          title: analysis.title || prev.title,
          description: analysis.description || prev.description,
          category: analysis.category || prev.category
        }));
        setAnalyzing(false);
      };
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      setError("AI analysis failed. Please fill in the details manually.");
      setAnalyzing(false);
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        setFormData((prev) => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
      },
    });

    return position === null ? null : <Marker position={position} />;
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

    setLoading(true);
    setError("");

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("latitude", formData.latitude.toString());
    data.append("longitude", formData.longitude.toString());
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('report.form.category_label')}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="pothole">{t('issues.category.pothole')}</option>
                  <option value="garbage">{t('issues.category.garbage')}</option>
                  <option value="streetlight">{t('issues.category.streetlight')}</option>
                  <option value="water">{t('issues.category.water')}</option>
                  <option value="other">{t('issues.category.other')}</option>
                </select>
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
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('report.form.image_label')}</label>
                <div className="relative group">
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
                        <Camera className="h-10 w-10 text-gray-400 mb-2 group-hover:text-blue-500" />
                        <span className="text-sm text-gray-500 group-hover:text-blue-600 font-medium">{t('report.form.image_click')}</span>
                      </>
                    )}
                  </label>
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

