import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaUserInjured, 
  FaCalendarAlt, 
  FaClock, 
  FaCheck, 
  FaTimes,
  FaSpinner,
  FaNotesMedical
} from 'react-icons/fa';
import { MdHealthAndSafety } from 'react-icons/md';
import { API_URL } from '../../config/api';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/appointments/doctor`, {
          headers: { Authorization: `${localStorage.getItem('token')}` }
        });
        setAppointments(res.data);
      } catch (err) {
        toast.error('Failed to fetch appointments');
        console.error(err);
      }
      setLoading(false);
    };

    fetchAppointments();
  }, []);

  const handleStatusUpdate = async () => {
    if (!selectedAppointment) return;

    try {
      const res = await axios.put(
        `${API_URL}/api/appointments/${selectedAppointment._id}/status`,
        { status, notes },
        { headers: { Authorization: `${localStorage.getItem('token')}` }}
      );

      setAppointments(appointments.map(appt => 
        appt._id === selectedAppointment._id ? res.data : appt
      ));
      setShowModal(false);
      toast.success(`Appointment ${status}`);
    } catch (err) {
      toast.error('Failed to update appointment');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <MdHealthAndSafety className="mr-2 text-blue-600" />
            Appointment Requests
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaCalendarAlt className="mx-auto text-5xl text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No appointment requests</h3>
            <p className="text-gray-500">You have no pending appointment requests</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUserInjured className="text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appt.patient?.name || 'Patient'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appt.patient?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(appt.date)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <FaClock className="mr-1" /> {appt.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {appt.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(appt.status)}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {appt.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appt);
                            setStatus('approved');
                            setShowModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 mr-3 flex items-center"
                        >
                          <FaCheck className="mr-1" /> Approve
                        </button>
                      )}
                      {appt.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appt);
                            setStatus('rejected');
                            setShowModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <FaTimes className="mr-1" /> Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {status === 'approved' ? 'Approve' : 'Reject'} Appointment
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Patient:</strong> {selectedAppointment.patient?.name}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Date:</strong> {formatDate(selectedAppointment.date)}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Time:</strong> {selectedAppointment.time}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Reason:</strong> {selectedAppointment.reason}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes for the patient"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className={`px-4 py-2 text-white rounded-md ${
                    status === 'approved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {status === 'approved' ? (
                    <>
                      <FaCheck className="inline mr-1" /> Approve
                    </>
                  ) : (
                    <>
                      <FaTimes className="inline mr-1" /> Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;