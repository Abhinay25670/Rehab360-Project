import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaUserMd,
  FaUsers,
  FaExclamationTriangle,
  FaCalendarPlus,
  FaChartLine,
  FaVideo,
  FaMapMarkerAlt,
  FaClock,
  FaArrowLeft,
  FaCheck,
  FaTimes,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaBars,
  FaClipboardList,
  FaHeartbeat,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaFilter,
  FaCog
} from 'react-icons/fa';
import { API_BASE_URL } from '../config/api';
import BrandLogo from '../components/BrandLogo';

const DoctorDashboard = () => {
  const { user, isLoaded } = useUser();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('patients');
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [meetingFilter, setMeetingFilter] = useState('all');
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    startTime: '09:00',
    endTime: '09:30',
    meetingType: 'video',
    meetingLink: '',
    locationAddress: '',
    locationCity: '',
    locationNotes: '',
    reason: ''
  });

  // Theme colors
  const theme = darkMode ? {
    bg: 'bg-zinc-900',
    card: 'bg-zinc-800',
    text: 'text-white',
    textMuted: 'text-zinc-400',
    border: 'border-zinc-700',
    hover: 'hover:bg-zinc-700',
    input: 'bg-zinc-700 border-zinc-600 text-white'
  } : {
    bg: 'bg-zinc-50',
    card: 'bg-white',
    text: 'text-zinc-900',
    textMuted: 'text-zinc-500',
    border: 'border-zinc-200',
    hover: 'hover:bg-zinc-100',
    input: 'bg-white border-zinc-300 text-zinc-900'
  };

  // Get doctor email from Clerk user
  const doctorEmail = user?.primaryEmailAddress?.emailAddress || '';

  // Fetch doctor data
  useEffect(() => {
    if (isLoaded && doctorEmail) {
      fetchDoctorData();
    }
  }, [isLoaded, doctorEmail]);

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      // Activate doctor profile with Clerk userId
      try {
        await axios.put(`${API_BASE_URL}/api/doctor/profile`, {
          email: doctorEmail,
          name: user?.fullName || '',
          clerkUserId: user?.id || ''
        });
      } catch (profileErr) {
        console.log('Doctor profile activation skipped:', profileErr.message);
      }

      // Fetch patients
      const patientsRes = await axios.get(`${API_BASE_URL}/api/doctor/patients/${doctorEmail}`);
      if (patientsRes.data.success) {
        setPatients(patientsRes.data.data.patients || []);
        setDoctorProfile(patientsRes.data.data.doctor);
      }

      // Fetch meetings
      const meetingsRes = await axios.get(`${API_BASE_URL}/api/doctor/meetings/${doctorEmail}`);
      if (meetingsRes.data.success) {
        setMeetings(meetingsRes.data.data || []);
      }

      // Fetch doctor profile for availability
      try {
        const profileRes = await axios.get(`${API_BASE_URL}/api/doctor/profile/${doctorEmail}`);
        if (profileRes.data.success && profileRes.data.data) {
          setAvailabilitySlots(profileRes.data.data.availabilitySlots || getDefaultAvailability());
        }
      } catch (e) {
        setAvailabilitySlots(getDefaultAvailability());
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAvailability = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames.map((_, idx) => ({
      dayOfWeek: idx,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: idx >= 1 && idx <= 5
    }));
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/doctor/availability`, {
        email: doctorEmail,
        availabilitySlots
      });
      if (res.data.success) {
        toast.success('Availability updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update availability');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/doctor/meeting/${meetingId}`);
      if (res.data.success) {
        toast.success('Meeting cancelled');
        fetchDoctorData();
      }
    } catch (error) {
      toast.error('Failed to cancel meeting');
    }
  };

  const handleCompleteMeeting = async (meetingId) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/doctor/meeting/${meetingId}`, { status: 'completed' });
      if (res.data.success) {
        toast.success('Meeting marked as completed');
        fetchDoctorData();
      }
    } catch (error) {
      toast.error('Failed to update meeting');
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = !searchQuery || 
      p.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.guardianName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.guardianEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' || p.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const filteredMeetings = meetings.filter(m => {
    if (meetingFilter === 'all') return true;
    if (meetingFilter === 'upcoming') return ['scheduled', 'confirmed'].includes(m.status) && new Date(m.scheduledDate) >= new Date(new Date().setHours(0,0,0,0));
    return m.status === meetingFilter;
  });

  const fetchPatientDetails = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/doctor/patient/${userId}?doctorEmail=${doctorEmail}`);
      if (res.data.success) {
        setPatientDetails(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast.error('Failed to load patient details');
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    fetchPatientDetails(patient.userId);
    setActiveTab('patient-details');
  };

  const handleScheduleMeeting = async () => {
    if (!selectedPatient) return;

    try {
      const meetingData = {
        doctorEmail,
        doctorName: doctorProfile?.name || user?.fullName || '',
        patientUserId: selectedPatient.userId,
        scheduledDate: scheduleForm.scheduledDate,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        meetingType: scheduleForm.meetingType,
        meetingLink: scheduleForm.meetingType === 'video' ? scheduleForm.meetingLink : '',
        location: scheduleForm.meetingType === 'in-person' ? {
          address: scheduleForm.locationAddress,
          city: scheduleForm.locationCity,
          notes: scheduleForm.locationNotes
        } : {},
        reason: scheduleForm.reason
      };

      const res = await axios.post(`${API_BASE_URL}/api/doctor/meeting`, meetingData);
      
      if (res.data.success) {
        toast.success('Meeting scheduled successfully! Guardian has been notified.');
        setShowScheduleModal(false);
        setScheduleForm({
          scheduledDate: '',
          startTime: '09:00',
          endTime: '09:30',
          meetingType: 'video',
          meetingLink: '',
          locationAddress: '',
          locationCity: '',
          locationNotes: '',
          reason: ''
        });
        fetchDoctorData();
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule meeting');
    }
  };

  const getRiskBadge = (riskLevel) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      moderate: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      unknown: 'bg-zinc-100 text-zinc-700 border-zinc-200'
    };
    return colors[riskLevel] || colors.unknown;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      <ToastContainer position="top-right" autoClose={3000} theme={darkMode ? 'dark' : 'light'} />
      
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-14 ${theme.card} border-b ${theme.border} z-50 flex items-center justify-between px-4`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg ${theme.hover}`}
          >
            <FaBars className={theme.textMuted} />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${darkMode ? 'bg-zinc-100' : 'bg-zinc-900'}`}>
              <BrandLogo variant={darkMode ? 'onLight' : 'onDark'} size="sm" />
            </div>
            <FaUserMd className="text-blue-600 text-xl" />
            <span className={`font-semibold ${theme.text}`}>Doctor Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${theme.hover}`}
          >
            {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className={theme.textMuted} />}
          </button>
          <span className={`text-sm ${theme.textMuted}`}>{doctorProfile?.name || user?.fullName || doctorEmail}</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-14 bottom-0 ${sidebarOpen ? 'w-64' : 'w-0'} ${theme.card} border-r ${theme.border} transition-all duration-300 overflow-hidden z-40`}>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => { setActiveTab('patients'); setSelectedPatient(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'patients' ? 'bg-blue-600 text-white' : `${theme.text} ${theme.hover}`
            }`}
          >
            <FaUsers />
            <span>Patients</span>
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'meetings' ? 'bg-blue-600 text-white' : `${theme.text} ${theme.hover}`
            }`}
          >
            <FaCalendarAlt />
            <span>Meetings</span>
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'availability' ? 'bg-blue-600 text-white' : `${theme.text} ${theme.hover}`
            }`}
          >
            <FaCog />
            <span>Availability</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pt-14 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 p-6`}>
        
        {/* Patients List */}
        {activeTab === 'patients' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className={`text-2xl font-bold ${theme.text}`}>Your Patients</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted} text-sm`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients..."
                    className={`pl-9 pr-4 py-2 rounded-lg border text-sm ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500 w-56`}
                  />
                </div>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="all">All Risk</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="moderate">Moderate</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {patients.length === 0 ? (
              <div className={`${theme.card} rounded-xl p-12 text-center border ${theme.border}`}>
                <FaUsers className={`text-5xl ${theme.textMuted} mx-auto mb-4`} />
                <h2 className={`text-xl font-semibold ${theme.text} mb-2`}>No Patients Yet</h2>
                <p className={theme.textMuted}>
                  Patients will appear here when guardians add you as their treating physician.
                </p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className={`${theme.card} rounded-xl p-8 text-center border ${theme.border}`}>
                <FaSearch className={`text-3xl ${theme.textMuted} mx-auto mb-3`} />
                <p className={theme.textMuted}>No patients match your search or filter.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                <p className={`text-sm ${theme.textMuted}`}>
                  Showing {filteredPatients.length} of {patients.length} patients
                </p>
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.userId}
                    onClick={() => handlePatientSelect(patient)}
                    className={`${theme.card} rounded-xl p-5 border ${theme.border} cursor-pointer ${theme.hover} transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaHeartbeat className="text-blue-600 text-xl" />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${theme.text}`}>{patient.patientName}</h3>
                          <p className={`text-sm ${theme.textMuted}`}>Guardian: {patient.guardianName || patient.guardianEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskBadge(patient.riskLevel)}`}>
                          {patient.riskLevel?.toUpperCase() || 'UNKNOWN'} RISK
                        </span>
                        {patient.latestRiskScore && (
                          <span className={`text-sm ${theme.textMuted}`}>
                            Score: {patient.latestRiskScore}/100
                          </span>
                        )}
                      </div>
                    </div>
                    {patient.recentAlertCount > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-amber-600">
                        <FaExclamationTriangle />
                        <span className="text-sm">{patient.recentAlertCount} alerts in last 7 days</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Patient Details */}
        {activeTab === 'patient-details' && selectedPatient && (
          <div>
            <button
              onClick={() => { setActiveTab('patients'); setSelectedPatient(null); setPatientDetails(null); }}
              className={`flex items-center gap-2 ${theme.textMuted} mb-4 ${theme.hover} px-3 py-2 rounded-lg`}
            >
              <FaArrowLeft /> Back to Patients
            </button>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaHeartbeat className="text-blue-600 text-2xl" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${theme.text}`}>{selectedPatient.patientName}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskBadge(selectedPatient.riskLevel)}`}>
                    {selectedPatient.riskLevel?.toUpperCase()} RISK
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaCalendarPlus /> Schedule Meeting
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Guardian Info */}
              <div className={`${theme.card} rounded-xl p-5 border ${theme.border}`}>
                <h3 className={`font-semibold ${theme.text} mb-4`}>Guardian Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FaUsers className={theme.textMuted} />
                    <span className={theme.text}>{patientDetails?.guardian?.name || selectedPatient.guardianName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaEnvelope className={theme.textMuted} />
                    <span className={`text-sm ${theme.textMuted}`}>{patientDetails?.guardian?.email || selectedPatient.guardianEmail}</span>
                  </div>
                  {patientDetails?.guardian?.phone && (
                    <div className="flex items-center gap-3">
                      <FaPhone className={theme.textMuted} />
                      <span className={`text-sm ${theme.textMuted}`}>{patientDetails.guardian.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className={`${theme.card} rounded-xl p-5 border ${theme.border}`}>
                <h3 className={`font-semibold ${theme.text} mb-4`}>30-Day Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={theme.textMuted}>Total Alerts</span>
                    <span className={`font-semibold ${theme.text}`}>{patientDetails?.statistics?.totalAlerts30Days || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.textMuted}>High Risk Alerts</span>
                    <span className="font-semibold text-orange-600">{patientDetails?.statistics?.highRiskAlerts30Days || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.textMuted}>SOS Alerts</span>
                    <span className="font-semibold text-red-600">{patientDetails?.statistics?.sosAlerts30Days || 0}</span>
                  </div>
                </div>
              </div>

              {/* Medication Info */}
              <div className={`${theme.card} rounded-xl p-5 border ${theme.border}`}>
                <h3 className={`font-semibold ${theme.text} mb-4`}>Medication Plan</h3>
                {patientDetails?.medicationPlan ? (
                  <div className="space-y-2">
                    <p className={`text-sm ${theme.textMuted}`}>
                      {patientDetails.medicationPlan.medications?.length || 0} medications prescribed
                    </p>
                    {patientDetails.medicationPlan.prescribedBy && (
                      <p className={`text-sm ${theme.textMuted}`}>
                        By: {patientDetails.medicationPlan.prescribedBy}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className={`text-sm ${theme.textMuted}`}>No medication plan on record</p>
                )}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className={`${theme.card} rounded-xl p-5 border ${theme.border} mt-6`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Recent Alerts</h3>
              {patientDetails?.recentAlerts?.length > 0 ? (
                <div className="space-y-3">
                  {patientDetails.recentAlerts.slice(0, 10).map((alert, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-zinc-50'}`}>
                      <div className="flex items-center gap-3">
                        <FaExclamationTriangle className={
                          alert.type === 'sos' ? 'text-red-500' : 
                          alert.type === 'high_risk' ? 'text-orange-500' : 'text-blue-500'
                        } />
                        <div>
                          <span className={`font-medium ${theme.text} capitalize`}>{alert.type.replace('_', ' ')}</span>
                          {alert.riskScore && (
                            <span className={`ml-2 text-sm ${theme.textMuted}`}>Score: {alert.riskScore}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm ${theme.textMuted}`}>{formatDate(alert.date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={theme.textMuted}>No recent alerts</p>
              )}
            </div>

            {/* Scheduled Meetings */}
            <div className={`${theme.card} rounded-xl p-5 border ${theme.border} mt-6`}>
              <h3 className={`font-semibold ${theme.text} mb-4`}>Scheduled Meetings</h3>
              {patientDetails?.meetings?.length > 0 ? (
                <div className="space-y-3">
                  {patientDetails.meetings.map((meeting) => (
                    <div key={meeting.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-zinc-50'}`}>
                      <div className="flex items-center gap-3">
                        {meeting.meetingType === 'video' ? (
                          <FaVideo className="text-blue-500" />
                        ) : (
                          <FaMapMarkerAlt className="text-emerald-500" />
                        )}
                        <div>
                          <span className={`font-medium ${theme.text}`}>{formatDate(meeting.scheduledDate)}</span>
                          <span className={`ml-2 text-sm ${theme.textMuted}`}>
                            {meeting.timeSlot?.startTime} - {meeting.timeSlot?.endTime}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        meeting.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        meeting.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {meeting.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={theme.textMuted}>No meetings scheduled</p>
              )}
            </div>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className={`text-2xl font-bold ${theme.text}`}>Your Meetings</h1>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setMeetingFilter(f.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      meetingFilter === f.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : `${theme.border} ${theme.text} ${theme.hover}`
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            
            {meetings.length === 0 ? (
              <div className={`${theme.card} rounded-xl p-12 text-center border ${theme.border}`}>
                <FaCalendarAlt className={`text-5xl ${theme.textMuted} mx-auto mb-4`} />
                <h2 className={`text-xl font-semibold ${theme.text} mb-2`}>No Meetings Scheduled</h2>
                <p className={theme.textMuted}>
                  Schedule meetings from a patient's details page.
                </p>
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className={`${theme.card} rounded-xl p-8 text-center border ${theme.border}`}>
                <p className={theme.textMuted}>No meetings match the selected filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMeetings.map((meeting) => (
                  <div key={meeting.id} className={`${theme.card} rounded-xl p-5 border ${theme.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          meeting.meetingType === 'video' ? 'bg-blue-100' : 'bg-emerald-100'
                        }`}>
                          {meeting.meetingType === 'video' ? (
                            <FaVideo className="text-blue-600" />
                          ) : (
                            <FaMapMarkerAlt className="text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-semibold ${theme.text}`}>{meeting.patientName}</h3>
                          <p className={`text-sm ${theme.textMuted}`}>{formatDate(meeting.scheduledDate)}</p>
                          <p className={`text-sm ${theme.textMuted}`}>
                            <FaClock className="inline mr-1" />
                            {meeting.timeSlot?.startTime} - {meeting.timeSlot?.endTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          meeting.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          meeting.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {meeting.status}
                        </span>
                        {meeting.status === 'scheduled' && (
                          <div className="flex gap-2">
                            {meeting.meetingType === 'video' && meeting.meetingLink && (
                              <a
                                href={meeting.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
                              >
                                <FaVideo /> Join
                              </a>
                            )}
                            <button
                              onClick={() => handleCompleteMeeting(meeting.id)}
                              className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700"
                            >
                              <FaCheck /> Done
                            </button>
                            <button
                              onClick={() => handleCancelMeeting(meeting.id)}
                              className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {meeting.reason && (
                      <p className={`mt-3 text-sm ${theme.textMuted}`}>
                        <strong>Reason:</strong> {meeting.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={`text-2xl font-bold ${theme.text}`}>Availability</h1>
                <p className={`text-sm ${theme.textMuted} mt-1`}>Set your weekly availability for patient appointments</p>
              </div>
              <button
                onClick={handleSaveAvailability}
                disabled={savingAvailability}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {savingAvailability ? 'Saving...' : 'Save Availability'}
              </button>
            </div>

            <div className="grid gap-3">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, idx) => {
                const slot = availabilitySlots.find(s => s.dayOfWeek === idx) || { dayOfWeek: idx, startTime: '09:00', endTime: '17:00', isAvailable: false };
                const slotIndex = availabilitySlots.findIndex(s => s.dayOfWeek === idx);

                const updateSlot = (field, value) => {
                  setAvailabilitySlots(prev => {
                    const updated = [...prev];
                    if (slotIndex >= 0) {
                      updated[slotIndex] = { ...updated[slotIndex], [field]: value };
                    } else {
                      updated.push({ ...slot, [field]: value });
                    }
                    return updated;
                  });
                };

                return (
                  <div key={idx} className={`${theme.card} rounded-xl p-4 border ${theme.border} flex items-center justify-between gap-4`}>
                    <div className="flex items-center gap-4 min-w-[140px]">
                      <button
                        onClick={() => updateSlot('isAvailable', !slot.isAvailable)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${slot.isAvailable ? 'bg-blue-600' : darkMode ? 'bg-zinc-600' : 'bg-zinc-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${slot.isAvailable ? 'left-5' : 'left-0.5'}`} />
                      </button>
                      <span className={`font-medium ${slot.isAvailable ? theme.text : theme.textMuted}`}>{dayName}</span>
                    </div>
                    {slot.isAvailable && (
                      <div className="flex items-center gap-3">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot('startTime', e.target.value)}
                          className={`px-3 py-1.5 rounded-lg border text-sm ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        <span className={theme.textMuted}>to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot('endTime', e.target.value)}
                          className={`px-3 py-1.5 rounded-lg border text-sm ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    )}
                    {!slot.isAvailable && (
                      <span className={`text-sm ${theme.textMuted}`}>Not available</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.card} rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
            <div className={`p-5 border-b ${theme.border}`}>
              <h2 className={`text-xl font-bold ${theme.text}`}>Schedule Meeting</h2>
              <p className={theme.textMuted}>with {selectedPatient.patientName}</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>Date *</label>
                <input
                  type="date"
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduledDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>Start Time *</label>
                  <input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({...scheduleForm, startTime: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>End Time</label>
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm({...scheduleForm, endTime: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>Meeting Type *</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setScheduleForm({...scheduleForm, meetingType: 'video'})}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                      scheduleForm.meetingType === 'video' 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : `${theme.border} ${theme.text} ${theme.hover}`
                    }`}
                  >
                    <FaVideo /> Video Call
                  </button>
                  <button
                    onClick={() => setScheduleForm({...scheduleForm, meetingType: 'in-person'})}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                      scheduleForm.meetingType === 'in-person' 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : `${theme.border} ${theme.text} ${theme.hover}`
                    }`}
                  >
                    <FaMapMarkerAlt /> In-Person
                  </button>
                </div>
              </div>

              {scheduleForm.meetingType === 'video' && (
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>Meeting Link</label>
                  <input
                    type="url"
                    value={scheduleForm.meetingLink}
                    onChange={(e) => setScheduleForm({...scheduleForm, meetingLink: e.target.value})}
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              )}

              {scheduleForm.meetingType === 'in-person' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.text} mb-2`}>Address</label>
                    <input
                      type="text"
                      value={scheduleForm.locationAddress}
                      onChange={(e) => setScheduleForm({...scheduleForm, locationAddress: e.target.value})}
                      placeholder="123 Medical Center Dr"
                      className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme.text} mb-2`}>City</label>
                    <input
                      type="text"
                      value={scheduleForm.locationCity}
                      onChange={(e) => setScheduleForm({...scheduleForm, locationCity: e.target.value})}
                      placeholder="New York"
                      className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme.text} mb-2`}>Additional Notes</label>
                    <input
                      type="text"
                      value={scheduleForm.locationNotes}
                      onChange={(e) => setScheduleForm({...scheduleForm, locationNotes: e.target.value})}
                      placeholder="Room 305, 3rd Floor"
                      className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>Reason for Meeting</label>
                <textarea
                  value={scheduleForm.reason}
                  onChange={(e) => setScheduleForm({...scheduleForm, reason: e.target.value})}
                  placeholder="Follow-up on recovery progress, medication review, etc."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                />
              </div>
            </div>

            <div className={`p-5 border-t ${theme.border} flex gap-3`}>
              <button
                onClick={() => setShowScheduleModal(false)}
                className={`flex-1 px-4 py-3 rounded-lg border ${theme.border} ${theme.text} ${theme.hover} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleMeeting}
                disabled={!scheduleForm.scheduledDate || !scheduleForm.startTime}
                className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
