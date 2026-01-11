const mongoose = require('mongoose');


const User = require('./user');  // Update path to your User model if needed

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    skills: [String], 
    description: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        default: 'Manual'
    },
    externalId: {
        type: String,
        default: null
    },
    volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
