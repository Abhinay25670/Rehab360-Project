require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const guardianRoutes = require("./routes/guardianRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const medicationRoutes = require("./routes/medicationRoutes");
const { initScheduler, triggerWeeklyReports } = require("./jobs/scheduledReports");
const { initMedicationReminders, triggerMedicationReminders, initUserScheduledReminders } = require("./jobs/medicationReminders");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const Message = require("./models/Message")
const app = express();

const devFrontendOrigin = "http://localhost:5173";
const extraOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const corsOrigins = [...new Set([devFrontendOrigin, ...extraOrigins])];

// Middleware
app.use(express.json());
app.use(cors({ origin: corsOrigins }));

// Database Connection
connectDB();

// Initialize scheduled jobs
initScheduler();
initMedicationReminders();
initUserScheduledReminders();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/guardian", guardianRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/medications", medicationRoutes);

// Manual trigger for weekly reports (for testing)
app.post("/api/admin/trigger-weekly-reports", async (req, res) => {
  try {
    await triggerWeeklyReports();
    res.json({ success: true, message: "Weekly reports triggered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual trigger for medication reminders (for testing)
app.post("/api/admin/trigger-medication-reminders", async (req, res) => {
  try {
    const { timeSlot } = req.body;
    await triggerMedicationReminders(timeSlot || 'morning');
    res.json({ success: true, message: `Medication reminders triggered for ${timeSlot || 'morning'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a community room
  socket.on("joinCommunity", (communityId) => {
    socket.join(communityId);
    console.log(`User joined community room: ${communityId}`);
  });

  // Send message to a specific community
  socket.on("sendMessage", ({ communityId, message }) => {
    console.log(`Message received in community ${communityId}:`, message);
    io.to(communityId).emit("receiveMessage", message);
  });

  // Handle typing events
  socket.on("typing", ({ communityId, username }) => {
    console.log(`${username} is typing in community ${communityId}`);
    socket.to(communityId).emit("userTyping", username); // Broadcast to all except the sender
  });


  // Join a personal room (userId-based)
  socket.on("joinUser", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private chat room`);
  });

  // Handle direct messages
  socket.on("sendPrivateMessage", async ({ sender, receiver, message }) => {
    try {
      // Save message to MongoDB
      const newMessage = new Message({ sender, receiver, message });
      await newMessage.save();

      // Emit message to the receiver's room
      io.to(receiver).emit("receivePrivateMessage", {
        sender,
        message,
        timestamp: newMessage.timestamp,
      });

      console.log(`Message from ${sender} to ${receiver}: ${message}`);
    } catch (error) {
      console.error("Error sending private message:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start the server (0.0.0.0 so phone/Expo Go on same Wi-Fi can connect)
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`🚀 Server running on http://${HOST}:${PORT}`));