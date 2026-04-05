import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import { API_URL } from '../../config/api';

const RDetails = () => {
  const [formData, setFormData] = useState({ phone: "", proof: null, profile: null });
  const navigate = useNavigate();

  // ✅ Handle Input Change Correctly
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // ✅ Handle File Upload Properly
  const handleFileChange = (e) => setFormData({ ...formData, proof: e.target.files[0] });

  // Handle Profile Profile Picture Upload
  const handleProfileChange = (e) => setFormData({ ...formData, profile: e.target.files[0] });



  // ✅ Submit Form Data Correctly
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
  if (!token) {
    toast.error("User not authenticated!");
    return;
  }

  const formDataToSend = new FormData();
  formDataToSend.append("phone", formData.phone);
  if (formData.proof) {
    formDataToSend.append("proof", formData.proof);
  }
  if (formData.profile) {
    formDataToSend.append("profile", formData.profile);
  }


  try {
    await axios.put(`${API_URL}/api/auth/complete`, formDataToSend, {
      headers: {
        Authorization: token, // ✅ Fix: Use Bearer format
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success("Registration successful! Wait for admin approval.");
    setTimeout(() => {
      navigate("/");
    }, 2000);
  } catch (error) {
    console.error("Error:", error);
    toast.error(error.response?.data?.message || "Something went wrong");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <ToastContainer/>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Resident Details</h2>
        <label className="font text-black">Upload a Profile Picture</label>
        <input
          type="file"
          className="w-full p-2 border rounded-lg mb-2"
          onChange={handleProfileChange}
        />
        

        {/* ✅ Fix input name */}
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          className="w-full p-2 mb-2 border"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        {/* ✅ Fix file input */}
        <input
          type="file"
          className="w-full p-2 border rounded-lg mb-2"
          onChange={handleFileChange}
        />
        <label className="font text-red-400">* Upload a Proof of Address</label>

        


        <button className="w-full bg-blue-500 text-white p-2 rounded">Complete Registration</button>
      </form>
    </div>
  );
};

export default RDetails;
