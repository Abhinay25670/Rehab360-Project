import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import axios from "axios";
import { API_URL, SOCKET_URL } from "../config/api";

const CommunityPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  // Connect to Socket.IO server
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Listen for incoming messages
    newSocket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for typing events
    newSocket.on("userTyping", (username) => {
      setTypingUser(username);
      setIsTyping(true);

      // Clear typing indicator after 3 seconds
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTypingUser("");
      }, 3000);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Join the selected community's room
  useEffect(() => {
    if (socket && selectedCommunity) {
      socket.emit("joinCommunity", selectedCommunity._id);
    }
  }, [selectedCommunity, socket]);

  // Scroll to the bottom of the chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch communities for the resident
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/communities/my-communities`, {
          headers: { Authorization: token },
        });
        setCommunities(res.data);
      } catch (error) {
        console.error("Error fetching communities:", error);
      }
    };
    fetchCommunities();
  }, []);

  // Send a new message
  const sendMessage = () => {
    if (newMessage.trim() && socket && selectedCommunity) {
      const message = {
        text: newMessage,
        user: user.name,
        timestamp: new Date().toLocaleTimeString(),
        profile: user.profile,
      };
      socket.emit("sendMessage", { communityId: selectedCommunity._id, message });
      setNewMessage("");
    }
  };

  // Handle typing event
  const handleTyping = () => {
    if (socket && selectedCommunity) {
      socket.emit("typing", { communityId: selectedCommunity._id, username: user.name });
    }
  };

  return (
    <div className="bg-gradient-to-r from-sky-100 to-purple-50 min-h-screen">
      <Navbar />
      <h1 className="text-5xl text-center font-bold text-gray-800 pt-10 mb-6">Community Chat</h1>

      <div className="flex flex-col items-center p-6">
        {/* Communities List */}
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-4xl mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">My Communities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((community) => (
              <div
                key={community._id}
                onClick={() => setSelectedCommunity(community)}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-300"
              >
                <h3 className="font-bold text-lg">{community.name}</h3>
                <p className="text-sm text-gray-600">{community.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Section */}
        {selectedCommunity && (
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedCommunity.name}</h2>

            {/* Messages */}
            <div className="h-96 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-sky-400 scrollbar-track-gray-100">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
              ) : (
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="mb-3"
                    >
                      <div className="flex items-start gap-2">
                        {/* User Avatar */}
                        {message.profile ? (
                          <img
                            src={`${API_URL}${message.profile}`}
                            alt={message.user}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {message.user[0]}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className="flex flex-col">
                          <p className="font-semibold text-sm">{message.user}</p>
                          <div className="bg-sky-100 p-3 rounded-lg max-w-xs">
                            <p className="text-sm text-gray-800">{message.text}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{message.timestamp}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 mt-2"
                >
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                    {typingUser[0]}
                  </div>
                  <div className="bg-gray-200 p-2 rounded-lg">
                    <p className="text-sm text-gray-600">Typing...</p>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 transition-colors duration-300"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;