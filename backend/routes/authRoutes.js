const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!trimmedEmail) return res.status(400).json({ message: "Valid email is required." });
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) return res.status(400).json({ message: "An account with this email already exists. Sign in instead." });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ name: String(name).trim(), email: trimmedEmail, password: hashedPassword });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Send user without password
    const userForClient = { _id: newUser._id, name: newUser.name, email: newUser.email };
    res.status(201).json({ message: "Signup successful.", token, newUser: userForClient });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: error.message || "Server error. Try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) return res.status(400).json({ message: "No account with this email. Sign up first." });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password." });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const userForClient = { _id: user._id, name: user.name, email: user.email };
    res.json({ token, user: userForClient });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message || "Server error. Try again." });
  }
});

module.exports = router;
