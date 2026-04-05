import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import "./index.css";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home"
import ChatPage from "./pages/ChatPage"
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCommunityPage from "./pages/admin/AdminCommunityPage"
import AdminEventPage from "./pages/admin/AdminEventPage"
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerBookings from "./pages/worker/WorkerBookings"
import WorkerServices from "./pages/worker/WorkerServices"

import PrivateRoute, { AuthenticatedRoute, GuestRoute, OnboardingRoute, DoctorRoute } from "./utils/PrivateRoute"; 
import Onboarding from "./pages/Onboarding";

import ResidentPosts from "./pages/resident/ResidentPosts"
import ResidentDashboard from "./pages/resident/ResidentDashboard";
import ResidentServices from "./pages/resident/ResidentServices"
import ResidentBookings from "./pages/resident/ResidentBookings"
import ResidentEvents from "./pages/resident/ResidentEvents"
import CommunityPage from "./pages/CommunityPage"

import Navbar from "./components/Navbar";
import WDetails from "./pages/worker/WDetails";
import RDetails from "./pages/resident/RDetails";

import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard"
import DoctorDashboard from "./pages/DoctorDashboard"

// Clerk Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file.");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home/>} />

          {/* Clerk Auth routes */}
          <Route path="/sign-in/*" element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          } />
          <Route path="/sign-up/*" element={
            <GuestRoute>
              <Signup />
            </GuestRoute>
          } />

          {/* Legacy routes - redirect to new Clerk routes */}
          <Route path="/login" element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          } />
          <Route path="/signup" element={
            <GuestRoute>
              <Signup />
            </GuestRoute>
          } />

          {/* Onboarding route - requires auth but NOT onboarding completion */}
          <Route path="/onboarding" element={
            <AuthenticatedRoute>
              <Onboarding />
            </AuthenticatedRoute>
          } />

          {/* Protected routes - require authentication AND onboarding completion */}
          <Route path="/dashboard" element={
            <OnboardingRoute>
              <ResidentDashboard />
            </OnboardingRoute>
          } />

          <Route path="/chatpage" element={
            <AuthenticatedRoute>
              <ChatPage/>
            </AuthenticatedRoute>
          } />

          <Route path="/worker-details" element={
            <AuthenticatedRoute>
              <WDetails/>
            </AuthenticatedRoute>
          } />

          <Route path="/resident-details" element={
            <AuthenticatedRoute>
              <RDetails/>
            </AuthenticatedRoute>
          } />

          <Route path="/super-admin" element={
            <PrivateRoute allowedRoles={["SuperAdmin"]}>
              <SuperAdminDashboard/>
            </PrivateRoute>
          } />

          <Route path="/patient-appointments" element={
            <PrivateRoute allowedRoles={["Patient"]}>
              <ResidentPosts />
            </PrivateRoute>
          } />

          <Route path="/resident-services" element={
            <PrivateRoute allowedRoles={["Resident"]}>
              <ResidentServices />
            </PrivateRoute>
          } />

          <Route path="/community" element={
            <PrivateRoute allowedRoles={["Resident"]}>
              <CommunityPage/>
            </PrivateRoute>
          } />

          <Route path="/resident-bookings" element={
            <PrivateRoute allowedRoles={["Resident"]}>
              <ResidentBookings />
            </PrivateRoute>
          } />
          
          <Route path="/resident-events" element={
            <PrivateRoute allowedRoles={["Resident"]}>
              <ResidentEvents />
            </PrivateRoute>
          } />

          {/* Doctor Dashboard - only accessible to registered doctors */}
          <Route path="/doctor-dashboard" element={
            <DoctorRoute>
              <DoctorDashboard />
            </DoctorRoute>
          } />

          <Route path="/worker-services" element={
            <PrivateRoute allowedRoles={["Doctor"]}>
              <WorkerServices/>
            </PrivateRoute>
          } />

          <Route path="/doctor-appointment" element={
            <PrivateRoute allowedRoles={["Doctor"]}>
              <WorkerBookings />
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          } />

          <Route path="/admin-users" element={
            <PrivateRoute allowedRoles={["Admin"]}>
              <AdminUsers/>
            </PrivateRoute>
          } />

          <Route path="/admin-communities" element={
            <PrivateRoute allowedRoles={["Admin"]}>
              <AdminCommunityPage/>
            </PrivateRoute>
          } />

          <Route path="/admin-events" element={
            <PrivateRoute allowedRoles={["Admin"]}>
              <AdminEventPage/>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </ClerkProvider>
    </I18nextProvider>
  </React.StrictMode>
);
