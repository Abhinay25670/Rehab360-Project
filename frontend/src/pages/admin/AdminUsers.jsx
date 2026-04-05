import { useEffect, useState } from "react";
import axios from "axios";
import { FaUser, FaEnvelope, FaPhone, FaUserTag } from "react-icons/fa"; // Importing icons
import Navbar from "../../components/Navbar";
import { ToastContainer } from "react-toastify";
import { API_URL } from "../../config/api";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: localStorage.getItem("token") },
      })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="bg-gradient-to-r from-sky-100 to-purple-50 min-h-screen p-6">
      <Navbar />
      <ToastContainer />
      <h1 className="text-5xl text-center font-bold text-gray-800 pt-10 mb-6">All Users</h1>

      <div className="overflow-x-auto">
        <table className="w-full max-w-5xl mx-auto bg-white bg-opacity-30 backdrop-blur-lg shadow-lg rounded-lg overflow-hidden border border-gray-300">
          <thead>
            <tr className="bg-gray-900 text-white text-left">
              <th className="p-4"> <FaUser className="inline-block mr-2" /> Name </th>
              <th className="p-4"> <FaEnvelope className="inline-block mr-2" /> Email </th>
              <th className="p-4"> <FaPhone className="inline-block mr-2" /> Phone </th>
              <th className="p-4"> <FaUserTag className="inline-block mr-2" /> Role </th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={index} className="border-b border-gray-300 hover:bg-white hover:bg-opacity-50 transition-all">
                  <td className="p-4 font-medium text-gray-800">{user.name}</td>
                  <td className="p-4 text-gray-700">{user.email}</td>
                  <td className="p-4 text-gray-700">{user.phone}</td>
                  <td className="p-4 text-gray-700 font-semibold">{user.role}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center p-4 text-gray-600">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
