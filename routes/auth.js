const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Volunteer = require("../models/Volunteer");
const NGO = require("../models/NGO");

const router = express.Router();
const SECRET_KEY = "your_secret_key"; // Use .env file in production

// User Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate Input
        if (!email || !password) {
            return res.status(400).json({ error: "❌ Email and password are required!" });
        }

        let user = await Volunteer.findOne({ email });
        let role = "volunteer";

        if (!user) {
            user = await NGO.findOne({ email });
            role = "ngo";
        }

        if (!user) {
            return res.status(404).json({ error: "❌ Email not found. Please sign up." });
        }

        // Validate Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "❌ Invalid password. Try again." });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user._id, role }, SECRET_KEY, { expiresIn: "1h" });

        // Prepare additional data for response
        let userData;
        if (role === "volunteer") {
            userData = {
                name: user.name,
                email: user.email,
                interests: user.interests,
                availability: user.availability,
            };
        } else {
            userData = {
                name: user.name,
                email: user.email,
                missionStatement: user.missionStatement,
                areasOfOperation: user.areasOfOperation,
            };
        }

        // Send Response (Include user details for frontend)
        res.json({ 
            token, 
            userId: user._id, 
            role,
            userData // Send full user details
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "❌ Server error. Please try again later." });
    }
});

module.exports = router;