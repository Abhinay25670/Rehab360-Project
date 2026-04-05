import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import { API_URL } from "../../config/api";
import { ToastContainer, toast } from 'react-toastify';
import { FaLocationArrow, FaClock, FaCalendarAlt, FaTools, FaUserTie, FaRupeeSign, FaEnvelope,FaMapMarkerAlt ,FaPhone, FaSearch, FaFilter } from "react-icons/fa";

const ResidentServices = () => {
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    serviceType: "",
    priceRange: "",
    availability: "",
    distance: ""
  });

  
  
  useEffect(() => {
    const getLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (err) => {
            console.error(err.message);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    };
  
    getLocation();
  }, []);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/bookings/workers?role=Worker`);
        setWorkers(res.data);
        setFilteredWorkers(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  // Filter workers based on search term and filters
  useEffect(() => {
    let results = workers;
    
    // Apply search term filter
    if (searchTerm) {
      results = results.filter(worker => 
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.services.some(service => 
          service.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }
    
    // Apply service type filter
    if (filters.serviceType) {
      results = results.filter(worker => 
        worker.services.some(service => 
          service.name.toLowerCase().includes(filters.serviceType.toLowerCase())
        )
  )
}
    
    // Apply price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      results = results.filter(worker => 
        worker.services.some(service => {
          const price = parseInt(service.price.replace(/\D/g, ''));
          return price >= min && price <= max;
        })
      )
    }
    
    // Apply availability filter (simple implementation)
    if (filters.availability === "today") {
      // This would need actual availability data from your backend
      results = results.filter(worker => worker.availableToday);
    }
    
    setFilteredWorkers(results);
  }, [searchTerm, filters, workers]);

  const handleBooking = async () => {
    if (!date || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/api/bookings`, {
        workerId: selectedWorker._id,
        service: selectedService.name,
        date,
        time: selectedTime
      }, { headers: { Authorization: token } });

      toast.success("Booking Request Sent!");
      setShowModal(false);
      // Reset form
      setSelectedService(null);
      setDate("");
      setSelectedTime(null);
    } catch (error) {
      toast.error("Error booking service");
    }
  };

  // Generate time slots (every 30 minutes from 9 AM to 8 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        display: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
      });
      if (hour < 20) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:30`,
          display: `${hour > 12 ? hour - 12 : hour}:30 ${hour >= 12 ? 'PM' : 'AM'}`
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Group time slots by hour for better display
  const groupedTimeSlots = timeSlots.reduce((acc, slot) => {
    const hour = slot.time.split(':')[0];
    if (!acc[hour]) {
      acc[hour] = [];
    }
    acc[hour].push(slot);
    return acc;
  }, {});

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const resetFilters = () => {
    setFilters({
      serviceType: "",
      priceRange: "",
      availability: "",
      distance: ""
    });
    setSearchTerm("");
  };

  return (
    <div className="bg-gradient-to-r from-sky-200 to-green-100 min-h-screen">
      <Navbar/>
      <ToastContainer/>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Available Service Providers</h1>

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for services or providers..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              <FaFilter /> Filters
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={filters.serviceType}
                    onChange={(e) => setFilters({...filters, serviceType: e.target.value})}
                  >
                    <option value="">All Services</option>
                    <option value="plumber">Plumber</option>
                    <option value="electrician">Electrician</option>
                    <option value="cleaner">Cleaner</option>
                    <option value="carpenter">Carpenter</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={filters.priceRange}
                    onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                  >
                    <option value="">Any Price</option>
                    <option value="0-500">Under ₹500</option>
                    <option value="500-1000">₹500 - ₹1000</option>
                    <option value="1000-2000">₹1000 - ₹2000</option>
                    <option value="2000-5000">₹2000+</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={filters.availability}
                    onChange={(e) => setFilters({...filters, availability: e.target.value})}
                  >
                    <option value="">Any Time</option>
                    <option value="today">Available Today</option>
                    <option value="weekend">Weekend Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={filters.distance}
                    onChange={(e) => setFilters({...filters, distance: e.target.value})}
                  >
                    <option value="">Any Distance</option>
                    <option value="1">Within 1 km</option>
                    <option value="5">Within 5 km</option>
                    <option value="10">Within 10 km</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="text-sm text-gray-600">
            Showing {filteredWorkers.length} of {workers.length} service providers
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-lg max-w-2xl mx-auto">
            <p className="text-xl text-gray-600">No service providers match your search criteria.</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search term.</p>
            <button 
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map(worker => (
              <div key={worker._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3 mb-4">
                      {worker.profile && (
                        <img 
                          src={`${API_URL}${worker.profile}`} 
                          alt={worker.name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{worker.name}</h3>
                        {worker.nearby && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaLocationArrow className="mr-1" /> Nearby
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <FaEnvelope className="mr-2 text-blue-500" />
                      <a href={`mailto:${worker.email}`} className="hover:underline">{worker.email}</a>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="mr-2 text-blue-500" />
                      <span>{worker.shop}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaPhone className="mr-2 text-blue-500" />
                      <span>{worker.phone}</span>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <FaTools className="mr-2 text-blue-500" /> Services Offered
                      </h4>
                      <div className="space-y-2">
                        {worker.services.map((service, index) => (
                          <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{service.name}</span>
                              <div className="text-sm text-gray-500 flex items-center">
                                <FaRupeeSign className="mr-1" />
                                {service.price}
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setSelectedWorker(worker);
                                setSelectedService(service);
                                setShowModal(true);
                              }}
                              className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                            >
                              Book Now
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {showModal && selectedWorker && selectedService && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <FaUserTie className="mr-2 text-blue-500" />
                  Book {selectedWorker.name}
                </h2>

                <div className="space-y-4">
                  {/* Service Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <FaTools className="mr-2" />
                      {selectedService.name}
                    </h3>
                    <p className="text-gray-600 mt-1 flex items-center">
                      <FaRupeeSign className="mr-1" />
                      Approx Price: {selectedService.price}
                    </p>
                  </div>

                  {/* Date Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      Select Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setSelectedTime(null);
                      }}
                      required
                    />
                  </div>

                  {/* Time Slot Selection */}
                  {date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaClock className="mr-2" />
                        Select Time Slot
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`p-2 rounded-md text-sm transition-all ${
                              selectedTime === slot.time
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-gray-100 hover:bg-blue-100 border border-gray-200'
                            }`}
                          >
                            {slot.display}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booking Summary */}
                  {selectedTime && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-700 mb-2">Booking Summary</h3>
                      <div className="space-y-1 text-sm">
                        <p className="flex justify-between">
                          <span className="text-gray-600">Service:</span>
                          <span className="font-medium">{selectedService.name}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{formatDate(date)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium">
                            {selectedTime.split(':')[0] > 12 
                              ? selectedTime.split(':')[0] - 12 
                              : selectedTime.split(':')[0]
                            }:
                            {selectedTime.split(':')[1]} 
                            {selectedTime.split(':')[0] >= 12 ? ' PM' : ' AM'}
                          </span>
                        </p>
                        <p className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Approx Price:</span>
                          <span className="font-medium">₹{selectedService.price}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedTime(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBooking}
                      disabled={!selectedTime || !date}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        !selectedTime || !date
                          ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      Confirm Booking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentServices;