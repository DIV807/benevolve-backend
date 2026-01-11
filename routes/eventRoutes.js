const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const authenticateToken = require("../middleware/authenticateToken");
const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');

// Load ML model for search (same as server.js)
let mlModel = null;
let vocabIndex = {};

// Initialize ML model
(function() {
    try {
        const vocabPath = path.join(__dirname, '..', 'model', 'tfidf_vectorizer_vocab.json');
        vocabIndex = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
        
        const weightsPath = path.join(__dirname, '..', 'model', 'model_weights.json');
        const weightsData = JSON.parse(fs.readFileSync(weightsPath, 'utf-8'));

        mlModel = tf.sequential();
        mlModel.add(tf.layers.dense({ inputShape: [200], units: 64, activation: 'relu' }));
        mlModel.add(tf.layers.dense({ units: 32, activation: 'relu' }));
        mlModel.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

        const weightTensors = mlModel.getWeights().map((w, i) => tf.tensor(weightsData[i]));
        mlModel.setWeights(weightTensors);
    } catch (err) {
        console.warn("⚠️ Could not load ML model for search:", err.message);
    }
})();

function tokenize(text) {
    return text.toLowerCase().split(/\W+/).filter(Boolean);
}

function vectorize(text) {
    const vec = new Array(Object.keys(vocabIndex).length).fill(0);
    tokenize(text).forEach(word => {
        if (vocabIndex[word] !== undefined) vec[vocabIndex[word]] = 1;
    });
    return vec;
}

router.get("/events", async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 }); // Sort by date ascending
        res.status(200).json(events);
    } catch (error) {
        console.error("❌ Error fetching events:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Search route MUST be before the :eventId route to avoid conflicts
router.get("/events/search", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    try {
        const events = await Event.find();
        const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);

        // --- Stage 1: Filtering ---
        let filtered = events.filter(event => {
            const matchesLocation = tokens.some(t =>
                event.location.toLowerCase().includes(t)
            );
            const matchesSkill = tokens.some(t =>
                event.skills.some(skill => skill.toLowerCase().includes(t))
            );

            return matchesLocation || matchesSkill; 
        });

        if (filtered.length === 0) filtered = events; 

        // --- Stage 2: ML Ranking (if model is loaded) ---
        if (mlModel && Object.keys(vocabIndex).length > 0) {
            try {
                const qVec = vectorize(query);
                const scores = await Promise.all(filtered.map(async (event) => {
                    const eVec = vectorize(event.description + " " + event.skills.join(" "));
                    const input = tf.tensor2d([qVec.concat(eVec)]);
                    const pred = await mlModel.predict(input).data();
                    return { event, score: pred[0] };
                }));

                scores.sort((a, b) => b.score - a.score);

                return res.json({
                    results: scores.map(s => ({
                        ...s.event.toObject(),
                        relevance: s.score
                    })),
                    method: "filter+ml"
                });
            } catch (mlError) {
                console.warn("ML ranking failed, using filter only:", mlError.message);
            }
        }

        // Fallback to filter-only results
        res.json({
            results: filtered.map(event => ({
                ...event.toObject(),
                relevance: 0.8
            })),
            method: "filter"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get single event by ID (must validate ObjectId format)
router.get("/events/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;
        
        // Validate ObjectId format (24 hex characters)
        if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
            return res.status(400).json({ message: "Invalid event ID format" });
        }
        
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        
        res.status(200).json(event);
    } catch (error) {
        console.error("❌ Error fetching event:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid event ID" });
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Check if user is registered for an event
router.get("/events/:eventId/registered", authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        
        // Validate ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
            return res.status(400).json({ message: "Invalid event ID format" });
        }
        
        const userId = req.user.id;
        
        // Convert userId to string for comparison
        const userIdStr = userId.toString();
        
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        
        // Check if user is in volunteers array (convert all to strings for comparison)
        const isRegistered = event.volunteers && event.volunteers.some(
            volId => volId.toString() === userIdStr
        );
        
        res.status(200).json({ isRegistered });
    } catch (error) {
        console.error("❌ Error checking registration:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid event ID" });
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
