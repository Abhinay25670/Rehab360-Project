import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import { ToastContainer } from "react-toastify";
import { API_URL } from "../../config/api";

const AdminEventPage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState([]); // List of all events
  const [loading, setLoading] = useState(false);

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/events/admin-events`, {
          headers: { Authorization: token },
        });
        setEvents(res.data);
      } catch (error) {
        toast.error("Error fetching events");
      }
    };
    fetchEvents();
  }, []);

  // Create a new event
  const createEvent = async () => {
    if (!name.trim()) return toast.error("Event name is required");
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/events`,
        { name, description },
        { headers: { Authorization: token } }
      );

      toast.success("Event created successfully!");
      setName("");
      setDescription("");
      setEvents([...events, res.data]); // Add new event to list
    } catch (error) {
      toast.error("Error creating event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-100 to-indigo-50 min-h-screen">
      <Navbar />
      <ToastContainer />
      <h1 className="text-5xl text-center font-bold text-gray-800 pt-10 mb-6">Manage Events</h1>

      <div className="flex flex-col items-center p-6">
        {/* Create Event Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-2xl mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Event</h2>
          <input
            type="text"
            placeholder="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createEvent}
            disabled={loading}
            className={`px-6 py-2 rounded-lg transition-colors duration-300 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {loading ? "Creating..." : "Create Event"}
          </button>
        </div>

        {/* Events List Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">All Events</h2>

          {events.length === 0 ? (
            <p className="text-gray-600 text-center">No events created yet.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event._id} className="p-4 border rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800">{event.name}</h3>
                  <p className="text-gray-600">{event.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Created by: <span className="font-semibold">{event.admin.name}</span>
                  </p>

                  {/* Attending Users List */}
                  {event.users.length > 0 ? (
                    <div className="mt-3">
                      <h4 className="text-sm font-semibold text-gray-700">Attending Residents:</h4>
                      <ul className="list-disc list-inside text-gray-600">
                        {event.users.map((user) => (
                          <li key={user.id._id}>
                            {user.id.name} -{" "}
                            <span
                              className={`${
                                user.attending ? "text-green-600" : "text-red-500"
                              } font-semibold`}
                            >
                              {user.attending ? "Attending" : "Not Attending"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">No attendees yet.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEventPage;
