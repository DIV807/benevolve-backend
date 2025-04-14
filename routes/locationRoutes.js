const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/location', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });

    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { format: 'json', q },
            timeout: 10000 
        });

        res.json(response.data);
    } catch (error) {
        console.error("❌ Error fetching location data:", error.message);
        res.status(500).json({ error: "Failed to fetch location data" });
    }
});

module.exports = router;