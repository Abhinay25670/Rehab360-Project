import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import { API_URL } from "../../config/api";
import { FaCalendarAlt, FaClock, FaUserTie, FaTools, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from "react-icons/fa";
import { ToastContainer } from 'react-toastify';

const ResidentServices = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`${API_URL}/api/bookings/bookings`, {
          headers: { Authorization: token }
        });
        setBookings(res.data);
        console.log(res.data)
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Accepted':
        return <FaCheckCircle className="text-green-500 mr-1" />;
      case 'Rejected':
        return <FaTimesCircle className="text-red-500 mr-1" />;
      default:
        return <FaHourglassHalf className="text-yellow-500 mr-1" />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-sky-200 to-green-100 min-h-screen">
      <Navbar />
      <ToastContainer />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Your Bookings</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-lg max-w-2xl mx-auto">
            <p className="text-xl text-gray-600">You haven't made any bookings yet.</p>
            <p className="text-gray-500 mt-2">Book a service to see it appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map(booking => (
              <div key={booking._id} className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${
                booking.status === 'Accepted' ? 'border-l-4 border-green-500' : 
                booking.status === 'Rejected' ? 'border-l-4 border-red-500' : 
                'border-l-4 border-yellow-500'
              }`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                      <FaTools className="mr-2 text-blue-500" />
                      {booking.service}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                      booking.status === 'Accepted' ? 'bg-green-100 text-green-800' : 
                      booking.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusIcon(booking.status)}
                      {booking.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <FaUserTie className="mt-1 mr-3 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Worker</p>
                        <p className="font-medium text-gray-800">{booking.worker.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaCalendarAlt className="mt-1 mr-3 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Scheduled Date</p>
                        <p className="font-medium text-gray-800">{formatDate(booking.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaClock className="mt-1 mr-3 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Scheduled Time</p>
                        <p className="font-medium text-gray-800">{formatTime(booking.time)}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaCalendarAlt className="mt-1 mr-3 text-gray-500" />
                      <div>
                        <p className="text-gray-600">Booked on</p>
                        <p className="font-medium text-gray-800">{new Date(booking.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <FaUserTie className="mr-2" /> Worker Details
                      </h4>
                      <div className="space-y-2">
                        <p className="flex items-center text-gray-600">
                          <FaPhone className="mr-2" /> {booking.worker.phone || 'Not provided'}
                        </p>
                        <p className="flex items-center text-gray-600">
                          <FaEnvelope className="mr-2" /> {booking.worker.email}
                        </p>
                        <p className="flex items-center text-gray-600">
                          <FaMapMarkerAlt className="mr-2" /> {booking.worker.shop || 'Shop address not provided'}
                        </p>
                      </div>
                    </div>

                    {booking.worker.profile && (
                      <div className="mt-4">
                        <img 
                          src={`${API_URL}${booking.worker.profile}`} 
                          alt={`${booking.worker.name}'s profile`} 
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentServices;