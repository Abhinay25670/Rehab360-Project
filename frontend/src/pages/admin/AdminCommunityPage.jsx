import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import { ToastContainer } from "react-toastify";
import Select from "react-select";
import { API_URL } from "../../config/api";

const AdminCommunityPage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]); // Array of selected user IDs
  const [residents, setResidents] = useState([]); // List of all residents
  const [communities, setCommunities] = useState([]); // List of all communities
  const [selectedCommunity, setSelectedCommunity] = useState(null); // Selected community ID
  const [loading, setLoading] = useState(false);

  // Fetch residents and communities on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch residents
        const residentsRes = await axios.get(`${API_URL}/api/admin/residents`, {
          headers: { Authorization: token },
        });
        const formattedResidents = residentsRes.data.map((resident) => ({
          value: resident._id,
          label: resident.name,
        }));
        setResidents(formattedResidents);

        // Fetch communities
        const communitiesRes = await axios.get(`${API_URL}/api/communities`, {
          headers: { Authorization: token },
        });
        setCommunities(communitiesRes.data);
      } catch (error) {
        toast.error("Error fetching data");
      }
    };
    fetchData();
  }, []);

  // Create a new community
  const createCommunity = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/communities`,
        { name, description },
        { headers: { Authorization: token } }
      );
      toast.success("Community created successfully!");
      setName("");
      setDescription("");
      setCommunities([...communities, res.data]); // Add the new community to the list
    } catch (error) {
      toast.error("Error creating community");
    }
  };

  // Add users to a community
  const addUsersToCommunity = async () => {
    if (!selectedCommunity) {
      toast.error("Please select a community first");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userIds = selectedUsers.map((user) => user.value); // Extract user IDs
      const res = await axios.post(
        `${API_URL}/api/communities/${selectedCommunity}/add-users`,
        { userIds },
        { headers: { Authorization: token } }
      );
      toast.success("Users added to community!");
      setSelectedUsers([]); // Clear selected users
    } catch (error) {
      toast.error("Error adding users to community");
    }
  };

  return (
    <div className="bg-gradient-to-r from-sky-100 to-purple-50 min-h-screen">
      <Navbar />
      <ToastContainer />
      <h1 className="text-5xl text-center font-bold text-gray-800 pt-10 mb-6">Manage Communities</h1>

      <div className="flex flex-col items-center p-6">
        {/* Create Community Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-2xl mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Community</h2>
          <input
            type="text"
            placeholder="Community Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            onClick={createCommunity}
            className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 transition-colors duration-300"
          >
            Create Community
          </button>
        </div>

        {/* Add Users to Community Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Users to Community</h2>

          {/* Select Community */}
          <select
            value={selectedCommunity || ""}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="" disabled>Select a community</option>
            {communities.map((community) => (
              <option key={community._id} value={community._id}>
                {community.name}
              </option>
            ))}
          </select>

          {/* Select Residents */}
          <Select
            isMulti
            options={residents}
            value={selectedUsers}
            onChange={(selectedOptions) => setSelectedUsers(selectedOptions)}
            placeholder="Select residents..."
            className="mb-4"
            styles={{
              control: (base) => ({
                ...base,
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "0.25rem",
                boxShadow: "none",
                "&:hover": {
                  borderColor: "#7dd3fc", // Sky-500
                },
              }),
              menu: (base) => ({
                ...base,
                borderRadius: "0.5rem",
                marginTop: "0.5rem",
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: "#e0f2fe", // Sky-100
                borderRadius: "0.375rem",
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: "#0369a1", // Sky-700
              }),
              multiValueRemove: (base) => ({
                ...base,
                color: "#0369a1", // Sky-700
                "&:hover": {
                  backgroundColor: "#bae6fd", // Sky-200
                  color: "#0c4a6e", // Sky-900
                },
              }),
            }}
          />

          {/* Add Users Button */}
          <button
            onClick={addUsersToCommunity}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
          >
            Add Users
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCommunityPage;