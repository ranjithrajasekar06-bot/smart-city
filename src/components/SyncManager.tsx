import React, { useEffect, useState } from 'react';
import { getAllOfflineReports, deleteOfflineReport, OfflineReport } from '../services/offlineStorage';
import api from '../services/api';
import { toast } from 'sonner';
import { CloudUpload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SyncManager: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for pending reports
    checkPendingReports();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingReports = async () => {
    const reports = await getAllOfflineReports();
    setPendingCount(reports.length);
    if (reports.length > 0) {
      setShowStatus(true);
    }
  };

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      syncReports();
    }
  }, [isOnline, pendingCount, isSyncing]);

  const syncReports = async () => {
    setIsSyncing(true);
    const reports = await getAllOfflineReports();
    
    let successCount = 0;
    let failCount = 0;

    for (const report of reports) {
      try {
        const formData = new FormData();
        formData.append('title', report.title);
        formData.append('description', report.description);
        formData.append('category', report.category);
        formData.append('latitude', report.latitude.toString());
        formData.append('longitude', report.longitude.toString());
        formData.append('user_address', report.user_address);
        formData.append('issue_location', report.issue_location);
        formData.append('pin_code', report.pin_code);
        formData.append('severity', report.severity);
        formData.append('urgency', report.urgency);
        formData.append('keywords', JSON.stringify(report.keywords));
        
        // Convert Blob back to File
        const file = new File([report.imageBlob], report.imageName, { type: report.imageBlob.type });
        formData.append('image', file);

        await api.post('/issues', formData);
        await deleteOfflineReport(report.id!);
        successCount++;
      } catch (error) {
        console.error('Failed to sync report:', error);
        failCount++;
      }
    }

    setIsSyncing(false);
    checkPendingReports();

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} offline reports!`);
    }
    if (failCount > 0) {
      toast.error(`Failed to sync ${failCount} reports. Will retry later.`);
    }

    // Hide status after a delay if all synced
    if (failCount === 0) {
      setTimeout(() => setShowStatus(false), 5000);
    }
  };

  if (!showStatus && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 right-4 z-[9999] max-w-xs w-full"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${isSyncing ? 'bg-blue-100' : 'bg-yellow-100'}`}>
              {isSyncing ? (
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              ) : (
                <CloudUpload className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-900">
                {isSyncing ? 'Syncing Reports...' : 'Offline Reports Pending'}
              </h4>
              <p className="text-xs text-gray-500">
                {pendingCount} report{pendingCount !== 1 ? 's' : ''} waiting to be uploaded.
              </p>
            </div>
            {!isSyncing && isOnline && (
              <button
                onClick={syncReports}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Sync Now
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SyncManager;
