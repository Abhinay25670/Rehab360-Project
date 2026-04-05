import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";
import axios from "axios";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserCircle,
  FaPaperPlane,
  FaComments,
  FaArrowLeft,
  FaMoon,
  FaSun,
  FaSearch,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import { API_URL, SOCKET_URL } from "../config/api";

const socket = io(SOCKET_URL);

const ChatPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]); // List of online users
  const [selectedUser, setSelectedUser] = useState(null); // Active chat user
  const [messages, setMessages] = useState([]); // Messages
  const [newMessage, setNewMessage] = useState(""); // Message input
  const [searchQuery, setSearchQuery] = useState(""); // Search users
  const [isDarkMode, setIsDarkMode] = useState(false); // Dark mode toggle
  const user = JSON.parse(localStorage.getItem("user")); // Current user

  // Fetch online users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/auth/users`, {
          headers: { Authorization: token },
        });

        // Filter out the logged-in user
        setUsers(res.data.filter((u) => u._id !== user._id));
      } catch (error) {
        toast.error("Error fetching users");
      }
    };
    fetchUsers();

    // Join user socket room
    socket.emit("joinUser", user._id);

    // Listen for incoming messages
    socket.on("receivePrivateMessage", (message) => {
      if (message.sender === selectedUser?._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off("receivePrivateMessage");
    };
  }, [selectedUser]);

  // Fetch chat history when a user is selected
  const loadMessages = async (receiverId) => {
    try {
      setSelectedUser(users.find((u) => u._id === receiverId));
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/messages/${receiverId}`, {
        headers: { Authorization: token },
      });
      setMessages(res.data);
    } catch (error) {
      toast.error("Error loading chat history");
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const messageData = {
        sender: user._id,
        receiver: selectedUser._id,
        message: newMessage,
      };

      // Emit message via Socket.IO
      socket.emit("sendPrivateMessage", messageData);

      // Update UI instantly
      setMessages([...messages, { ...messageData, timestamp: new Date() }]);
      setNewMessage("");
    } catch (error) {
      toast.error("Error sending message");
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <Navbar />
      <ToastContainer />

      {/* Sidebar - Online Users */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`w-1/4 p-6 border-r shadow-lg overflow-y-auto ${
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex mx-auto items-center gap-2">
            <FaComments className="text-blue-500" /> {t("chat.chats")}
          </h2>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-300 transition-all"
          >
            {isDarkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-600" />}
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 mb-6">
          <input
            type="text"
            placeholder={t("chat.searchUsers")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 p-2 rounded-lg focus:outline-none ${
              isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
            }`}
          />
          <FaSearch className="text-gray-500" />
        </div>

        {/* User List */}
        {filteredUsers.length === 0 ? (
          <p className="text-gray-500">{t("chat.noUsersFound")}</p>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((u) => (
              <motion.div
                key={u._id}
                whileHover={{ scale: 1.02 }}
                className={`p-3 flex items-center gap-3 rounded-lg cursor-pointer transition-all ${
                  selectedUser?._id === u._id
                    ? "bg-sky-700 text-white"
                    : isDarkMode
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => loadMessages(u._id)}
              >
                <FaUserCircle className="text-3xl text-blue-200" />
                <span className="font-semibold">{u.name}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Chat Section */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`flex-1 flex flex-col p-6 shadow-lg ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  <FaArrowLeft className="text-2xl text-gray-600 dark:text-gray-400" />
                </button>
                <FaUserCircle className="text-4xl text-blue-500" />
                <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center">{t("chat.startConversation")}</p>
              ) : (
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`p-3 max-w-xs rounded-lg ${
                        msg.sender === user._id
                          ? "bg-sky-700 text-white ml-auto"
                          : isDarkMode
                          ? "bg-gray-700 text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      {msg.message}
                      <p className="text-xs text-gray-300 mt-1">
  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Input Box */}
            <div className="border-t pt-4 flex items-center gap-2">
              <input
                type="text"
                placeholder={t("chat.typeMessage")}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className={`flex-1 p-3 rounded-lg focus:outline-none ${
                  isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
                }`}
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-all"
              >
                <FaPaperPlane /> {t("common.send")}
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center flex-1 flex items-center justify-center">
            {t("chat.selectUser")}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default ChatPage;