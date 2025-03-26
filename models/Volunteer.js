const mongoose = require('mongoose');

const VolunteerSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    interests: String,
    availability: String
});

module.exports = mongoose.model('Volunteer', VolunteerSchema);
