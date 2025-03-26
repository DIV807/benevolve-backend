const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Fetch top 10 volunteers
router.get("/leaderboard", async (req, res) => {
    try {
        const topVolunteers = await User.find().sort({ points: -1 }).limit(10);
        res.json(topVolunteers);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Award points to a user
router.post("/award-points", async (req, res) => {
    const { userId, pointsToAdd } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.points += pointsToAdd;

        // Assign badges based on milestones
        if (user.points >= 100 && !user.badges.includes("Super Volunteer")) {
            user.badges.push("Super Volunteer 🏅");
        }
        if (user.points >= 50 && !user.badges.includes("Active Helper")) {
            user.badges.push("Active Helper 🎖");
        }
        if (user.points >= 20 && !user.badges.includes("Rising Star")) {
            user.badges.push("Rising Star ⭐");
        }

        await user.save();
        res.json({ message: "Points awarded!", user });
    } catch (error) {
        res.status(500).json({ error: "Error updating points" });
    }
});

module.exports = router;
