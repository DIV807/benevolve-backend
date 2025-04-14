const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

// GET all events
router.get("/events", async (req, res) => {
    try {
        const events = await Event.find(); // make sure your DB has event data
        res.status(200).json(events);
    } catch (error) {
        console.error("❌ Error fetching events:", error);
        res.status(500).json({ message: "Error fetching events" });
    }
});

module.exports = router;
