const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer');
const NGO = require('../models/NGO');
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Replace with a secure key

// 🔹 Get User Profile API
router.get('/', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized. No token provided!" });
        }

        const token = authHeader.split(" ")[1]; // ✅ Extract token after 'Bearer'
        const decoded = jwt.verify(token, JWT_SECRET);

        let user = await Volunteer.findById(decoded.id).select("-password");
        if (!user) {
            user = await NGO.findById(decoded.id).select("-password");
        }

        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        // Get user's registered events
        const registeredEvents = await Event.find({
            volunteers: decoded.id
        }).select('name date location description skills');

        // Convert user to object and add registered events
        const userData = user.toObject();
        userData.registeredEvents = registeredEvents;

        res.status(200).json(userData);

    } catch (error) {
        console.error("❌ Profile Fetch Error:", error);
        res.status(500).json({ message: "Internal server error!" });
    }
});

// 🔹 Get User's Registered Events API
router.get('/events', async (req, res) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized. No token provided!" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // Find all events where user is registered
        const registeredEvents = await Event.find({
            volunteers: decoded.id
        }).select('name date location description skills source');

        res.status(200).json({
            events: registeredEvents,
            count: registeredEvents.length
        });

    } catch (error) {
        console.error("❌ Registered Events Fetch Error:", error);
        res.status(500).json({ message: "Internal server error!" });
    }
});

module.exports = router;