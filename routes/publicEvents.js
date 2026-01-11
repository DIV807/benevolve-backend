const express = require("express");
const router = express.Router();
const EventFetcher = require("../services/eventFetcher");

router.get("/public-events", async (req, res) => {
  try {
    const city = req.query.city || "Mumbai";
    const query = req.query.q || "volunteer";

    const fetcher = new EventFetcher();
    
    // Fetch Indian volunteering events
    const events = await fetcher.fetchAllEvents(['India'], query);
    
    // Filter by city if specified
    const filteredEvents = city !== "all" 
      ? events.filter(e => e.location.toLowerCase().includes(city.toLowerCase()))
      : events;

    res.json(filteredEvents);
  } catch (err) {
    console.error("❌ Error fetching public events:", err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

module.exports = router;
