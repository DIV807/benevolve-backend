const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Volunteer = require("../models/Volunteer");
const NGO = require("../models/NGO");

const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; 

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        
        if (!email || !password) {
            return res.status(400).json({ error: " Email and password are required!" });
        }

        let user = await Volunteer.findOne({ email });
        let role = "volunteer";

        if (!user) {
            user = await NGO.findOne({ email });
            role = "ngo";
        }

        if (!user) {
            return res.status(404).json({ error: "Email not found. Please sign up." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: " Invalid password. Try again." });
        }

        // Generate JWT Token (expires in 7 days for better UX)
        const token = jwt.sign({ id: user._id, role }, SECRET_KEY, { expiresIn: "7d" });

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

        
        res.json({ 
            token, 
            userId: user._id, 
            role,
            userData 
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "❌ Server error. Please try again later." });
    }
});

module.exports = router;