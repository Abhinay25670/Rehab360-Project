import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import { ToastContainer, toast } from 'react-toastify';
import { API_URL } from '../../config/api';

const WorkerServices = () => {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: "", price: "", availableTimes: "null" });
  const [showModal, setShowModal] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_URL}/api/auth/services`, {
        headers: { Authorization: token },
      })
      .then((res) => setServices(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleAddService = async () => {
    if (!newService.name || !newService.price) return;
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/services`,
        newService,
        { headers: { Authorization: localStorage.getItem("token") } }
      );
      setServices(res.data.services);
      setNewService({ name: "", price: "", availableTimes: "null" });
      setShowModal(false);
      toast.success("Service added successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error adding service");
    }
  };

  const handleDeleteService = async (index) => {
    try {
      const res = await axios.delete(
        `${API_URL}/api/auth/services/${index}`,
        { headers: { Authorization: localStorage.getItem("token") } }
      );
      setServices(res.data.services);
      toast.success("Service deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting service");
    }
  };

  return (
    <div className="bg-gradient-to-r from-sky-200 to-green-100 min-h-screen">
      <Navbar />
      <ToastContainer />
      <h1 className="text-5xl text-center font-bold pt-10 mb-6">Your Services</h1>

      <div className="max-w-3xl mx-auto bg-white/50 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Manage Your Services</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500/60 hover:bg-sky-500 transition-all duration-300 text-white px-4 py-2 rounded mb-4"
        >
          Add New Service
        </button>

        <ul className="space-y-3">
          {services.length > 0 ? (
            services.map((service, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-white/60 p-3 rounded-lg shadow-sm"
              >
                <div>
                  <p className="font-bold">{service.name}</p>
                  <p className="text-gray-700">Price: Rs {service.price}</p>
                  
                </div>
                <button
                  onClick={() => handleDeleteService(index)}
                  className="bg-red-500/60 hover:bg-red-700 transition-all duration-300 text-white px-3 py-1 rounded-lg"
                >
                  Delete
                </button>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No services added yet.</p>
          )}
        </ul>
      </div>

      {/* Add Service Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md">
          <div className="bg-white/40 p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Add New Service</h2>
            <input
              type="text"
              placeholder="Service Name"
              className="w-full p-2 border mb-2 rounded bg-white/60 shadow-sm"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Price (Rs)"
              className="w-full p-2 border mb-2 rounded bg-white/60 shadow-sm"
              value={newService.price}
              onChange={(e) => setNewService({ ...newService, price: e.target.value })}
              required
            />
            
            <div className="flex justify-end">
              <button onClick={() => setShowModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded mr-2">Cancel</button>
              <button onClick={handleAddService} className="bg-green-500 text-white px-4 py-2 rounded">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerServices;