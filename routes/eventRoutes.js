const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

// 🟢 Get all events
router.get("/events", async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (error) {
        console.error("❌ Error fetching events:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
