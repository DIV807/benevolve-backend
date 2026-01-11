
const express = require("express");
const Volunteer = require("../models/Volunteer");
const NGO = require("../models/NGO");
const router = express.Router();

router.get("/profile/:userId", async (req, res) => {
    const { userId } = req.params;
    let user = await Volunteer.findById(userId);

    if (!user) {
        user = await NGO.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
});

module.exports = router;
