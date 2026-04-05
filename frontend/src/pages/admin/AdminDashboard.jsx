import { useEffect, useState } from "react";
import axios from "axios";
import { FaCheck, FaTimes, FaUser, FaEye } from "react-icons/fa"; // Importing icons from react-icons
import Navbar from "../../components/Navbar"
import { ToastContainer, toast } from 'react-toastify';
import { API_URL } from '../../config/api';

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // Store clicked image

  useEffect(() => {
    axios.get(`${API_URL}/api/admin/pending-users`, {
      headers: { Authorization: localStorage.getItem("token") }
    })
      .then(res => setPendingUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleApproval = async (userId, action) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${API_URL}/api/admin/approve/${userId}`, { action }, {
        headers: { Authorization: token}
      });
      toast.success(`Successfully ${action}`)
      setPendingUsers(pendingUsers.filter(user => user._id !== userId));
    } catch (error) {
      toast.error("Error approving/rejecting user");
    }
  };

  return (
    <div className="bg-gradient-to-r from-sky-100 to-purple-50 min-h-screen">
      <Navbar/>
      <ToastContainer/>
      <h1 className="text-5xl text-center font-bold text-gray-800 pt-10 mb-6">User Requests</h1>

      {pendingUsers.length === 0 ? (
        <p className="text-gray-600 text-center">No pending users.</p>
      ) : (
        <div className="w-fit justify-self-center ">
          {pendingUsers.map(user => (
            <div key={user._id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center space-x-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>

                {/* Image Wrapper with Hover Effect */}
                <div className="relative w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center group">
                  {user.proof ? (
                    <>
                      <img
                        src={`${API_URL}${user.profile}`}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover cursor-pointer"
                      />
                      {/* Eye Icon Appears on Hover */}
                      <div
                        className="absolute inset-0 bg-black/40 rounded-full cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedImage(`${API_URL}${user.profile}`)}
                      >
                        <FaEye className="text-white text-2xl" />
                      </div>
                    </>
                  ) : (
                    <FaUser className="text-gray-500 text-2xl" />
                  )}
                </div>
                
              </div>

              <div className="space-y-2">
                <p className="text-gray-600"><span className="font-medium">Shop Address :</span> {user.shop}</p>
                <p className="text-gray-600"><span className="font-medium">Role:</span> {user.role}</p>
                <p className="text-gray-600"><span className="font-medium">Phone:</span> {user.phone}</p>
              </div>

              <div className="flex gap-5 mt-2">
              <p className="text-gray-600"><span className="font-medium">Document:</span> </p>

              {/* Image Wrapper with Hover Effect */}
              <div className="relative w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center group">
                  {user.proof ? (
                    <>
                      <img
                        src={`${API_URL}${user.proof}`}
                        alt={user.name}
                        className="w-full h-full rounded-md object-cover cursor-pointer"
                      />
                      {/* Eye Icon Appears on Hover */}
                      <div
                        className="absolute inset-0 bg-black/40 rounded-md cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedImage(`${API_URL}${user.proof}`)}
                      >
                        <FaEye className="text-white text-2xl" />
                      </div>
                    </>
                  ) : (
                    <FaUser className="text-gray-500 text-2xl" />
                  )}
                </div>
                </div>

              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => handleApproval(user._id, "approve")}
                  className="flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
                >
                  <FaCheck className="mr-2" /> Approve
                </button>
                <button
                  onClick={() => handleApproval(user._id, "reject")}
                  className="flex items-center justify-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300"
                >
                  <FaTimes className="mr-2" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm ease-initial flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Proof" className="max-w-full max-h-full rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
