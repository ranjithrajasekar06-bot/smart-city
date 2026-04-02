/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "sonner";
import SyncManager from "./components/SyncManager";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import IssueList from "./pages/IssueList";
import IssueDetails from "./pages/IssueDetails";
import ReportIssue from "./pages/ReportIssue";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" richColors />
            <SyncManager />
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/issues" element={<IssueList />} />
                <Route path="/issues/:id" element={<IssueDetails />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/report" element={<ReportIssue />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute adminOnly />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                </Route>
              </Routes>
            </main>
            <footer className="bg-white border-t border-gray-200 py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} SmartCity Community Platform. All rights reserved.
              </div>
            </footer>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
