import { Navigate } from "react-router-dom";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export const isAuthenticated = () => false;
export const getCurrentUser = () => null;
export const logout = () => {};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      <p className="text-sm text-zinc-500">Loading...</p>
    </div>
  </div>
);

// Hook to check if the current user is a registered doctor
const useDoctorStatus = (email) => {
  const [status, setStatus] = useState({ loading: true, isDoctor: false });

  useEffect(() => {
    const check = async () => {
      if (!email) { setStatus({ loading: false, isDoctor: false }); return; }

      const cached = sessionStorage.getItem(`doctor_${email}`);
      if (cached !== null) {
        setStatus({ loading: false, isDoctor: cached === 'true' });
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/api/doctor/check/${encodeURIComponent(email)}`);
        const isDoc = res.data.isDoctor || false;
        sessionStorage.setItem(`doctor_${email}`, String(isDoc));
        setStatus({ loading: false, isDoctor: isDoc });
      } catch {
        setStatus({ loading: false, isDoctor: false });
      }
    };
    check();
  }, [email]);

  return status;
};

const useOnboardingStatus = (userId) => {
  const [status, setStatus] = useState({ loading: true, completed: false });

  useEffect(() => {
    const checkStatus = async () => {
      if (!userId) return;
      
      const localStatus = localStorage.getItem(`onboarding_${userId}`);
      if (localStatus === 'completed') {
        setStatus({ loading: false, completed: true });
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/guardian/status/${userId}`);
        const completed = response.data.onboardingCompleted || false;
        if (completed) localStorage.setItem(`onboarding_${userId}`, 'completed');
        setStatus({ loading: false, completed });
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setStatus({ loading: false, completed: false });
      }
    };

    checkStatus();
  }, [userId]);

  return status;
};

// Protected route with optional role check
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const { loading: doctorLoading, isDoctor } = useDoctorStatus(email);
  
  if (!isLoaded || doctorLoading) return <LoadingSpinner />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.publicMetadata?.role || 'Resident';
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to={isDoctor ? "/doctor-dashboard" : "/dashboard"} replace />;
    }
  }

  return children;
};

// Requires authentication only
export const AuthenticatedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <LoadingSpinner />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return children;
};

// Guest only - redirects signed-in users to the correct dashboard
export const GuestRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const { loading: doctorLoading, isDoctor } = useDoctorStatus(isSignedIn ? email : '');

  if (!isLoaded) return <LoadingSpinner />;
  
  if (isSignedIn) {
    if (doctorLoading) return <LoadingSpinner />;
    return <Navigate to={isDoctor ? "/doctor-dashboard" : "/dashboard"} replace />;
  }
  
  return children;
};

// Requires auth + onboarding; doctors are redirected to their own dashboard
export const OnboardingRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const { loading: doctorLoading, isDoctor } = useDoctorStatus(email);
  const { loading: onboardingLoading, completed: onboardingCompleted } = useOnboardingStatus(user?.id);
  
  if (!isLoaded) return <LoadingSpinner />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  if (doctorLoading) return <LoadingSpinner />;

  // Doctors should never see the guardian dashboard
  if (isDoctor) return <Navigate to="/doctor-dashboard" replace />;
  
  if (onboardingLoading) return <LoadingSpinner />;
  if (!onboardingCompleted) return <Navigate to="/onboarding" replace />;
  
  return children;
};

// Route only for doctors - redirects non-doctors to guardian dashboard
export const DoctorRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const { loading: doctorLoading, isDoctor } = useDoctorStatus(email);

  if (!isLoaded || doctorLoading) return <LoadingSpinner />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  if (!isDoctor) return <Navigate to="/dashboard" replace />;
  
  return children;
};

export default PrivateRoute;
